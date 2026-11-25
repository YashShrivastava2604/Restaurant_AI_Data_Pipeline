import json
import logging
import os
import re
import sys
import threading
import time
from collections import deque
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml
from dotenv import load_dotenv
from groq import Groq
from openai import OpenAI

# Configuration
ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")

SOURCE_TABLE = "workspace.silver.reviews"
TARGET_TABLE = "workspace.ai.review_enriched"
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "100"))
MAX_API_BATCH_SIZE = 10
ENRICHMENT_LOCK = threading.Lock()
MAX_WORKERS = int(os.getenv("MAX_WORKERS", "1"))
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "2"))
MAX_OUTPUT_TOKENS = int(os.getenv("MAX_OUTPUT_TOKENS", "512"))

GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
GROQ_RPM = int(os.getenv("GROQ_RPM", "25"))
GROQ_TPM = int(os.getenv("GROQ_TPM", "7000"))

ENABLE_CF = os.getenv("ENABLE_CLOUDFLARE_FALLBACK", "false").lower() == "true"
ENABLE_GEMINI = os.getenv("ENABLE_GEMINI_FALLBACK", "false").lower() == "true"
ENABLE_OPENAI = os.getenv("ENABLE_OPENAI_FALLBACK", "false").lower() == "true"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("review-enrichment")

LABELS = {"positive", "negative", "neutral"}
TOPICS = {"food quality", "delivery", "pricing", "service", "packaging", "other"}

# JSON mode enforces JSON syntax; validate the exact fields locally.
PROMPT = """
Classify the restaurant review. Return exactly one JSON object, with no
Markdown or code fences, containing exactly these keys:
{
  "sentiment_label": "positive",
  "sentiment_score": 0.8,
  "topic": "food quality",
  "key_issue": "Fresh and tasty food"
}
Rules:
- sentiment_label: positive, negative, or neutral.
- sentiment_score: number from -1.0 (very negative) to 1.0 (very positive).
- topic: food quality, delivery, pricing, service, packaging, or other.
- key_issue: concise main complaint or praise; use "" if none.
- Do not invent details. Consider sarcasm and mixed sentiment.
- Return valid JSON only. Do not add other keys.
"""


class RateLimiter:
    """Sliding-window request/token limiter shared by provider workers."""

    def __init__(self, rpm: int, tpm: int):
        self.rpm, self.tpm = max(1, rpm), max(1, tpm)
        self.requests, self.tokens = deque(), deque()
        self.lock = threading.Lock()

    def acquire(self, estimate: int):
        estimate = min(max(1, estimate), self.tpm)
        while True:
            with self.lock:
                now = time.monotonic()
                while self.requests and now - self.requests[0] >= 60:
                    self.requests.popleft()
                while self.tokens and now - self.tokens[0][0] >= 60:
                    self.tokens.popleft()

                used = sum(n for _, n in self.tokens)
                request_ok = len(self.requests) < self.rpm
                token_ok = used + estimate <= self.tpm
                if request_ok and token_ok:
                    self.requests.append(now)
                    self.tokens.append((now, estimate))
                    return

                waits = []
                if not request_ok:
                    waits.append(60 - (now - self.requests[0]))
                if not token_ok and self.tokens:
                    waits.append(60 - (now - self.tokens[0][0]))
                delay = max(0.5, max(waits) if waits else 1.0)

            log.info("Rate limiter waiting %.1f seconds...", delay)
            time.sleep(delay)


LIMITERS = {
    "groq": RateLimiter(GROQ_RPM, GROQ_TPM),
    "cloudflare": RateLimiter(
        int(os.getenv("CLOUDFLARE_RPM", "60")),
        int(os.getenv("CLOUDFLARE_TPM", "100000")),
    ),
    "gemini": RateLimiter(
        int(os.getenv("GEMINI_RPM", "10")),
        int(os.getenv("GEMINI_TPM", "20000")),
    ),
    "openai": RateLimiter(
        int(os.getenv("OPENAI_RPM", "10")),
        int(os.getenv("OPENAI_TPM", "20000")),
    ),
}


@dataclass
class Provider:
    name: str
    model: str
    client: Any
    limiter: RateLimiter


