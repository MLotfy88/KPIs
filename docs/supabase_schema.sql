-- Create profiles table to store user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL,
  name character varying NOT NULL,
  role character varying NOT NULL,
  photo_url character varying,
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_email_key UNIQUE (email)
);

-- Create nurses table
CREATE TABLE IF NOT EXISTS public.nurses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  gender character varying NOT NULL DEFAULT 'female',
  photo_url character varying,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT nurses_pkey PRIMARY KEY (id)
);

-- Create evaluations table (modified to remove scores and final_score)
CREATE TABLE IF NOT EXISTS public.evaluations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nurse_id uuid NOT NULL,
  supervisor_id uuid NOT NULL,
  evaluation_type character varying NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text,
  CONSTRAINT evaluations_pkey PRIMARY KEY (id),
  CONSTRAINT evaluations_nurse_id_fkey FOREIGN KEY (nurse_id) REFERENCES nurses (id) ON DELETE CASCADE,
  CONSTRAINT evaluations_supervisor_id_fkey FOREIGN KEY (supervisor_id) REFERENCES profiles (id) ON DELETE CASCADE
);

-- Create audits table
CREATE TABLE IF NOT EXISTS public.audits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL,
  auditor_id uuid NOT NULL,
  is_match boolean NOT NULL,
  auditor_notes text,
  decision character varying NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT audits_pkey PRIMARY KEY (id),
  CONSTRAINT audits_evaluation_id_fkey FOREIGN KEY (evaluation_id) REFERENCES evaluations (id) ON DELETE CASCADE,
  CONSTRAINT audits_auditor_id_fkey FOREIGN KEY (auditor_id) REFERENCES profiles (id) ON DELETE CASCADE
);

-- Drop existing badge-related tables to recreate them with the new structure
DROP TABLE IF EXISTS public.nurse_badges CASCADE;
DROP TABLE IF EXISTS public.badges CASCADE;

-- Create evaluation_items table to store individual evaluation metrics/indicators
CREATE TABLE IF NOT EXISTS public.evaluation_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  item_key character varying NOT NULL,
  question text NOT NULL,
  category character varying NOT NULL,
  evaluation_types text[] NOT NULL, -- e.g., '{weekly, monthly}'
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT evaluation_items_pkey PRIMARY KEY (id),
  CONSTRAINT evaluation_items_item_key_key UNIQUE (item_key)
);

-- Create evaluation_scores table to store scores for each item in an evaluation
CREATE TABLE IF NOT EXISTS public.evaluation_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL,
  item_id uuid NOT NULL,
  score numeric NOT NULL,
  CONSTRAINT evaluation_scores_pkey PRIMARY KEY (id),
  CONSTRAINT evaluation_scores_evaluation_id_fkey FOREIGN KEY (evaluation_id) REFERENCES evaluations (id) ON DELETE CASCADE,
  CONSTRAINT evaluation_scores_item_id_fkey FOREIGN KEY (item_id) REFERENCES evaluation_items (id) ON DELETE CASCADE
);

-- Create the new, more detailed badges table
CREATE TABLE IF NOT EXISTS public.badges (
  badge_id uuid NOT NULL DEFAULT gen_random_uuid(),
  badge_name character varying NOT NULL,
  badge_icon character varying,
  description text,
  linked_metrics text[] NOT NULL, -- Array of item_key from evaluation_items
  criteria_type character varying NOT NULL, -- e.g., 'average', 'percentage', 'improvement'
  thresholds jsonb NOT NULL, -- e.g., '{"gold": 95, "silver": 85}' or '{"value": 10, "operator": ">="}'
  period_type character varying NOT NULL, -- e.g., 'weekly', 'monthly', 'quarterly', 'all_time'
  active boolean NOT NULL DEFAULT true,
  editable boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT badges_pkey PRIMARY KEY (badge_id)
);

-- Create the new nurse_badges table
CREATE TABLE IF NOT EXISTS public.nurse_badges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nurse_id uuid NOT NULL,
  badge_id uuid NOT NULL,
  tier character varying, -- e.g., 'gold', 'silver'
  awarded_at timestamp with time zone NOT NULL DEFAULT now(),
  evaluation_id uuid, -- The evaluation that triggered this award
  CONSTRAINT nurse_badges_pkey PRIMARY KEY (id),
  CONSTRAINT nurse_badges_nurse_id_fkey FOREIGN KEY (nurse_id) REFERENCES nurses (id) ON DELETE CASCADE,
  CONSTRAINT nurse_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES badges (badge_id) ON DELETE CASCADE,
  CONSTRAINT nurse_badges_evaluation_id_fkey FOREIGN KEY (evaluation_id) REFERENCES evaluations (id) ON DELETE SET NULL
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY,
  "userId" uuid NOT NULL,
  message text NOT NULL,
  link text,
  read boolean NOT NULL DEFAULT false,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_userId_fkey FOREIGN KEY ("userId") REFERENCES profiles (id) ON DELETE CASCADE
);

-- Create improvement_plans table
CREATE TABLE IF NOT EXISTS public.improvement_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nurse_id uuid NOT NULL,
  manager_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  goal text NOT NULL,
  status character varying NOT NULL,
  actions jsonb,
  progress_updates jsonb,
  CONSTRAINT improvement_plans_pkey PRIMARY KEY (id),
  CONSTRAINT improvement_plans_nurse_id_fkey FOREIGN KEY (nurse_id) REFERENCES nurses (id) ON DELETE CASCADE,
  CONSTRAINT improvement_plans_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES profiles (id) ON DELETE CASCADE
);

