CREATE OR REPLACE FUNCTION get_monthly_leaderboard()
RETURNS TABLE (
    nurse_id uuid,
    nurse_name character varying,
    nurse_photo_url character varying,
    week1_score numeric,
    week2_score numeric,
    week3_score numeric,
    week4_score numeric,
    monthly_score numeric,
    week1_change numeric,
    week2_change numeric,
    week3_change numeric,
    week4_change numeric,
    monthly_change numeric,
    badges jsonb
) AS $$
BEGIN
    RETURN QUERY
    WITH scores_by_week AS (
        SELECT
            e.nurse_id,
            date_trunc('month', e.created_at) as month_start,
            EXTRACT(week FROM e.created_at)::int - EXTRACT(week FROM date_trunc('month', e.created_at))::int + 1 AS week_of_month,
            AVG(s.score) AS weekly_avg
        FROM public.evaluations e
        JOIN public.evaluation_scores s ON e.id = s.evaluation_id
        WHERE e.evaluation_type = 'weekly'
          AND e.created_at >= date_trunc('month', NOW() - interval '1 month')
        GROUP BY e.nurse_id, month_start, week_of_month
    ),
    current_month_scores AS (
        SELECT * FROM scores_by_week WHERE month_start = date_trunc('month', NOW())
    ),
    previous_month_scores AS (
        SELECT * FROM scores_by_week WHERE month_start = date_trunc('month', NOW() - interval '1 month')
    ),
    aggregated_scores AS (
        SELECT
            n.id AS nurse_id,
            n.name AS nurse_name,
            n.photo_url AS nurse_photo_url,
            -- Current month scores
            MAX(CASE WHEN cms.week_of_month = 1 THEN cms.weekly_avg ELSE NULL END) AS week1_score,
            MAX(CASE WHEN cms.week_of_month = 2 THEN cms.weekly_avg ELSE NULL END) AS week2_score,
            MAX(CASE WHEN cms.week_of_month = 3 THEN cms.weekly_avg ELSE NULL END) AS week3_score,
            MAX(CASE WHEN cms.week_of_month = 4 THEN cms.weekly_avg ELSE NULL END) AS week4_score,
            -- Previous month scores for comparison
            MAX(CASE WHEN pms.week_of_month = 1 THEN pms.weekly_avg ELSE NULL END) AS prev_week1_score,
            MAX(CASE WHEN pms.week_of_month = 2 THEN pms.weekly_avg ELSE NULL END) AS prev_week2_score,
            MAX(CASE WHEN pms.week_of_month = 3 THEN pms.weekly_avg ELSE NULL END) AS prev_week3_score,
            MAX(CASE WHEN pms.week_of_month = 4 THEN pms.weekly_avg ELSE NULL END) AS prev_week4_score
        FROM public.nurses n
        LEFT JOIN current_month_scores cms ON n.id = cms.nurse_id
        LEFT JOIN previous_month_scores pms ON n.id = pms.nurse_id
        GROUP BY n.id, n.name, n.photo_url
    ),
    nurse_badges_agg AS (
        SELECT
            nb.nurse_id,
            jsonb_agg(jsonb_build_object('name', b.badge_name, 'icon', b.badge_icon, 'tier', nb.tier)) AS badges
        FROM public.nurse_badges nb
        JOIN public.badges b ON nb.badge_id = b.badge_id
        WHERE nb.awarded_at >= date_trunc('month', NOW())
        GROUP BY nb.nurse_id
    )
    SELECT
        ags.nurse_id,
        ags.nurse_name,
        ags.nurse_photo_url,
        ags.week1_score,
        ags.week2_score,
        ags.week3_score,
        ags.week4_score,
        COALESCE((ags.week1_score + ags.week2_score + ags.week3_score + ags.week4_score) / 
            NULLIF((CASE WHEN ags.week1_score IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN ags.week2_score IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN ags.week3_score IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN ags.week4_score IS NOT NULL THEN 1 ELSE 0 END), 0), 0) AS monthly_score,
        -- Calculate change percentages
        (ags.week1_score - ags.prev_week1_score) AS week1_change,
        (ags.week2_score - ags.prev_week2_score) AS week2_change,
        (ags.week3_score - ags.prev_week3_score) AS week3_change,
        (ags.week4_score - ags.prev_week4_score) AS week4_change,
        (COALESCE((ags.week1_score + ags.week2_score + ags.week3_score + ags.week4_score) / NULLIF((CASE WHEN ags.week1_score IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN ags.week2_score IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN ags.week3_score IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN ags.week4_score IS NOT NULL THEN 1 ELSE 0 END), 0), 0)) - 
        (COALESCE((ags.prev_week1_score + ags.prev_week2_score + ags.prev_week3_score + ags.prev_week4_score) / NULLIF((CASE WHEN ags.prev_week1_score IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN ags.prev_week2_score IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN ags.prev_week3_score IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN ags.prev_week4_score IS NOT NULL THEN 1 ELSE 0 END), 0), 0)) AS monthly_change,
        COALESCE(nba.badges, '[]'::jsonb) AS badges
    FROM aggregated_scores ags
    LEFT JOIN nurse_badges_agg nba ON ags.nurse_id = nba.nurse_id
    ORDER BY monthly_score DESC;
END;
$$ LANGUAGE plpgsql;
