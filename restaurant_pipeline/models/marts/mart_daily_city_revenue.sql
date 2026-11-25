WITH orders AS (
    SELECT
        f.order_id,
        f.order_date,
        r.city,
        f.order_status,
        f.sales_amount
    FROM {{ source('gold', 'fact_orders') }} f
    LEFT JOIN {{ source('gold', 'dim_restaurants') }} r
        ON f.restaurant_id = r.restaurant_id
)

SELECT
    order_date,
    city,
    COUNT(*) AS total_orders,

    SUM(CASE WHEN order_status = 'Delivered' THEN 1 ELSE 0 END)
        AS delivered_orders,

    ROUND(
        SUM(CASE WHEN order_status = 'Cancelled' THEN 1 ELSE 0 END)
        / NULLIF(COUNT(*), 0),
        4
    ) AS cancel_rate,

    SUM(
        CASE WHEN order_status = 'Delivered'
             THEN sales_amount ELSE 0 END
    ) AS gmv,

    ROUND(
        SUM(CASE WHEN order_status = 'Delivered'
                 THEN sales_amount ELSE 0 END)
        / NULLIF(
            SUM(CASE WHEN order_status = 'Delivered' THEN 1 ELSE 0 END),
            0
        ),
        2
    ) AS aov

FROM orders
GROUP BY order_date, city