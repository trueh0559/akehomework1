-- Add new columns to chat_sessions for รู้ใจ persona
ALTER TABLE public.chat_sessions
ADD COLUMN IF NOT EXISTS department text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS problem_type text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sentiment_reason text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS page_url text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS form_context jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS source text DEFAULT 'AI_CHAT_RUO_JAI';

-- Create index for department and sentiment queries
CREATE INDEX IF NOT EXISTS idx_chat_sessions_department ON public.chat_sessions(department);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_sentiment ON public.chat_sessions(sentiment);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_source ON public.chat_sessions(source);

-- Add comment for documentation
COMMENT ON COLUMN public.chat_sessions.department IS 'Department/system context for รู้ใจ persona (e.g., survey, insurance, real_estate)';
COMMENT ON COLUMN public.chat_sessions.problem_type IS 'Categorized problem type extracted by AI';
COMMENT ON COLUMN public.chat_sessions.sentiment_reason IS 'AI-generated reason for the sentiment assessment';
COMMENT ON COLUMN public.chat_sessions.page_url IS 'URL where the chat was initiated';
COMMENT ON COLUMN public.chat_sessions.form_context IS 'JSON context if chat was initiated from a survey/form';
COMMENT ON COLUMN public.chat_sessions.source IS 'Source identifier for the chat (default: AI_CHAT_RUO_JAI)';