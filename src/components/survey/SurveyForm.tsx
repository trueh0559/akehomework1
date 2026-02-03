import { useState, useEffect, useRef, useCallback } from 'react';
import { z } from 'zod';
import { Brain, Send, Loader2, AlertCircle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import EmojiRating from './EmojiRating';
import ProgressIndicator from './ProgressIndicator';
import ThankYouPage from './ThankYouPage';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAutoSaveDraft } from '@/hooks/useAutoSaveDraft';

const surveySchema = z.object({
  name: z.string().trim().min(1, 'กรุณากรอกชื่อ-นามสกุล').max(100, 'ชื่อยาวเกินไป'),
  email: z.string().trim().email('กรุณากรอกอีเมลให้ถูกต้อง').max(255, 'อีเมลยาวเกินไป'),
  q1: z.number().min(1).max(5),
  q2: z.number().min(1).max(5),
  q3: z.number().min(1).max(5),
  q4: z.number().min(1).max(5),
  q5: z.number().min(1).max(5),
  comment: z.string().max(1000, 'ความคิดเห็นยาวเกินไป').optional(),
});

type SurveyData = z.infer<typeof surveySchema>;

const questions = [
  'ความเข้าใจเนื้อหาการเขียน App ด้วย AI',
  'ความชัดเจนในการอธิบายและตัวอย่าง',
  'ความสามารถในการนำไปใช้งานจริง',
  'คุณภาพของเครื่องมือ / AI ที่ใช้ในคอร์ส',
  'ความคุ้มค่าและความพึงพอใจโดยรวมต่อคอร์ส',
];

const DRAFT_KEY = 'survey_draft_v1';

