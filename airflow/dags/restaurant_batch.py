
from datetime import datetime

from airflow import DAG
from airflow.providers.standard.operators.bash import BashOperator


# Paths inside the Airflow container
DBT = "/opt/airflow/dbt_venv/bin/dbt"
DBT_PROJECT = "/opt/airflow/dbt/restaurant_pipeline"
DBT_PROFILES = "/home/airflow/.dbt"
DBT_LOGS = "/tmp/dbt-logs"
ENRICH_SCRIPT = "/opt/airflow/ai/enrich_reviews.py"
DBT_TARGET = "/tmp/dbt-target"


with DAG(
    dag_id="restaurant_ai_pipeline",
    description="Databricks, dbt and AI review enrichment pipeline",
    start_date=datetime(2026, 1, 1),
    schedule=None,
    catchup=False,
    tags=["restaurant", "databricks", "dbt", "ai"],
) as dag:

    # Build core models and run their tests.
    dbt_build_core = BashOperator(
        task_id="dbt_build_core",
        bash_command=(
            f"{DBT} build "
            f"--exclude tag:ai "
            f"--project-dir {DBT_PROJECT} "
            f"--profiles-dir {DBT_PROFILES} "
            f"--log-path {DBT_LOGS} "
            f"--target-path {DBT_TARGET} "
        ),
    )

    # Enrich pending restaurant reviews using the configured AI provider.
    enrich_reviews = BashOperator(
        task_id="enrich_reviews",
        bash_command=f"python {ENRICH_SCRIPT}",
    )

    # Build AI analytics models after enrichment completes.
    dbt_build_ai = BashOperator(
        task_id="dbt_build_ai",
        bash_command=(
            f"{DBT} build "
            f"--select tag:ai "
            f"--project-dir {DBT_PROJECT} "
            f"--profiles-dir {DBT_PROFILES} "
            f"--log-path {DBT_LOGS} "
            f"--target-path {DBT_TARGET} "
        ),
    )

    dbt_build_core >> enrich_reviews >> dbt_build_ai
