
-- Allow users to see their own submitted responses (needed for .insert().select())
CREATE POLICY "Users can view own responses"
ON public.survey_responses
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR is_anonymous = true
);
