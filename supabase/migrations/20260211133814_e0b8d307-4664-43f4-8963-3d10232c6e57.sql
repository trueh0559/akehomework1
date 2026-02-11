
-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Anyone can submit responses" ON public.survey_responses;

-- Recreate as PERMISSIVE
CREATE POLICY "Anyone can submit responses"
ON public.survey_responses
FOR INSERT
TO public
WITH CHECK (true);
