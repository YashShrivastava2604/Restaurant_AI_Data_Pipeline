WITH enriched_reviews AS (
    SELECT
        r.review_id,
        r.restaurant_id,
        r.rating,
        r.review_date,
        LOWER(TRIM(a.sentiment_label)) AS sentiment_label,
        CAST(a.sentiment_score AS DOUBLE) AS sentiment_score,
        LOWER(TRIM(a.topic)) AS topic,
        NULLIF(TRIM(a.key_issue), '') AS key_issue
    FROM {{ source('ai', 'review_enriched') }} AS a
    INNER JOIN {{ source('silver', 'reviews') }} AS r
        ON a.review_id = r.review_id
),

reviews_with_city AS (
    SELECT
        e.*,
        COALESCE(NULLIF(TRIM(rest.city), ''), 'Unknown') AS city
    FROM enriched_reviews AS e
    LEFT JOIN {{ source('silver', 'restaurant') }} AS rest
        ON e.restaurant_id = rest.restaurant_id
)

SELECT
    city,
    topic,
    sentiment_label,

    COUNT(DISTINCT review_id) AS total_reviews,

    ROUND(AVG(rating), 2) AS avg_customer_rating,

    ROUND(AVG(sentiment_score), 3) AS avg_sentiment_score,

    COUNT(DISTINCT CASE
        WHEN sentiment_label = 'positive' THEN review_id
    END) AS positive_reviews,

    COUNT(DISTINCT CASE
        WHEN sentiment_label = 'negative' THEN review_id
    END) AS negative_reviews,

    COUNT(DISTINCT CASE
        WHEN sentiment_label = 'neutral' THEN review_id
    END) AS neutral_reviews,

    COUNT(DISTINCT CASE
        WHEN key_issue IS NOT NULL THEN review_id
    END) AS reviews_with_key_issue

FROM reviews_with_city

GROUP BY
    city,
    topic,
    sentiment_label