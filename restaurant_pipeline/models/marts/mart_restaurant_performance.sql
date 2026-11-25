SELECT
    f.restaurant_id,
    r.restaurant_name,
    r.city,
    r.cuisine,

    COUNT(*) AS total_orders,

    SUM(
        CASE WHEN f.order_status = 'Delivered'
             THEN f.sales_amount ELSE 0 END
    ) AS revenue,

    ROUND(AVG(f.customer_rating), 2) AS avg_customer_rating,

    ROUND(AVG(f.delivery_time_min), 1) AS avg_delivery_min

FROM {{ source('gold', 'fact_orders') }} f

LEFT JOIN {{ source('gold', 'dim_restaurants') }} r
    ON f.restaurant_id = r.restaurant_id

GROUP BY
    f.restaurant_id,
    r.restaurant_name,
    r.city,
    r.cuisine