-- Helper function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  RETURN user_role;
END;
$$;

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nurses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nurse_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.improvement_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow users to see their own profile
DROP POLICY IF EXISTS "Allow users to see their own profile" ON public.profiles;
CREATE POLICY "Allow users to see their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
CREATE POLICY "Allow users to update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Allow authenticated users to see all nurses
DROP POLICY IF EXISTS "Allow authenticated users to see all nurses" ON public.nurses;
CREATE POLICY "Allow authenticated users to see all nurses" ON public.nurses FOR SELECT TO authenticated USING (true);

-- Allow managers to add, update, and delete nurses
DROP POLICY IF EXISTS "Allow managers to manage nurses" ON public.nurses;
CREATE POLICY "Allow managers to manage nurses" ON public.nurses FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'manager'
);

-- Allow supervisors to see evaluations they created
DROP POLICY IF EXISTS "Allow supervisors to see their evaluations" ON public.evaluations;
CREATE POLICY "Allow supervisors to see their evaluations" ON public.evaluations FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'supervisor' AND supervisor_id = auth.uid()
);

-- Allow managers to see all evaluations
DROP POLICY IF EXISTS "Allow managers to see all evaluations" ON public.evaluations;
CREATE POLICY "Allow managers to see all evaluations" ON public.evaluations FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'manager'
);

-- Allow supervisors and managers to create evaluations
DROP POLICY IF EXISTS "Allow supervisors and managers to create evaluations" ON public.evaluations;
CREATE POLICY "Allow supervisors and managers to create evaluations" ON public.evaluations FOR INSERT WITH CHECK (
  (public.get_user_role(auth.uid()) = 'supervisor' AND supervisor_id = auth.uid())
  OR
  (public.get_user_role(auth.uid()) = 'manager')
);

-- Allow managers to manage all audits
DROP POLICY IF EXISTS "Allow managers to manage audits" ON public.audits;
CREATE POLICY "Allow managers to manage audits" ON public.audits FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'manager'
);

-- Allow authenticated users to see evaluation items
DROP POLICY IF EXISTS "Allow authenticated to see evaluation items" ON public.evaluation_items;
CREATE POLICY "Allow authenticated to see evaluation items" ON public.evaluation_items FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to see evaluation scores
DROP POLICY IF EXISTS "Allow authenticated to see evaluation scores" ON public.evaluation_scores;
CREATE POLICY "Allow authenticated to see evaluation scores" ON public.evaluation_scores FOR SELECT TO authenticated USING (true);

-- Allow supervisors and managers to insert evaluation scores
DROP POLICY IF EXISTS "Allow supervisors and managers to insert evaluation scores" ON public.evaluation_scores;
CREATE POLICY "Allow supervisors and managers to insert evaluation scores" ON public.evaluation_scores FOR INSERT WITH CHECK (
  (public.get_user_role(auth.uid()) IN ('supervisor', 'manager'))
);

-- Allow authenticated users to see all badges
DROP POLICY IF EXISTS "Allow authenticated users to see all badges" ON public.badges;
CREATE POLICY "Allow authenticated users to see all badges" ON public.badges FOR SELECT TO authenticated USING (true);

-- Allow managers to manage badges
DROP POLICY IF EXISTS "Allow managers to manage badges" ON public.badges;
CREATE POLICY "Allow managers to manage badges" ON public.badges FOR ALL USING (
  (public.get_user_role(auth.uid()) = 'manager')
);

-- Allow authenticated users to see nurse badges
DROP POLICY IF EXISTS "Allow authenticated users to see nurse badges" ON public.nurse_badges;
CREATE POLICY "Allow authenticated users to see nurse badges" ON public.nurse_badges FOR SELECT TO authenticated USING (true);

-- Allow managers to award badges (and system via triggers)
DROP POLICY IF EXISTS "Allow managers to award badges" ON public.nurse_badges;
CREATE POLICY "Allow managers to award badges" ON public.nurse_badges FOR INSERT WITH CHECK (
  (public.get_user_role(auth.uid()) = 'manager')
);

-- Allow users to see their own notifications
DROP POLICY IF EXISTS "Allow users to see their own notifications" ON public.notifications;
CREATE POLICY "Allow users to see their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = "userId");

-- Allow users to update their own notifications
DROP POLICY IF EXISTS "Allow users to update their own notifications" ON public.notifications;
CREATE POLICY "Allow users to update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = "userId");

-- Allow authenticated users to insert notifications
DROP POLICY IF EXISTS "Allow authenticated users to insert notifications" ON public.notifications;
CREATE POLICY "Allow authenticated users to insert notifications" ON public.notifications FOR INSERT WITH CHECK (
  (auth.uid() = "userId") -- User can create notification for themselves
  OR
  (public.get_user_role(auth.uid()) = 'supervisor' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = "userId" AND role = 'manager')) -- Supervisor can create notification for a manager
  OR
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'manager')) -- If the logged-in user is a manager, allow them to insert any notification
);

-- Allow managers to manage improvement plans
DROP POLICY IF EXISTS "Allow managers to manage improvement plans" ON public.improvement_plans;
CREATE POLICY "Allow managers to manage improvement plans" ON public.improvement_plans FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'manager'
);

-- Allow supervisors to see relevant improvement plans
DROP POLICY IF EXISTS "Allow supervisors to see relevant improvement plans" ON public.improvement_plans;
CREATE POLICY "Allow supervisors to see relevant improvement plans" ON public.improvement_plans FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'supervisor' AND
  nurse_id IN (
    SELECT DISTINCT nurse_id FROM public.evaluations WHERE supervisor_id = auth.uid()
  )
);
