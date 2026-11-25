# Restaurant Analytics & AI Platform

An end-to-end data engineering and AI analytics platform that transforms restaurant, order, customer, and review data into actionable business insights. It combines a cloud-based data pipeline with LLM-powered review intelligence, semantic search, and natural-language SQL querying.

## Features

- **Data Engineering Pipeline:** Processes 33M+ records across seven datasets using PySpark and Databricks.
- **Medallion Architecture:** Organizes data into Bronze, Silver, and Gold layers for ingestion, cleaning, transformation, and analytics.
- **Data Transformation:** Uses dbt to build fact tables, dimensions, and analytical data marts, with data quality tests and documentation.
- **Workflow Orchestration:** Apache Airflow coordinates dbt transformations and AI review-enrichment tasks.
- **AI Review Intelligence:** Uses LLMs to classify review sentiment, identify topics, and extract customer complaints.
- **RAG-Based Review Assistant:** Uses Gemini embeddings and cosine similarity to retrieve relevant reviews and generate context-grounded answers.
- **AI Text-to-SQL:** Converts natural-language questions into SQL using Groq, validates generated queries with SQLGlot, and executes them against Databricks.
- **Analytics Dashboard:** React-based interface for exploring restaurant analytics, review insights, AI conversations, SQL results, and pipeline activity.

## Technology Stack

| Category | Technologies |
|---|---|
| Programming | Python, SQL, TypeScript |
| Data Engineering | PySpark, Databricks |
| Cloud Storage | Google Cloud Storage (GCS) |
| Data Transformation | dbt |
| Orchestration | Apache Airflow |
| AI / LLM | Groq, Gemini |
| RAG & Retrieval | Gemini Embeddings, Cosine Similarity |
| SQL Validation | SQLGlot |
| Backend | FastAPI |
| Frontend | React, Vite, Tailwind CSS |
| Data Visualization | Recharts |

## Architecture & Workflow

1. **Ingestion:** Restaurant datasets are stored in Google Cloud Storage and loaded into Databricks.
2. **Bronze Layer:** Raw datasets are ingested into Delta tables.
3. **Silver Layer:** PySpark transformations clean and standardize the data.
4. **Gold Layer:** dbt builds analytical fact tables, dimensions, and business-oriented data marts.
5. **Orchestration:** Airflow coordinates transformation and AI enrichment workflows.
6. **AI Processing:** LLMs enrich customer reviews with sentiment, topics, and key issues. Gemini embeddings support semantic retrieval.
7. **Application Layer:** FastAPI exposes AI and analytics capabilities to a React dashboard.

## AI Capabilities

### Review Intelligence & RAG
Customer reviews are enriched with structured sentiment and topic information. The RAG assistant retrieves semantically relevant reviews and uses them as context to answer questions about customer experiences.

### Natural Language to SQL
Users can ask business questions in natural language. Groq generates SQL against approved Gold-layer tables, SQLGlot validates the query, and Databricks executes it. The interface displays the generated SQL, query results, and AI-generated interpretation.

## Project Goals

- Demonstrate an end-to-end data engineering workflow.
- Apply medallion architecture and analytical data modeling.
- Integrate LLMs into practical data analytics use cases.
- Make structured restaurant data accessible through natural-language interfaces.

---

**Note:** This project is developed as a learning and portfolio project. It demonstrates data engineering, workflow orchestration, and AI integration using cloud and open-source technologies.