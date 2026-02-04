-- Add scheduling fields to surveys
ALTER TABLE public.surveys
ADD COLUMN IF NOT EXISTS start_at timestamptz NULL,
ADD COLUMN IF NOT EXISTS end_at timestamptz NULL;

-- Create ui_settings table for theme preferences
CREATE TABLE IF NOT EXISTS public.ui_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode text NOT NULL DEFAULT 'dark' CHECK (mode IN ('light', 'dark')),
  background_type text NOT NULL DEFAULT 'solid' CHECK (background_type IN ('solid', 'image', 'video')),
  background_value text NULL,
  enable_motion boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ui_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for ui_settings (admin can manage, public can view)
CREATE POLICY "Anyone can view ui_settings"
ON public.ui_settings
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage ui_settings"
ON public.ui_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert default ui_settings row if none exists
INSERT INTO public.ui_settings (mode, background_type, enable_motion)
SELECT 'dark', 'solid', true
WHERE NOT EXISTS (SELECT 1 FROM public.ui_settings LIMIT 1);

-- Create index for surveys scheduling
CREATE INDEX IF NOT EXISTS idx_surveys_scheduling ON public.surveys (is_active, start_at, end_at);