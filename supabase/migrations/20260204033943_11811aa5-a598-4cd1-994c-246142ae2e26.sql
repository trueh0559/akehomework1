-- ================================================
-- Dynamic Survey System Database Schema
-- ================================================

-- 1. Create surveys table
CREATE TABLE public.surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 2. Create survey_questions table  
CREATE TABLE public.survey_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid REFERENCES public.surveys(id) ON DELETE CASCADE NOT NULL,
  order_index integer NOT NULL,
  question_text text NOT NULL,
  question_type text NOT NULL,
  is_required boolean DEFAULT true,
  config jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 3. Create survey_responses table
CREATE TABLE public.survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid REFERENCES public.surveys(id) ON DELETE CASCADE NOT NULL,
  submitted_at timestamptz DEFAULT now(),
  respondent_name text NULL,
  respondent_email text NULL,
  is_anonymous boolean DEFAULT false,
  answers jsonb NOT NULL,
  meta jsonb NULL
);

-- 4. Create admin_settings table (single-row)
CREATE TABLE public.admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  low_score_threshold numeric DEFAULT 3,
  admin_emails text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Insert default settings row
INSERT INTO public.admin_settings (admin_emails) VALUES ('{}');

-- 5. Create admin_notifications table
CREATE TABLE public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  payload jsonb DEFAULT '{}'::jsonb
);

-- ================================================
-- Enable RLS on all tables
-- ================================================
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- ================================================
-- RLS Policies
-- ================================================

-- Surveys: Public can read active surveys, Admin can CRUD all
CREATE POLICY "Anyone can view active surveys"
  ON public.surveys FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage surveys"
  ON public.surveys FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Survey Questions: Public can read active questions, Admin can CRUD all
CREATE POLICY "Anyone can view active questions"
  ON public.survey_questions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage questions"
  ON public.survey_questions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Survey Responses: Public can INSERT only, Admin can SELECT all
CREATE POLICY "Anyone can submit responses"
  ON public.survey_responses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all responses"
  ON public.survey_responses FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin Settings: Admin only
CREATE POLICY "Admins can view settings"
  ON public.admin_settings FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update settings"
  ON public.admin_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin Notifications: Admin only
CREATE POLICY "Admins can view notifications"
  ON public.admin_notifications FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage notifications"
  ON public.admin_notifications FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Service role can insert notifications (for edge functions)
CREATE POLICY "Service can insert notifications"
  ON public.admin_notifications FOR INSERT
  WITH CHECK (true);

-- ================================================
-- Enable Realtime for notifications
-- ================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;

-- ================================================
-- Create indexes for better performance
-- ================================================
CREATE INDEX idx_survey_questions_survey_id ON public.survey_questions(survey_id);
CREATE INDEX idx_survey_questions_order ON public.survey_questions(survey_id, order_index);
CREATE INDEX idx_survey_responses_survey_id ON public.survey_responses(survey_id);
CREATE INDEX idx_survey_responses_submitted_at ON public.survey_responses(submitted_at DESC);
CREATE INDEX idx_admin_notifications_unread ON public.admin_notifications(is_read, created_at DESC);
CREATE INDEX idx_admin_notifications_type ON public.admin_notifications(type);