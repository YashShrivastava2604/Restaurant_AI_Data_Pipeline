
import os
import json
import logging
from pathlib import Path

import sqlglot
from sqlglot import exp
from dotenv import load_dotenv
from groq import Groq
from databricks import sql


# --------------------------------------------------
# Configuration
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

DATABRICKS_SERVER_HOSTNAME = os.getenv("DATABRICKS_SERVER_HOSTNAME")
DATABRICKS_HTTP_PATH = os.getenv("DATABRICKS_HTTP_PATH")
DATABRICKS_TOKEN = os.getenv("DATABRICKS_TOKEN")

CATALOG = "workspace"
SCHEMA = "gold"

MAX_ROWS = 200
MAX_SQL_LENGTH = 10000

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

logger = logging.getLogger(__name__)


# --------------------------------------------------
# Approved Gold schema
# --------------------------------------------------

TABLES = {
    "fact_orders": {
        "description": "One row per order. Use for order-level analysis.",
        "columns": [
            "order_id", "customer_id", "restaurant_id", "date_key",
            "order_timestamp", "order_date", "items_count", "sales_qty",
            "subtotal", "discount", "delivery_fee", "gst", "sales_amount",
            "currency", "payment_method", "order_status",
            "customer_rating", "delivery_time_min"
        ]
    },
    "fact_order_items": {
        "description": "One row per order item. Use for food and item-level analysis.",
        "columns": [
            "order_item_id", "order_id", "restaurant_id", "food_id",
            "price", "quantity", "line_amount"
        ]
    },
    "dim_customers": {
        "description": "Customer attributes.",
        "columns": [
            "customer_id", "customer_name", "email", "age", "gender",
            "marital_status", "occupation", "monthly_income",
            "educational_qualification", "family_size"
        ]
    },
    "dim_restaurants": {
        "description": "Restaurant attributes including city and cuisine.",
        "columns": [
            "restaurant_id", "restaurant_name", "city", "rating",
            "rating_count", "cost_inr", "cuisine", "address"
        ]
    },
    "dim_food": {
        "description": "Food attributes.",
        "columns": ["food_id", "food_name", "food_category"]
    },
    "dim_date": {
        "description": "Calendar dimension.",
        "columns": [
            "date_key", "date", "year", "quarter", "month",
            "month_name", "week_of_year", "day", "day_name",
            "day_of_week", "is_weekend"
        ]
    },
    "mart_daily_city_revenue": {
        "description": (
            "Pre-aggregated daily revenue by city. "
            "Preferred for city revenue analysis. GMV represents "
            "delivered sales as defined by the dbt model."
        ),
        "columns": [
            "order_date", "city", "total_orders", "delivered_orders",
            "cancel_rate", "gmv", "aov"
        ]
    },
    "mart_restaurant_performance": {
        "description": (
            "Pre-aggregated restaurant performance. "
            "Preferred for restaurant comparisons."
        ),
        "columns": [
            "restaurant_id", "restaurant_name", "city", "cuisine",
            "total_orders", "revenue", "avg_customer_rating",
            "avg_delivery_min"
        ]
    },
    "mart_delivery_sla": {
        "description": (
            "Delivery performance grouped by city and order hour. "
            "Contains delivered order counts and P50/P90 delivery times."
        ),
        "columns": [
            "city", "order_hour", "delivered_orders",
            "p50_delivery_min", "p90_delivery_min"
        ]
    },
    "mart_review_insights": {
        "description": (
            "Aggregated review sentiment and topics by city. "
            "Preferred for review analytics. Each row represents "
            "a city, topic, and sentiment combination."
        ),
        "columns": [
            "city", "topic", "sentiment_label", "total_reviews",
            "avg_customer_rating", "avg_sentiment_score",
            "positive_reviews", "negative_reviews",
            "neutral_reviews", "reviews_with_key_issue"
        ]
    }
}

APPROVED_TABLES = set(TABLES.keys())


# --------------------------------------------------
# Initialize clients
# --------------------------------------------------

if not GROQ_API_KEY:
    raise EnvironmentError("GROQ_API_KEY is missing from .env")

if not all([
    DATABRICKS_SERVER_HOSTNAME,
    DATABRICKS_HTTP_PATH,
    DATABRICKS_TOKEN
]):
    raise EnvironmentError(
        "Missing Databricks connection variables in .env"
    )

groq_client = Groq(api_key=GROQ_API_KEY)


# --------------------------------------------------
# Schema prompt
# --------------------------------------------------

def build_schema_context():
    sections = []

    for table_name, details in TABLES.items():
        columns = ", ".join(details["columns"])

        sections.append(
            f"""
Table: {CATALOG}.{SCHEMA}.{table_name}
Description: {details['description']}
Columns: {columns}
""".strip()
        )

    return "\n\n".join(sections)


