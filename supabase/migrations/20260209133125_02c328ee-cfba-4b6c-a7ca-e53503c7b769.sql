
-- Add user_id column to survey_responses
ALTER TABLE public.survey_responses ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create coupon_campaigns table
CREATE TABLE public.coupon_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  discount_type text NOT NULL DEFAULT 'gift',
  discount_value numeric DEFAULT 0,
  code_prefix text NOT NULL DEFAULT 'FEEL-',
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  start_at timestamptz,
  expire_at timestamptz,
  survey_id uuid REFERENCES public.surveys(id) ON DELETE SET NULL,
  conditions jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coupon_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage campaigns" ON public.coupon_campaigns
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active campaigns" ON public.coupon_campaigns
  FOR SELECT USING (is_active = true);

-- Create coupons table
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.coupon_campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active',
  used_at timestamptz,
  response_id uuid REFERENCES public.survey_responses(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own coupons" ON public.coupons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all coupons" ON public.coupons
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update coupons" ON public.coupons
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can insert their own coupons" ON public.coupons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to increment used_count on campaign when coupon is used
CREATE OR REPLACE FUNCTION public.increment_campaign_used_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'used' AND (OLD.status IS NULL OR OLD.status != 'used') THEN
    UPDATE public.coupon_campaigns
    SET used_count = used_count + 1
    WHERE id = NEW.campaign_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_coupon_used
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_campaign_used_count();
