import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, MessageCircle, CheckCircle, Heart, Building2, FileQuestion, Users, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ChatMessage from './ChatMessage';
import CustomerInfoForm from './CustomerInfoForm';
import { useLocation } from 'react-router-dom';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type Department = 'general' | 'survey' | 'insurance' | 'real_estate' | 'customer_service';

type SurveyContext = {
  id?: string;
  title?: string;
  description?: string;
};

interface ChatWindowProps {
  onClose: () => void;
  surveyContext?: SurveyContext;
}

const DEPARTMENT_OPTIONS: { id: Department; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'survey', label: 'ระบบแบบสำรวจ', icon: <FileQuestion className="w-5 h-5" />, description: 'สอบถามเกี่ยวกับการทำแบบสำรวจ' },
  { id: 'insurance', label: 'ที่ปรึกษาประกัน', icon: <Heart className="w-5 h-5" />, description: 'สอบถามเรื่องแผนประกัน' },
  { id: 'real_estate', label: 'ที่ปรึกษาอสังหาฯ', icon: <Building2 className="w-5 h-5" />, description: 'สอบถามเรื่องบ้าน/ที่ดิน' },
  { id: 'customer_service', label: 'บริการลูกค้า', icon: <Users className="w-5 h-5" />, description: 'แจ้งปัญหา/ร้องเรียน' },
  { id: 'general', label: 'อื่นๆ / ทั่วไป', icon: <HelpCircle className="w-5 h-5" />, description: 'สอบถามเรื่องทั่วไป' },
];