# --------------------------------------------------
# Generate SQL using Groq
# --------------------------------------------------

def generate_sql(question):
    schema_context = build_schema_context()

    system_prompt = f"""
You are an expert Databricks SQL analyst.

Generate one SQL query to answer the user's question.

Available database schema:

{schema_context}

Rules:
1. Generate Databricks SQL syntax.
2. Use only the tables and columns listed above.
3. Always fully qualify physical tables using
   workspace.gold.table_name.
4. Prefer pre-aggregated mart tables for analytical questions.
5. Use fact tables when detailed records are required.
6. Use appropriate joins for dimensional attributes.
7. Never invent table or column names.
8. Never generate INSERT, UPDATE, DELETE, MERGE, DROP,
   CREATE, ALTER, TRUNCATE, or other modification statements.
9. Generate exactly one read-only SELECT query.
10. Do not include Markdown code fences.
11. Do not include explanations or comments.
12. Include a LIMIT clause, maximum {MAX_ROWS} rows.
13. For revenue calculations from fact_orders, use sales_amount
    and consider order_status when the question asks for
    delivered revenue. For mart_daily_city_revenue, use gmv.
14. For every ratio, rate, or percentage calculation, explicitly
    use floating-point arithmetic. For example:
    100.0 * CAST(numerator AS DOUBLE)
    / NULLIF(denominator, 0)
15. Never rely on integer division for percentages or ratios.
16. When calculating a percentage, include the numerator and
    denominator as separate output columns whenever practical.
17. For negative-review percentages, calculate:
    100.0 * SUM(negative_reviews)
    / NULLIF(SUM(total_reviews), 0)
    from mart_review_insights. Include both summed counts
    in the output. Do not average row-level percentages.
18. When aggregating mart_review_insights across topics or
    sentiments, sum the count columns before calculating
    percentages. Do not average percentages across groups.
19. Use NULLIF to prevent division-by-zero errors.
20. Return only valid SQL.
"""

    response = groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question}
        ],
        temperature=0,
        max_completion_tokens=1000
    )

    message = response.choices[0].message.content

    if not message:
        raise ValueError("Groq returned an empty SQL response.")

    generated = message.strip()

    # Remove accidental Markdown fences.
    generated = generated.replace("```sql", "").replace("```", "").strip()

    return generated.rstrip(";").strip()


# --------------------------------------------------
# SQL validation
# --------------------------------------------------

def validate_sql(query):
    if not query:
        raise ValueError("The generated SQL query is empty.")

    if len(query) > MAX_SQL_LENGTH:
        raise ValueError("SQL query exceeds the maximum allowed length.")

    try:
        statements = sqlglot.parse(query, read="databricks")
    except Exception as error:
        raise ValueError(f"Invalid SQL syntax: {error}") from error

    if len(statements) != 1 or statements[0] is None:
        raise ValueError("Only one SQL statement is permitted.")

    tree = statements[0]

    # Only SELECT-style queries are allowed.
    if not isinstance(tree, exp.Query):
        raise ValueError("Only read-only SELECT queries are allowed.")

    # Reject modifying or administrative operations anywhere
    # in the query's syntax tree.
    forbidden_types = (
        exp.Insert,
        exp.Update,
        exp.Delete,
        exp.Merge,
        exp.Create,
        exp.Drop,
        exp.Alter,
        exp.TruncateTable,
        exp.Command,
        exp.Transaction,
        exp.Set,
        exp.Use,
        exp.Copy,
        exp.Grant,
        exp.Revoke,
    )

    for node in tree.walk():
        if isinstance(node, forbidden_types):
            raise ValueError(
                f"Forbidden SQL operation: {type(node).__name__}"
            )

    # Reject SELECT INTO.
    if tree.find(exp.Into):
        raise ValueError("SELECT INTO is not permitted.")

    # Collect CTE names so legitimate references to them
    # are not mistaken for unqualified physical tables.
    cte_names = {
        cte.alias_or_name.lower()
        for cte in tree.find_all(exp.CTE)
        if cte.alias_or_name
    }

    table_nodes = list(tree.find_all(exp.Table))

    if not table_nodes:
        raise ValueError("Query must reference an approved Gold table.")

    # Every physical table must be fully qualified and approved.
    # Unqualified table references are allowed only when they
    # refer to a CTE defined within this query.
    for table in table_nodes:
        table_name = table.name.lower()

        if not table.catalog and not table.db:
            if table_name in cte_names:
                continue

            raise ValueError(
                "Unqualified table reference is forbidden: "
                f"{table.name}. Physical tables must use "
                "workspace.gold.table_name."
            )

        if not table.catalog or not table.db:
            raise ValueError(
                f"Incomplete table qualification: {table.sql()}"
            )

        if table.catalog.lower() != CATALOG:
            raise ValueError("Access to other catalogs is forbidden.")

        if table.db.lower() != SCHEMA:
            raise ValueError("Access to other schemas is forbidden.")

        if table_name not in APPROVED_TABLES:
            raise ValueError(
                f"Table is not approved: {table.name}"
            )

    # Enforce a maximum result limit.
    limit_node = tree.args.get("limit")

    if limit_node is None:
        tree = tree.limit(MAX_ROWS)

    else:
        limit_expression = limit_node.expression

        if not isinstance(limit_expression, exp.Literal):
            raise ValueError("LIMIT must be a numeric literal.")

        if limit_expression.is_string:
            raise ValueError("LIMIT must be numeric.")

        try:
            limit_value = int(limit_expression.this)
        except (TypeError, ValueError) as error:
            raise ValueError("LIMIT must be a valid integer.") from error

        if limit_value < 1:
            raise ValueError("LIMIT must be greater than zero.")

        if limit_value > MAX_ROWS:
            tree = tree.limit(MAX_ROWS)

    return tree.sql(dialect="databricks")


