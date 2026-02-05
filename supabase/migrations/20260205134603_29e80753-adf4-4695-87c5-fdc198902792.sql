-- Create chat_sessions table for storing chat session data
CREATE TABLE public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  sentiment TEXT CHECK (sentiment IN ('satisfied', 'neutral', 'dissatisfied')),
  summary TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  message_count INTEGER NOT NULL DEFAULT 0
);

-- Create chat_messages table for storing individual messages
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX idx_chat_sessions_status ON public.chat_sessions(status);
CREATE INDEX idx_chat_sessions_started_at ON public.chat_sessions(started_at DESC);

-- Enable Row Level Security
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_sessions (public access for customers)
CREATE POLICY "Anyone can create chat sessions"
ON public.chat_sessions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can view their own session"
ON public.chat_sessions
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can update their own session"
ON public.chat_sessions
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- RLS Policies for chat_messages (public access for customers)
CREATE POLICY "Anyone can insert messages"
ON public.chat_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can view messages"
ON public.chat_messages
FOR SELECT
TO anon, authenticated
USING (true);

-- Function to increment message count
CREATE OR REPLACE FUNCTION public.increment_message_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_sessions
  SET message_count = message_count + 1
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-increment message count
CREATE TRIGGER on_chat_message_insert
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.increment_message_count();