const SurveyForm = () => {
  const [formData, setFormData] = useState<Partial<SurveyData>>({
    name: '',
    email: '',
    comment: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Auto Save Draft feature
  const { loadDraft, clearDraft } = useAutoSaveDraft({
    key: DRAFT_KEY,
    data: formData,
    debounceMs: 500,
  });

  // Load draft on mount
  useEffect(() => {
    const savedDraft = loadDraft();
    if (savedDraft && Object.keys(savedDraft).length > 0) {
      // Check if draft has meaningful data
      const hasData = savedDraft.name || savedDraft.email || 
        savedDraft.q1 || savedDraft.q2 || savedDraft.q3 || 
        savedDraft.q4 || savedDraft.q5 || savedDraft.comment;
      
      if (hasData) {
        setFormData(savedDraft);
        setDraftRestored(true);
        toast.success('กู้คืนข้อมูลที่บันทึกไว้', {
          description: 'ข้อมูลแบบประเมินของคุณถูกกู้คืนจากการบันทึกอัตโนมัติ',
          icon: <Save className="w-4 h-4" />,
        });
      }
    }
  }, []);

  const answeredQuestions = [
    formData.q1,
    formData.q2,
    formData.q3,
    formData.q4,
    formData.q5,
  ].filter((q) => q !== undefined).length;

  // Smooth scroll to next question - Feature #2
  const scrollToNextQuestion = useCallback((currentIndex: number) => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < questions.length) {
      setTimeout(() => {
        questionRefs.current[nextIndex]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 300);
    } else {
      // If all questions answered, scroll to user info section
      setTimeout(() => {
        document.getElementById('user-info-section')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 300);
    }
  }, []);

  const handleInputChange = (field: keyof SurveyData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleRatingChange = (questionIndex: number, value: number) => {
    const field = `q${questionIndex + 1}` as keyof SurveyData;
    handleInputChange(field, value);
    
    // Smooth scroll to next question
    scrollToNextQuestion(questionIndex);
    
    // Clear questions error if exists
    if (errors.questions) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.questions;
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate
    const result = surveySchema.safeParse(formData);
    
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const path = err.path[0] as string;
        if (path.startsWith('q') && !newErrors.questions) {
          newErrors.questions = 'กรุณาให้คะแนนครบทุกข้อ';
        } else {
          newErrors[path] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('responses').insert({
        name: result.data.name,
        email: result.data.email,
        q1_score: result.data.q1,
        q2_score: result.data.q2,
        q3_score: result.data.q3,
        q4_score: result.data.q4,
        q5_score: result.data.q5,
        comment: result.data.comment || null,
      });

      if (error) throw error;

      // Clear draft after successful submission
      clearDraft();
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting survey:', error);
      toast.error('เกิดข้อผิดพลาด', {
        description: 'ไม่สามารถส่งแบบประเมินได้ กรุณาลองใหม่อีกครั้ง',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      comment: '',
    });
    setErrors({});
    setIsSubmitted(false);
    clearDraft();
  };

  if (isSubmitted) {
    return <ThankYouPage onReset={handleReset} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4 pb-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent glow-primary mb-4">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          แบบประเมินความพึงพอใจ
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          คอร์สเรียนการเขียน App ด้วย AI
        </p>
      </div>

      {/* Sticky Progress Bar - Feature #5 */}
      <ProgressIndicator current={answeredQuestions} total={5} isSticky />

      {/* Draft restored indicator */}
      {draftRestored && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-accent/5 border border-accent/20 rounded-lg px-3 py-2">
          <Save className="w-3 h-3 text-accent" />
          <span>ข้อมูลถูกบันทึกอัตโนมัติ</span>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-8">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse-glow" />
          ให้คะแนนความพึงพอใจ
        </h2>

        {errors.questions && (
          <p className="text-destructive text-sm flex items-center gap-1 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <AlertCircle className="w-4 h-4" />
            {errors.questions}
          </p>
        )}

        <div className="space-y-8">
          {questions.map((question, index) => (
            <div 
              key={index}
              ref={(el) => (questionRefs.current[index] = el)}
              className="p-4 sm:p-6 rounded-xl bg-secondary/20 border border-border/30 hover:border-primary/30 transition-colors"
            >
              <EmojiRating
                question={question}
                questionNumber={index + 1}
                value={(formData as Record<string, number | string | undefined>)[`q${index + 1}`] as number | null ?? null}
                onChange={(value) => handleRatingChange(index, value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Comment - Moved before User Info */}
      <div className="space-y-2">
        <Label htmlFor="comment" className="text-foreground font-medium">
          ข้อเสนอแนะเพิ่มเติม <span className="text-muted-foreground">(ไม่บังคับ)</span>
        </Label>
        <Textarea
          id="comment"
          placeholder="คุณมีข้อเสนอแนะเพื่อพัฒนาคอร์ส AI นี้ให้ดียิ่งขึ้นหรือไม่"
          value={formData.comment || ''}
          onChange={(e) => handleInputChange('comment', e.target.value)}
          className="bg-background/50 border-border/50 focus:border-primary input-glow transition-all min-h-[120px] resize-none"
          rows={4}
        />
      </div>

      {/* User Info - Moved to end */}
      <div id="user-info-section" className="space-y-4 p-4 sm:p-6 rounded-xl bg-secondary/30 border border-border/50">
        <h3 className="text-foreground font-medium flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          ข้อมูลผู้ประเมิน
        </h3>
        
        <div className="space-y-2">
          <Label htmlFor="name" className="text-foreground font-medium">
            ชื่อ-นามสกุล <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="กรอกชื่อ-นามสกุลของคุณ"
            value={formData.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={cn(
              'bg-background/50 border-border/50 focus:border-primary input-glow transition-all',
              errors.name && 'border-destructive'
            )}
          />
          {errors.name && (
            <p className="text-destructive text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.name}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground font-medium">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="example@email.com"
            value={formData.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={cn(
              'bg-background/50 border-border/50 focus:border-primary input-glow transition-all',
              errors.email && 'border-destructive'
            )}
          />
          {errors.email && (
            <p className="text-destructive text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.email}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            ข้อมูลนี้ใช้เพื่อพัฒนาคอร์สเรียนเท่านั้น
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        size="lg"
        className={cn(
          'w-full gap-2 font-semibold text-base',
          'bg-gradient-to-r from-primary to-primary/80',
          'hover:from-primary/90 hover:to-primary/70',
          'glow-primary transition-all duration-300',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            กำลังส่งข้อมูล...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            ส่งแบบประเมินคอร์ส
          </>
        )}
      </Button>
    </form>
  );
};

export default SurveyForm;
