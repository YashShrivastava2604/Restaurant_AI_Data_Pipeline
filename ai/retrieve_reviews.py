
import json
import logging
import math
import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types


# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent

load_dotenv(PROJECT_ROOT / ".env")

EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIMENSIONS = 768
TOP_K = 5

CORPUS_FILE = (
    PROJECT_ROOT / "data" / "rag" / "review_embeddings.jsonl"
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------
# Load vector corpus
# ---------------------------------------------------------

def load_corpus():
    """Load stored reviews and their embeddings."""

    if not CORPUS_FILE.exists():
        raise FileNotFoundError(
            f"Embedding corpus not found: {CORPUS_FILE}"
        )

    records = []

    with open(CORPUS_FILE, "r", encoding="utf-8") as file:
        for line_number, line in enumerate(file, start=1):
            if not line.strip():
                continue

            try:
                record = json.loads(line)
                vector = record["embedding"]

                if len(vector) != EMBEDDING_DIMENSIONS:
                    raise ValueError(
                        f"Expected {EMBEDDING_DIMENSIONS} dimensions."
                    )

                records.append(record)

            except (json.JSONDecodeError, KeyError, ValueError) as error:
                logger.warning(
                    "Skipping invalid record at line %s: %s",
                    line_number,
                    error,
                )

    if not records:
        raise ValueError("No valid review embeddings found.")

    logger.info("Loaded %s review embeddings.", len(records))

    return records


# ---------------------------------------------------------
# Generate query embedding
# ---------------------------------------------------------

def generate_query_embedding(query):
    """Convert a user query into a Gemini embedding."""

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise EnvironmentError("GEMINI_API_KEY is missing.")

    client = genai.Client(api_key=api_key)

    try:
        response = client.models.embed_content(
            model=EMBEDDING_MODEL,
            contents=query,
            config=types.EmbedContentConfig(
                task_type="RETRIEVAL_QUERY",
                output_dimensionality=EMBEDDING_DIMENSIONS,
            ),
        )

        if not response.embeddings:
            raise ValueError("Gemini returned no query embedding.")

        vector = response.embeddings[0].values

        if len(vector) != EMBEDDING_DIMENSIONS:
            raise ValueError(
                f"Expected {EMBEDDING_DIMENSIONS} dimensions, "
                f"received {len(vector)}."
            )

        return vector

    finally:
        client.close()


# ---------------------------------------------------------
# Cosine similarity
# ---------------------------------------------------------

def cosine_similarity(vector_a, vector_b):
    """Calculate cosine similarity between two vectors."""

    if len(vector_a) != len(vector_b):
        raise ValueError("Vector dimensions do not match.")

    dot_product = sum(
        a * b for a, b in zip(vector_a, vector_b)
    )

    magnitude_a = math.sqrt(sum(a * a for a in vector_a))
    magnitude_b = math.sqrt(sum(b * b for b in vector_b))

    if magnitude_a == 0 or magnitude_b == 0:
        return 0.0

    return dot_product / (magnitude_a * magnitude_b)


# ---------------------------------------------------------
# Retrieve relevant reviews
# ---------------------------------------------------------

def retrieve_reviews(query, records, top_k=TOP_K):
    """Return the most semantically relevant reviews."""

    query_vector = generate_query_embedding(query)

    results = []

    for record in records:
        similarity = cosine_similarity(
            query_vector,
            record["embedding"],
        )

        results.append({
            "similarity": similarity,
            "review": record,
        })

    results.sort(
        key=lambda item: item["similarity"],
        reverse=True,
    )

    return results[:top_k]


# ---------------------------------------------------------
# Display results
# ---------------------------------------------------------

def display_results(query, results):
    """Display retrieved reviews and their similarity scores."""

    print("\n" + "=" * 75)
    print(f"QUERY: {query}")
    print("=" * 75)

    for rank, result in enumerate(results, start=1):
        review = result["review"]

        print(f"\n#{rank} | Similarity: {result['similarity']:.4f}")
        print("-" * 75)

        print(
            f"Restaurant: {review.get('restaurant_name')}"
        )
        print(f"City: {review.get('city')}")
        print(f"Rating: {review.get('rating')}")
        print(f"Sentiment: {review.get('sentiment_label')}")
        print(f"Topic: {review.get('topic')}")
        print(f"Key issue: {review.get('key_issue')}")
        print(f"Review: {review.get('comment')}")

    print("\n" + "=" * 75)


# ---------------------------------------------------------
# Main
# ---------------------------------------------------------

def main():
    logger.info("Starting semantic review retrieval.")

    records = load_corpus()

    print("\nRestaurant Review Search")
    print("Enter a question to retrieve relevant reviews.")
    print("Type 'exit' to quit.\n")

    while True:
        query = input("Query: ").strip()

        if query.lower() in {"exit", "quit"}:
            print("Exiting retrieval engine.")
            break

        if not query:
            continue

        try:
            results = retrieve_reviews(
                query=query,
                records=records,
                top_k=TOP_K,
            )

            display_results(query, results)

        except Exception:
            logger.exception("Retrieval failed.")


if __name__ == "__main__":
    main()