def build_providers() -> list[Provider]:
    providers = []
    key = os.getenv("GROQ_API_KEY")
    if key:
        providers.append(Provider(
            "groq", GROQ_MODEL,
            Groq(api_key=key, max_retries=0, timeout=90),
            LIMITERS["groq"],
        ))
    else:
        log.warning("GROQ_API_KEY is missing.")

    if ENABLE_CF:
        account, token = os.getenv("CLOUDFLARE_ACCOUNT_ID"), os.getenv("CLOUDFLARE_API_TOKEN")
        if account and token:
            providers.append(Provider(
                "cloudflare", os.getenv("CLOUDFLARE_MODEL", "@cf/openai/gpt-oss-120b"),
                OpenAI(
                    api_key=token,
                    base_url=f"https://api.cloudflare.com/client/v4/accounts/{account}/ai/v1",
                    max_retries=0, timeout=90,
                ),
                LIMITERS["cloudflare"],
            ))
        else:
            log.warning("Cloudflare fallback enabled but credentials are missing.")

    if ENABLE_GEMINI:
        key = os.getenv("GEMINI_API_KEY")
        if key:
            try:
                from google import genai
                providers.append(Provider(
                    "gemini", os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
                    genai.Client(api_key=key), LIMITERS["gemini"],
                ))
            except ImportError:
                log.warning("Install Gemini SDK with: pip install google-genai")
        else:
            log.warning("Gemini fallback enabled but GEMINI_API_KEY is missing.")

    if ENABLE_OPENAI:
        key = os.getenv("OPENAI_API_KEY")
        if key:
            providers.append(Provider(
                "openai", os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                OpenAI(api_key=key, max_retries=0, timeout=90),
                LIMITERS["openai"],
            ))
        else:
            log.warning("OpenAI fallback enabled but OPENAI_API_KEY is missing.")

    if not providers:
        raise RuntimeError("No AI providers configured; check .env.")
    log.info("Provider order: %s", " -> ".join(p.name for p in providers))
    return providers


def parse_json(content: str) -> dict:
    if not content:
        raise ValueError("Model returned an empty response.")
    content = content.strip()
    content = re.sub(r"^```(?:json)?\\s*", "", content, flags=re.IGNORECASE)
    content = re.sub(r"\\s*```$", "", content)
    start, end = content.find("{"), content.rfind("}")
    if start < 0 or end < start:
        raise ValueError(f"No JSON object in response: {content[:250]}")
    result = json.loads(content[start:end + 1])
    if not isinstance(result, dict):
        raise ValueError("Response must be a JSON object.")
    return result


def validate(data: dict) -> dict:
    required = {"sentiment_label", "sentiment_score", "topic", "key_issue"}
    missing = required - set(data)
    if missing:
        raise ValueError(f"Missing fields: {sorted(missing)}")

    label = str(data["sentiment_label"]).strip().lower()
    topic = str(data["topic"]).strip().lower()
    if label not in LABELS:
        raise ValueError(f"Invalid sentiment label: {label}")
    if topic not in TOPICS:
        raise ValueError(f"Invalid topic: {topic}")
    if isinstance(data["sentiment_score"], bool):
        raise ValueError("Sentiment score cannot be boolean.")

    score = float(data["sentiment_score"])
    if not -1 <= score <= 1:
        raise ValueError(f"Sentiment score out of range: {score}")

    issue = data["key_issue"]
    issue = "" if issue is None else str(issue).strip()
    return {
        "sentiment_label": label,
        "sentiment_score": score,
        "topic": topic,
        "key_issue": issue,
    }


