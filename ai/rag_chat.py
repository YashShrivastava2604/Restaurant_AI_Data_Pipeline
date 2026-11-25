
import os
import json
import logging
from pathlib import Path
from functools import lru_cache

from dotenv import load_dotenv
from google import genai
from groq import Groq


# --------------------------------------------------
# Configuration
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent
EMBEDDINGS_FILE = BASE_DIR / "data" / "rag" / "review_embeddings.jsonl"

load_dotenv(BASE_DIR / ".env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIMENSIONS = 768
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
TOP_K = 5

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

logger = logging.getLogger(__name__)


# --------------------------------------------------
# Initialize clients lazily
# --------------------------------------------------

@lru_cache(maxsize=1)
def get_gemini_client():
    if not GEMINI_API_KEY:
        raise EnvironmentError("GEMINI_API_KEY is missing from .env")

    return genai.Client(api_key=GEMINI_API_KEY)


@lru_cache(maxsize=1)
def get_groq_client():
    if not GROQ_API_KEY:
        raise EnvironmentError("GROQ_API_KEY is missing from .env")

    return Groq(api_key=GROQ_API_KEY)


# --------------------------------------------------
# Load existing review embeddings
# --------------------------------------------------

@lru_cache(maxsize=1)
def load_embeddings():
    if not EMBEDDINGS_FILE.exists():
        raise FileNotFoundError(
            f"Embedding file not found: {EMBEDDINGS_FILE}"
        )

    records = []

    with open(EMBEDDINGS_FILE, "r", encoding="utf-8") as file:
        for line_number, line in enumerate(file, start=1):
            if not line.strip():
                continue

            try:
                record = json.loads(line)
                embedding = record.get("embedding")

                if not isinstance(embedding, list):
                    logger.warning(
                        "Skipping record %s: missing embedding",
                        line_number
                    )
                    continue

                if len(embedding) != EMBEDDING_DIMENSIONS:
                    logger.warning(
                        "Skipping record %s: unexpected embedding dimensions",
                        line_number
                    )
                    continue

                record["_embedding"] = embedding
                records.append(record)

            except json.JSONDecodeError:
                logger.warning(
                    "Skipping invalid JSON on line %s",
                    line_number
                )

    if not records:
        raise ValueError("No valid review embeddings were loaded.")

    logger.info("Loaded %s review embeddings.", len(records))
    return records


# --------------------------------------------------
# Generate query embedding
# --------------------------------------------------

def generate_query_embedding(query):
    client = get_gemini_client()

    response = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=query,
        config={
            "task_type": "RETRIEVAL_QUERY",
            "output_dimensionality": EMBEDDING_DIMENSIONS
        }
    )

    if not response.embeddings:
        raise ValueError("Gemini returned no query embedding.")

    return response.embeddings[0].values


# --------------------------------------------------
# Cosine similarity
# --------------------------------------------------

def cosine_similarity(vector_a, vector_b):
    dot_product = sum(
        a * b for a, b in zip(vector_a, vector_b)
    )

    magnitude_a = sum(a * a for a in vector_a) ** 0.5
    magnitude_b = sum(b * b for b in vector_b) ** 0.5

    if magnitude_a == 0 or magnitude_b == 0:
        return 0.0

    return dot_product / (magnitude_a * magnitude_b)


# --------------------------------------------------
# Retrieve relevant reviews
# --------------------------------------------------

def retrieve_reviews(query, records=None):
    if records is None:
        records = load_embeddings()

    query_embedding = generate_query_embedding(query)

    results = []

    for record in records:
        similarity = cosine_similarity(
            query_embedding,
            record["_embedding"]
        )

        results.append({
            "similarity": similarity,
            "review": record
        })

    results.sort(
        key=lambda item: item["similarity"],
        reverse=True
    )

    return results[:TOP_K]


# --------------------------------------------------
# Prepare retrieved context
# --------------------------------------------------

def get_review_text(review):
    return (
        review.get("comment")
        or review.get("review_text")
        or review.get("review")
        or "Not available"
    )


