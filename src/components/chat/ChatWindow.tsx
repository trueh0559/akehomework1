import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Loader2, MessageCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ChatMessage from './ChatMessage';
import CustomerInfoForm from './CustomerInfoForm';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

interface ChatWindowProps {
  onClose: () => void;
}

const ChatWindow = ({ onClose }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Create session on mount
  useEffect(() => {
    createSession();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const createSession = async () => {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({ status: 'active' })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create session:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเริ่มการสนทนาได้',
        variant: 'destructive',
      });
      return;
    }

    setSessionId(data.id);
  };

  const saveMessage = async (role: 'user' | 'assistant', content: string) => {
    if (!sessionId) return;

    await supabase.from('chat_messages').insert({
      session_id: sessionId,
      role,
      content,
    });
  };

  const streamChat = async (allMessages: Message[]) => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

    const resp = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: allMessages, session_id: sessionId }),
    });

    if (!resp.ok || !resp.body) {
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to get response');
    }

    return resp.body;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !sessionId) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Save user message
    await saveMessage('user', userMessage.content);

    try {
      const body = await streamChat([...messages, userMessage]);
      const reader = body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let assistantContent = '';

      // Add empty assistant message to start streaming
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        // Process line-by-line
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: assistantContent,
                };
                return updated;
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Save assistant message
      if (assistantContent) {
        await saveMessage('assistant', assistantContent);
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถรับข้อความได้',
        variant: 'destructive',
      });
      // Remove empty assistant message on error
      setMessages((prev) => prev.filter((m) => m.content !== ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndChat = () => {
    setShowCustomerForm(true);
  };

  const handleCustomerFormComplete = () => {
    setShowCustomerForm(false);
    setIsCompleted(true);
  };

  const handleCustomerFormSkip = async () => {
    setShowCustomerForm(false);
    setIsCompleted(true);

    // Still analyze the chat even if customer skips
    if (sessionId) {
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ session_id: sessionId }),
        });
      } catch (error) {
        console.error('Failed to analyze chat:', error);
      }
    }
  };

  if (showCustomerForm && sessionId) {
    return (
      <CustomerInfoForm
        sessionId={sessionId}
        onComplete={handleCustomerFormComplete}
        onSkip={handleCustomerFormSkip}
        onClose={onClose}
      />
    );
  }

  if (isCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-4 right-4 w-[360px] sm:w-[400px] h-[500px] z-50"
      >
        <div className="bg-background border border-border rounded-2xl shadow-2xl h-full flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">ขอบคุณครับ/ค่ะ</h3>
          <p className="text-muted-foreground mb-6">
            ขอบคุณที่ใช้บริการ Feeldi Chat
            <br />
            หากมีข้อสงสัยเพิ่มเติม สามารถเริ่มสนทนาใหม่ได้เลย
          </p>
          <Button onClick={onClose} variant="outline">
            ปิดหน้าต่าง
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-4 right-4 w-[360px] sm:w-[400px] h-[500px] z-50"
    >
      <div className="bg-background border border-border rounded-2xl shadow-2xl h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">Feeldi Chat</h3>
              <p className="text-xs text-muted-foreground">ผู้ช่วยบริการลูกค้า</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleEndChat}>
                จบสนทนา
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
              <MessageCircle className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm">สวัสดีครับ/ค่ะ!</p>
              <p className="text-sm">มีอะไรให้ช่วยเหลือไหมครับ?</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <ChatMessage key={index} message={msg} />
              ))}
              {isLoading && messages[messages.length - 1]?.content === '' && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">กำลังพิมพ์...</span>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="พิมพ์ข้อความ..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatWindow;
