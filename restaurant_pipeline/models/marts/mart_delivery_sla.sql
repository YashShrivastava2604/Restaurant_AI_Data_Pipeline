SELECT
    r.city,
    HOUR(f.order_timestamp) AS order_hour,

    COUNT(*) AS delivered_orders,

    ROUND(
        PERCENTILE_APPROX(f.delivery_time_min, 0.50),
        1
    ) AS p50_delivery_min,

    ROUND(
        PERCENTILE_APPROX(f.delivery_time_min, 0.90),
        1
    ) AS p90_delivery_min

FROM {{ source('gold', 'fact_orders') }} f

LEFT JOIN {{ source('gold', 'dim_restaurants') }} r
    ON f.restaurant_id = r.restaurant_id

WHERE f.order_status = 'Delivered'
  AND f.delivery_time_min IS NOT NULL

GROUP BY
    r.city,
    HOUR(f.order_timestamp)