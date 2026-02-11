
-- Drop and recreate with explicit roles
DROP POLICY IF EXISTS "Anyone can submit responses" ON public.survey_responses;

CREATE POLICY "Anyone can submit responses"
ON public.survey_responses
AS PERMISSIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