def build_context(results):
    context_parts = []

    for index, result in enumerate(results, start=1):
        review = result["review"]

        context_parts.append(
            f"""
Review {index}
Similarity: {result['similarity']:.4f}
Restaurant: {review.get('restaurant_name', 'Unknown')}
City: {review.get('city', 'Unknown')}
Rating: {review.get('rating', 'Unknown')}
Sentiment: {review.get('sentiment_label', 'Unknown')}
Topic: {review.get('topic', 'Unknown')}
Key issue: {review.get('key_issue', 'Not specified')}
Review text: {get_review_text(review)}
""".strip()
        )

    return "\n\n".join(context_parts)


# --------------------------------------------------
# Generate grounded answer using Groq
# --------------------------------------------------

def generate_answer(query, context):
    system_prompt = """
You are a restaurant review intelligence assistant.

Answer user questions using ONLY the retrieved review evidence
provided in the conversation.

Rules:
1. Never invent restaurants, locations, ratings, or complaints.
2. Do not present retrieved examples as complete statistical results.
3. If evidence is insufficient, explicitly say so.
4. Distinguish facts from reasonable interpretations.
5. When mentioning a restaurant, include its city when available.
6. Be concise, clear, and conversational.
7. If the reviews do not directly answer the question, explain
   what the available reviews actually show instead.
8. Similarity scores indicate relevance to the query, not the
   severity or frequency of a complaint.
"""

    user_prompt = f"""
Question:
{query}

Retrieved review evidence:
{context}

Provide an answer grounded in this evidence.
"""

    client = get_groq_client()

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        max_completion_tokens=700,
        temperature=0.2
    )

    answer = response.choices[0].message.content

    if not answer:
        raise ValueError("Groq returned an empty answer.")

    return answer.strip()


# --------------------------------------------------
# Reusable RAG service function
# --------------------------------------------------

def answer_question(query):
    query = query.strip()

    if not query:
        raise ValueError("Question cannot be empty.")

    records = load_embeddings()
    results = retrieve_reviews(query, records)

    context = build_context(results)
    answer = generate_answer(query, context)

    sources = []

    for result in results:
        review = result["review"]

        sources.append({
            "similarity": round(result["similarity"], 4),
            "restaurant_name": review.get("restaurant_name"),
            "city": review.get("city"),
            "rating": review.get("rating"),
            "sentiment_label": review.get("sentiment_label"),
            "topic": review.get("topic"),
            "key_issue": review.get("key_issue"),
            "review_text": get_review_text(review)
        })

    return {
        "answer": answer,
        "sources": sources,
        "retrieved_count": len(sources),
        "corpus_size": len(records)
    }


# --------------------------------------------------
# Main terminal chat application
# --------------------------------------------------

def main():
    logger.info("Starting Restaurant Review RAG Chat.")

    records = load_embeddings()

    print("\n" + "=" * 65)
    print("       RESTAURANT REVIEW INTELLIGENCE - RAG CHAT")
    print("=" * 65)
    print(f"Loaded reviews: {len(records)}")
    print(f"Embedding model: {EMBEDDING_MODEL}")
    print(f"Answer model: {GROQ_MODEL}")
    print("\nAsk questions about restaurant reviews.")
    print("Type 'exit' to quit.")

    while True:
        try:
            query = input("\nYou: ").strip()

            if query.lower() in {"exit", "quit"}:
                print("\nGoodbye!")
                break

            if not query:
                continue

            print("\nSearching relevant reviews...")

            result = answer_question(query)

            print("\n" + "=" * 65)
            print("AI ASSISTANT")
            print("=" * 65)
            print(result["answer"])

            print("\n" + "-" * 65)
            print("RETRIEVED EVIDENCE")
            print("-" * 65)

            for index, source in enumerate(result["sources"], start=1):
                print(f"\n{index}. {source['restaurant_name']}")
                print(f"   City: {source['city']}")
                print(f"   Similarity: {source['similarity']}")
                print(f"   Sentiment: {source['sentiment_label']}")
                print(f"   Review: {source['review_text']}")

        except KeyboardInterrupt:
            print("\n\nChat interrupted. Goodbye!")
            break

        except Exception as error:
            logger.exception("RAG request failed.")
            print(f"\nRequest failed: {error}")


if __name__ == "__main__":
    main()