const ChatWindow = ({ onClose, surveyContext }: ChatWindowProps) => {
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [department, setDepartment] = useState<Department | null>(null);
  const [showDepartmentSelection, setShowDepartmentSelection] = useState(true);
  const [showSurveyConfirm, setShowSurveyConfirm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Check if on survey page
  const isOnSurveyPage = location.pathname.startsWith('/survey/');

  // Create session on mount
  useEffect(() => {
    // Determine initial flow
    if (surveyContext?.id || isOnSurveyPage) {
      setShowSurveyConfirm(true);
      setShowDepartmentSelection(false);
    }
  }, [surveyContext, isOnSurveyPage]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const createSession = async (selectedDepartment: Department) => {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({ 
        status: 'active',
        department: selectedDepartment,
        page_url: window.location.href,
        form_context: surveyContext ? { survey_id: surveyContext.id, title: surveyContext.title } : null,
        source: 'AI_CHAT_RUO_JAI',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create session:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเริ่มการสนทนาได้',
        variant: 'destructive',
      });
      return null;
    }

    return data.id;
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
      body: JSON.stringify({ 
        messages: allMessages, 
        session_id: sessionId,
        department,
        survey_context: surveyContext,
      }),
    });

    if (!resp.ok || !resp.body) {
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to get response');
    }

    return resp.body;
  };

  const handleSelectDepartment = async (selectedDept: Department) => {
    setDepartment(selectedDept);
    setShowDepartmentSelection(false);
    
    const newSessionId = await createSession(selectedDept);
    if (newSessionId) {
      setSessionId(newSessionId);
      
      // Add welcome message from รู้ใจ
      const welcomeMessage: Message = {
        role: 'assistant',
        content: getWelcomeMessage(selectedDept),
      };
      setMessages([welcomeMessage]);
      await supabase.from('chat_messages').insert({
        session_id: newSessionId,
        role: 'assistant',
        content: welcomeMessage.content,
      });
    }
  };

  const handleSurveyConfirm = async (confirmed: boolean) => {
    setShowSurveyConfirm(false);
    if (confirmed) {
      await handleSelectDepartment('survey');
    } else {
      setShowDepartmentSelection(true);
    }
  };

  const getWelcomeMessage = (dept: Department): string => {
    const messages: Record<Department, string> = {
      survey: surveyContext?.title 
        ? `สวัสดีค่ะ รู้ใจจากฝ่ายวิเคราะห์ข้อมูลยินดีให้บริการค่ะ\n\nตอนนี้คุณอยู่ในแบบสำรวจ "${surveyContext.title}" หากมีข้อสงสัยเกี่ยวกับแบบสำรวจนี้ หรือต้องการคำแนะนำ รู้ใจพร้อมช่วยเหลือค่ะ`
        : 'สวัสดีค่ะ รู้ใจจากฝ่ายวิเคราะห์ข้อมูลยินดีให้บริการค่ะ\n\nมีอะไรให้ช่วยเหลือเกี่ยวกับระบบแบบสำรวจไหมคะ?',
      insurance: 'สวัสดีค่ะ รู้ใจเป็นที่ปรึกษาด้านประกันยินดีให้บริการค่ะ\n\nไม่ทราบว่าต้องการสอบถามเรื่องประกันประเภทไหนคะ เช่น ประกันชีวิต ประกันสุขภาพ หรือประกันอุบัติเหตุ?',
      real_estate: 'สวัสดีครับ รู้ใจเป็นที่ปรึกษาด้านอสังหาริมทรัพย์ยินดีให้บริการครับ\n\nไม่ทราบว่าสนใจเรื่องบ้าน คอนโด ที่ดิน หรืออสังหาเพื่อการลงทุนครับ?',
      customer_service: 'สวัสดีค่ะ รู้ใจจากฝ่ายบริการลูกค้ายินดีให้บริการค่ะ\n\nมีเรื่องอะไรให้รู้ใจช่วยเหลือหรือรับเรื่องให้คะ?',
      general: 'สวัสดีค่ะ รู้ใจยินดีให้บริการค่ะ\n\nไม่ทราบว่ามีอะไรให้ช่วยเหลือไหมคะ?',
    };
    return messages[dept];
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

  // Show survey context confirmation
  if (showSurveyConfirm) {
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
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">รู้ใจ</h3>
                <p className="text-xs text-muted-foreground">ยินดีให้บริการค่ะ</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Survey Confirm Content */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <FileQuestion className="w-16 h-16 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">สวัสดีค่ะ</h3>
            <p className="text-muted-foreground mb-6">
              ตอนนี้คุณอยู่ในหน้าแบบสำรวจ
              {surveyContext?.title && (
                <span className="block font-medium text-foreground mt-1">"{surveyContext.title}"</span>
              )}
              <span className="block mt-2">ต้องการให้รู้ใจช่วยดูหรือให้คำแนะนำเกี่ยวกับแบบสำรวจนี้ใช่ไหมคะ?</span>
            </p>
            <div className="flex gap-3">
              <Button onClick={() => handleSurveyConfirm(true)}>
                ใช่ค่ะ ช่วยดูให้หน่อย
              </Button>
              <Button variant="outline" onClick={() => handleSurveyConfirm(false)}>
                ไม่ใช่ ต้องการสอบถามเรื่องอื่น
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Show department selection
  if (showDepartmentSelection) {
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
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">รู้ใจ</h3>
                <p className="text-xs text-muted-foreground">ยินดีให้บริการค่ะ</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Department Selection */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="text-center mb-4">
              <p className="text-muted-foreground">
                สวัสดีค่ะ ขอทราบหน่อยนะคะว่าต้องการปรึกษาเกี่ยวกับเรื่องใดเป็นพิเศษคะ?
              </p>
            </div>
            <div className="space-y-2">
              {DEPARTMENT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelectDepartment(option.id)}
                  className="w-full p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors text-left flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {option.icon}
                  </div>
                  <div>
                    <p className="font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

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
          <h3 className="text-xl font-semibold mb-2">ขอบคุณค่ะ</h3>
          <p className="text-muted-foreground mb-6">
            ขอบคุณที่ใช้บริการ รู้ใจ
            <br />
            หากมีข้อสงสัยเพิ่มเติม สามารถเริ่มสนทนาใหม่ได้เลยค่ะ
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
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">รู้ใจ</h3>
              <p className="text-xs text-muted-foreground">
                {department === 'survey' && 'ฝ่ายวิเคราะห์ข้อมูล'}
                {department === 'insurance' && 'ที่ปรึกษาประกัน'}
                {department === 'real_estate' && 'ที่ปรึกษาอสังหาฯ'}
                {department === 'customer_service' && 'บริการลูกค้า'}
                {department === 'general' && 'ยินดีให้บริการ'}
              </p>
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
              <Heart className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm">กำลังเตรียมพร้อม...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <ChatMessage key={index} message={msg} assistantName="รู้ใจ" />
              ))}
              {isLoading && messages[messages.length - 1]?.content === '' && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">รู้ใจกำลังพิมพ์...</span>
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
