CREATE OR REPLACE FUNCTION public.handle_new_evaluation_for_badges()
RETURNS TRIGGER AS $$
DECLARE
    badge_record RECORD;
    avg_score NUMERIC;
    nurse_id_var UUID;
BEGIN
    -- Get the nurse_id from the corresponding evaluation
    SELECT nurse_id INTO nurse_id_var
    FROM public.evaluations
    WHERE id = NEW.evaluation_id;

    -- Loop through all active badges
    FOR badge_record IN SELECT * FROM public.badges WHERE active = true
    LOOP
        -- Handle 'average' criteria_type
        IF badge_record.criteria_type = 'average' THEN
            -- Calculate average score for the linked metrics in the relevant period
            SELECT AVG(s.score) INTO avg_score
            FROM public.evaluation_scores s
            JOIN public.evaluation_items i ON s.item_id = i.id
            JOIN public.evaluations e ON s.evaluation_id = e.id
            WHERE e.nurse_id = nurse_id_var
              AND i.item_key = ANY(badge_record.linked_metrics)
              AND e.created_at >= date_trunc(badge_record.period_type, NOW());

            -- Check against thresholds (JSONB)
            IF avg_score >= (badge_record.thresholds->>'platinum')::numeric THEN
                INSERT INTO public.nurse_badges (nurse_id, badge_id, tier, evaluation_id)
                VALUES (nurse_id_var, badge_record.badge_id, 'platinum', NEW.evaluation_id)
                ON CONFLICT DO NOTHING;
            ELSIF avg_score >= (badge_record.thresholds->>'gold')::numeric THEN
                INSERT INTO public.nurse_badges (nurse_id, badge_id, tier, evaluation_id)
                VALUES (nurse_id_var, badge_record.badge_id, 'gold', NEW.evaluation_id)
                ON CONFLICT DO NOTHING;
            ELSIF avg_score >= (badge_record.thresholds->>'silver')::numeric THEN
                INSERT INTO public.nurse_badges (nurse_id, badge_id, tier, evaluation_id)
                VALUES (nurse_id_var, badge_record.badge_id, 'silver', NEW.evaluation_id)
                ON CONFLICT DO NOTHING;
            ELSIF avg_score >= (badge_record.thresholds->>'bronze')::numeric THEN
                INSERT INTO public.nurse_badges (nurse_id, badge_id, tier, evaluation_id)
                VALUES (nurse_id_var, badge_record.badge_id, 'bronze', NEW.evaluation_id)
                ON CONFLICT DO NOTHING;
            END IF;
        END IF;
        
        -- TODO: Add logic for other criteria_types like 'improvement', 'percentage', etc.

    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_evaluation_scores_insert_award_badges ON public.evaluation_scores;
CREATE TRIGGER on_evaluation_scores_insert_award_badges
AFTER INSERT ON public.evaluation_scores
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_evaluation_for_badges();