# --------------------------------------------------
# Execute SQL on Databricks
# --------------------------------------------------

def execute_sql(query):
    connection = sql.connect(
        server_hostname=DATABRICKS_SERVER_HOSTNAME,
        http_path=DATABRICKS_HTTP_PATH,
        access_token=DATABRICKS_TOKEN
    )

    try:
        cursor = connection.cursor()

        try:
            cursor.execute(query)

            if cursor.description is None:
                raise RuntimeError("The query returned no result set.")

            columns = [
                description[0]
                for description in cursor.description
            ]

            rows = cursor.fetchall()

            return columns, rows

        finally:
            cursor.close()

    finally:
        connection.close()


# --------------------------------------------------
# Explain query results using Groq
# --------------------------------------------------


def explain_results(question, query, columns, rows):
    # Send only a small sample to the LLM.
    # All SQL results remain available in the application.
    SAMPLE_SIZE = 15

    sample_rows = [
        dict(zip(columns, row))
        for row in rows[:SAMPLE_SIZE]
    ]

    result_context = json.dumps(
        sample_rows,
        default=str,
        separators=(",", ":")
    )

    prompt = f"""
User question:
{question}

SQL executed:
{query}

Total rows returned by SQL: {len(rows)}

Result columns:
{", ".join(columns)}

Sample of query results (first {len(sample_rows)} rows):
{result_context}

Explain the results in clear, concise language.

Strict rules:
- Use only the supplied sample rows and metadata.
- Do not invent totals, averages, percentages, rankings,
  distributions, or trends.
- Do not calculate statistics across rows you cannot see.
- You may describe individual values visible in the sample.
- Clearly state that the explanation uses a sample of
  the results when more rows were returned than supplied.
- Do not imply that the sample represents all cities.
- Explain the meaning of columns when useful.
- If no rows were returned, say so.
- Keep the explanation concise.
"""

    response = groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a precise business analytics assistant. "
                    "Be concise. Never fabricate or extrapolate data."
                )
            },
            {"role": "user", "content": prompt}
        ],
        temperature=0,
        max_completion_tokens=500
    )

    answer = response.choices[0].message.content

    if not answer:
        raise ValueError("Groq returned an empty explanation.")

    return answer.strip()



# --------------------------------------------------
# Main application
# --------------------------------------------------

def main():
    print("\n" + "=" * 65)
    print("          RESTAURANT ANALYTICS - TEXT TO SQL")
    print("=" * 65)
    print("Ask questions about restaurant business data.")
    print("Type 'exit' to quit.")

    while True:
        try:
            question = input("\nYou: ").strip()

            if question.lower() in {"exit", "quit"}:
                print("\nGoodbye!")
                break

            if not question:
                continue

            print("\nGenerating SQL...")

            generated_query = generate_sql(question)

            print("\nGenerated SQL:")
            print("-" * 65)
            print(generated_query)
            print("-" * 65)

            print("\nValidating SQL...")

            validated_query = validate_sql(generated_query)

            print("SQL validation passed.")

            print("\nExecuting on Databricks...")

            columns, rows = execute_sql(validated_query)

            print(f"Retrieved {len(rows)} rows.")

            print("\nGenerating explanation...")

            answer = explain_results(
                question,
                validated_query,
                columns,
                rows
            )

            print("\n" + "=" * 65)
            print("AI ASSISTANT")
            print("=" * 65)
            print(answer)

        except KeyboardInterrupt:
            print("\n\nChat interrupted. Goodbye!")
            break

        except Exception as error:
            logger.exception("Text-to-SQL request failed.")
            print(f"\nRequest failed: {error}")


if __name__ == "__main__":
    main()
