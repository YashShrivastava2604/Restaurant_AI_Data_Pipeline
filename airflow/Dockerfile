FROM apache/airflow:3.0.3

USER airflow

# Install dependencies needed by the AI enrichment task.
RUN pip install --no-cache-dir \
    databricks-sql-connector \
    python-dotenv \
    pyyaml \
    groq \
    openai \
    google-genai

# Keep dbt isolated from Airflow's Python dependencies.
RUN python -m venv /opt/airflow/dbt_venv && \
    /opt/airflow/dbt_venv/bin/pip install --no-cache-dir \
    "dbt-databricks==1.13.0"