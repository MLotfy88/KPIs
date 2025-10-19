-- First, ensure the pg_net extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- This function is triggered when a new row is inserted into the notifications table.
-- It sends a POST request to the 'slack_notifier' Edge Function.
CREATE OR REPLACE FUNCTION public.notify_slack_on_new_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER -- Important: The function needs elevated privileges to use pg_net
AS $$
BEGIN
  -- Perform an HTTP POST request to the Slack Notifier Edge Function
  -- The 'record' in the body will contain the newly inserted notification row
  PERFORM net.http_post(
    url:='https://tmtuadzinxwmjtozprlw.supabase.co/functions/v1/slack_notifier',
    headers:='{"Content-Type": "application/json"}'::jsonb,
    body:=jsonb_build_object(
      'record', row_to_json(NEW)
    )
  );
  RETURN NEW;
END;
$$;

-- Drop the trigger if it already exists to avoid errors when re-running the script
DROP TRIGGER IF EXISTS on_new_notification_slack_notify ON public.notifications;

-- Create the trigger that executes the function after a new notification is inserted
CREATE TRIGGER on_new_notification_slack_notify
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.notify_slack_on_new_notification();