def token_estimate(comment: str) -> int:
    return max(400, (len(PROMPT) + len(comment)) // 3 + MAX_OUTPUT_TOKENS)


def usage_from_openai(response) -> dict:
    usage = getattr(response, "usage", None)
    return {
        "input_tokens": getattr(usage, "prompt_tokens", None),
        "output_tokens": getattr(usage, "completion_tokens", None),
    }


def call_groq(provider: Provider, comment: str):
    response = provider.client.chat.completions.create(
        model=provider.model,
        messages=[
            {"role": "system", "content": PROMPT},
            {"role": "user", "content": f"Classify this review as JSON only:\n{comment}"},
        ],
        temperature=0,
        max_completion_tokens=MAX_OUTPUT_TOKENS,
        response_format={"type": "json_object"},
        reasoning_effort="low",
        reasoning_format="hidden",
    )
    choice = response.choices[0]
    if choice.finish_reason == "length":
        raise ValueError("Groq response was truncated; increase MAX_OUTPUT_TOKENS.")
    return parse_json(choice.message.content), usage_from_openai(response)


def call_openai_compatible(provider: Provider, comment: str):
    response = provider.client.chat.completions.create(
        model=provider.model,
        messages=[
            {"role": "system", "content": PROMPT},
            {"role": "user", "content": f"Classify this review as JSON only:\n{comment}"},
        ],
        temperature=0,
        max_tokens=MAX_OUTPUT_TOKENS,
        response_format={"type": "json_object"},
    )
    choice = response.choices[0]
    if choice.finish_reason == "length":
        raise ValueError(f"{provider.name} response was truncated.")
    return parse_json(choice.message.content), usage_from_openai(response)


def call_gemini(provider: Provider, comment: str):
    response = provider.client.models.generate_content(
        model=provider.model,
        contents=f"{PROMPT}\nReview:\n{comment}",
        config={
            "temperature": 0,
            "max_output_tokens": MAX_OUTPUT_TOKENS,
            "response_mime_type": "application/json",
        },
    )
    usage = getattr(response, "usage_metadata", None)
    return parse_json(response.text), {
        "input_tokens": getattr(usage, "prompt_token_count", None),
        "output_tokens": getattr(usage, "candidates_token_count", None),
    }


def call_provider(provider: Provider, comment: str):
    provider.limiter.acquire(token_estimate(comment))
    if provider.name == "groq":
        return call_groq(provider, comment)
    if provider.name in {"cloudflare", "openai"}:
        return call_openai_compatible(provider, comment)
    if provider.name == "gemini":
        return call_gemini(provider, comment)
    raise ValueError(f"Unsupported provider: {provider.name}")


def retryable(error: Exception) -> bool:
    status = getattr(error, "status_code", None)
    return status == 429 or status in {408, 500, 502, 503, 504}


def retry_after(error: Exception):
    response = getattr(error, "response", None)
    headers = getattr(response, "headers", None)
    value = headers.get("retry-after") if headers else None
    try:
        return max(1.0, float(value)) if value else None
    except (TypeError, ValueError):
        return None


def classify_review(providers: list[Provider], comment: str):
    errors = []
    for provider in providers:
        for attempt in range(MAX_RETRIES + 1):
            started = time.perf_counter()
            try:
                raw, usage = call_provider(provider, comment)
                result = validate(raw)
                latency = int((time.perf_counter() - started) * 1000)
                return result, provider.name, provider.model, usage, latency
            except Exception as error:
                errors.append(f"{provider.name}: {type(error).__name__}: {error}")
                if retryable(error) and attempt < MAX_RETRIES:
                    delay = retry_after(error) or min(2 ** (attempt + 1), 30)
                    log.warning(
                        "%s temporary error; retry %s/%s in %.1fs: %s",
                        provider.name, attempt + 1, MAX_RETRIES, delay, error,
                    )
                    time.sleep(delay)
                    continue
                log.error("%s failed; moving on: %s", provider.name, error)
                break
    raise RuntimeError("All configured providers failed: " + " | ".join(errors))


def get_databricks_connection():
    profile_path = Path.home() / ".dbt" / "profiles.yml"
    if not profile_path.exists():
        raise FileNotFoundError(f"dbt profile not found: {profile_path}")
    with open(profile_path, encoding="utf-8") as file:
        profiles = yaml.safe_load(file)
    profile = profiles["restaurant_pipeline"]
    config = profile["outputs"][profile["target"]]
    from databricks import sql
    return sql.connect(
        server_hostname=config["host"],
        http_path=config["http_path"],
        access_token=config["token"],
    )


def create_target_table(cursor):
    cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS {TARGET_TABLE} (
            review_id STRING,
            sentiment_label STRING,
            sentiment_score DOUBLE,
            topic STRING,
            key_issue STRING,
            model STRING,
            enriched_at TIMESTAMP,
            provider STRING,
            latency_ms BIGINT,
            input_tokens BIGINT,
            output_tokens BIGINT
        ) USING DELTA
    """)
    cursor.execute(f"DESCRIBE TABLE {TARGET_TABLE}")
    columns = {row[0].lower() for row in cursor.fetchall() if row and row[0]}
    for name, dtype in {
        "provider": "STRING",
        "latency_ms": "BIGINT",
        "input_tokens": "BIGINT",
        "output_tokens": "BIGINT",
    }.items():
        if name not in columns:
            cursor.execute(f"ALTER TABLE {TARGET_TABLE} ADD COLUMNS ({name} {dtype})")


def fetch_pending_reviews(cursor, batch_size: int = BATCH_SIZE) -> list[tuple]:
    if isinstance(batch_size, bool) or not isinstance(batch_size, int) or batch_size < 1:
        raise ValueError("batch_size must be a positive integer.")

    cursor.execute(f"""
        SELECT CAST(r.review_id AS STRING), r.comment
        FROM {SOURCE_TABLE} r
        LEFT ANTI JOIN {TARGET_TABLE} e
          ON CAST(r.review_id AS STRING) = e.review_id
        WHERE r.comment IS NOT NULL AND TRIM(r.comment) <> ''
        ORDER BY r.review_id
        LIMIT {batch_size}
    """)
    return cursor.fetchall()


def process_review(review: tuple, providers: list[Provider]) -> dict:
    review_id, comment = review
    try:
        result, provider, model, usage, latency = classify_review(providers, comment)
        return {
            "review_id": str(review_id),
            **result,
            "provider": provider,
            "model": model,
            "latency_ms": latency,
            "input_tokens": usage.get("input_tokens"),
            "output_tokens": usage.get("output_tokens"),
            "success": True,
        }
    except Exception as error:
        log.error("Review %s failed: %s", review_id, error)
        return {"review_id": str(review_id), "success": False, "error": str(error)}


def save_results(cursor, results: list[dict]) -> int:
    rows = [row for row in results if row["success"]]
    if not rows:
        return 0

    query = f"""
        INSERT INTO {TARGET_TABLE} (
            review_id, sentiment_label, sentiment_score, topic, key_issue,
            model, enriched_at, provider, latency_ms, input_tokens, output_tokens
        )
        VALUES (?, ?, ?, ?, ?, ?, current_timestamp(), ?, ?, ?, ?)
    """
    params = [
        (
            r["review_id"], r["sentiment_label"], r["sentiment_score"],
            r["topic"], r["key_issue"], r["model"], r["provider"],
            r["latency_ms"], r["input_tokens"], r["output_tokens"],
        )
        for r in rows
    ]
    cursor.executemany(query, params)
    return len(rows)


class BatchAlreadyRunningError(RuntimeError):
    """Raised when another review-enrichment batch is already running."""


def _process_batch(batch_size: int) -> dict:
    providers = build_providers()
    connection = get_databricks_connection()
    cursor = connection.cursor()
    try:
        create_target_table(cursor)
        reviews = fetch_pending_reviews(cursor, batch_size)
        if not reviews:
            log.info("No pending reviews. Enrichment is up to date.")
            return {
                "fetched": 0,
                "successful": 0,
                "failed": 0,
                "by_provider": {},
                "failed_review_ids": [],
                "target_table": TARGET_TABLE,
            }

        log.info("Fetched %s reviews. Workers: %s", len(reviews), MAX_WORKERS)
        results = []
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
            futures = [pool.submit(process_review, row, providers) for row in reviews]
            for future in as_completed(futures):
                results.append(future.result())

        saved = save_results(cursor, results)
        failed_rows = [row for row in results if not row["success"]]
        by_provider = {}
        for row in results:
            if row["success"]:
                by_provider[row["provider"]] = by_provider.get(row["provider"], 0) + 1

        summary = {
            "fetched": len(reviews),
            "successful": saved,
            "failed": len(failed_rows),
            "by_provider": by_provider,
            "failed_review_ids": [row["review_id"] for row in failed_rows],
            "target_table": TARGET_TABLE,
        }

        log.info("--------------- Batch summary ---------------")
        log.info("Fetched:    %s", summary["fetched"])
        log.info("Successful: %s", summary["successful"])
        log.info("Failed:     %s", summary["failed"])
        log.info("Providers:  %s", by_provider)
        log.info("Target:     %s", TARGET_TABLE)
        log.info("----------------------------------------------")
        return summary
    finally:
        cursor.close()
        connection.close()


def run_batch(batch_size: int = 5) -> dict:
    """Run one small enrichment batch for the FastAPI endpoint."""
    if isinstance(batch_size, bool) or not isinstance(batch_size, int):
        raise ValueError("batch_size must be an integer.")
    if not 1 <= batch_size <= MAX_API_BATCH_SIZE:
        raise ValueError(f"API batch_size must be between 1 and {MAX_API_BATCH_SIZE}.")
    if not ENRICHMENT_LOCK.acquire(blocking=False):
        raise BatchAlreadyRunningError("A review-enrichment batch is already running.")
    try:
        return _process_batch(batch_size)
    finally:
        ENRICHMENT_LOCK.release()


def main():
    # Preserve the CLI behavior: use BATCH_SIZE from the .env file.
    _process_batch(BATCH_SIZE)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log.warning("Interrupted by user.")
        sys.exit(130)
    except Exception:
        log.exception("Review enrichment failed.")
        sys.exit(1)
