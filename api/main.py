import logging
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from ai.rag_chat import answer_question
from ai.text_to_sql import generate_sql, validate_sql, execute_sql, explain_results
from ai.enrich_reviews import run_batch, BatchAlreadyRunningError

from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Restaurant AI Data Platform",
    description="AI-powered restaurant analytics using RAG, text-to-SQL, and review enrichment.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RAGRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=1000)


class RAGSource(BaseModel):
    similarity: float
    restaurant_name: str | None = None
    city: str | None = None
    rating: str | int | float | None = None
    sentiment_label: str | None = None
    topic: str | None = None
    key_issue: str | None = None
    review_text: str | None = None


class RAGResponse(BaseModel):
    answer: str
    sources: list[RAGSource]
    retrieved_count: int
    corpus_size: int


class TextToSQLRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=1000)


class TextToSQLResponse(BaseModel):
    question: str
    generated_sql: str
    columns: list[str]
    rows: list[dict[str, Any]]
    row_count: int
    answer: str


class EnrichmentRequest(BaseModel):
    batch_size: int = Field(default=5, ge=1, le=10)


class EnrichmentResponse(BaseModel):
    fetched: int
    successful: int
    failed: int
    by_provider: dict[str, int]
    failed_review_ids: list[str]
    target_table: str


@app.get("/")
def root():
    return {
        "message": "Restaurant AI Data Platform API",
        "endpoints": [
            "/health",
            "/ai/rag-chat",
            "/ai/text-to-sql",
            "/ai/enrich-reviews",
            "/docs",
        ],
    }


@app.get("/health")
def health():
    return {"status": "healthy", "service": "Restaurant AI Data Platform"}


@app.post("/ai/rag-chat", response_model=RAGResponse)
def rag_chat(request: RAGRequest):
    try:
        logger.info("Received RAG question.")
        return answer_question(request.question)
    except ValueError as error:
        logger.warning("RAG request validation failed: %s", error)
        raise HTTPException(status_code=400, detail=str(error))
    except FileNotFoundError:
        logger.exception("RAG embedding corpus not found.")
        raise HTTPException(status_code=503, detail="RAG review corpus is unavailable.")
    except Exception:
        logger.exception("RAG request failed.")
        raise HTTPException(status_code=500, detail="RAG request failed. Check server logs.")


@app.post("/ai/text-to-sql", response_model=TextToSQLResponse)
def text_to_sql(request: TextToSQLRequest):
    question = request.question.strip()
    try:
        logger.info("Received Text-to-SQL question.")
        generated_query = generate_sql(question)
        validated_query = validate_sql(generated_query)
        logger.info("SQL validation passed.")
        columns, rows = execute_sql(validated_query)
        logger.info("Databricks returned %d rows.", len(rows))
        answer = explain_results(question, validated_query, columns, rows)
        result_rows = [dict(zip(columns, row)) for row in rows]
        return {
            "question": question,
            "generated_sql": validated_query,
            "columns": columns,
            "rows": result_rows,
            "row_count": len(result_rows),
            "answer": answer,
        }
    except ValueError as error:
        logger.warning("Text-to-SQL validation failed: %s", error)
        raise HTTPException(status_code=400, detail=str(error))
    except Exception:
        logger.exception("Text-to-SQL request failed.")
        raise HTTPException(status_code=500, detail="Text-to-SQL request failed. Check server logs.")


@app.post("/ai/enrich-reviews", response_model=EnrichmentResponse)
def enrich_reviews(request: EnrichmentRequest):
    try:
        logger.info("Starting review enrichment batch of %d reviews.", request.batch_size)
        return run_batch(request.batch_size)
    except BatchAlreadyRunningError as error:
        raise HTTPException(status_code=409, detail=str(error))
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except FileNotFoundError:
        logger.exception("Enrichment configuration file not found.")
        raise HTTPException(status_code=503, detail="Enrichment configuration is unavailable.")
    except RuntimeError as error:
        logger.exception("Enrichment provider or runtime unavailable.")
        raise HTTPException(status_code=503, detail=str(error))
    except Exception:
        logger.exception("Review enrichment request failed.")
        raise HTTPException(status_code=500, detail="Review enrichment failed. Check server logs.")
