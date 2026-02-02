import { useState } from 'react';
import { z } from 'zod';
import { Brain, Send, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import EmojiRating from './EmojiRating';
import ProgressIndicator from './ProgressIndicator';
import ThankYouPage from './ThankYouPage';
import { cn } from '@/lib/utils';

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

const SurveyForm = () => {
  const [formData, setFormData] = useState<Partial<SurveyData>>({
    name: '',
    email: '',
    comment: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const answeredQuestions = [
    formData.q1,
    formData.q2,
    formData.q3,
    formData.q4,
    formData.q5,
  ].filter((q) => q !== undefined).length;

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

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // For now, just log the data (will integrate with database later)
    console.log('Survey submitted:', result.data);

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      comment: '',
    });
    setErrors({});
    setIsSubmitted(false);
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

      {/* Progress */}
      <ProgressIndicator current={answeredQuestions} total={5} />

      {/* User Info */}
      <div className="space-y-4 p-4 sm:p-6 rounded-xl bg-secondary/30 border border-border/50">
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
              className="p-4 sm:p-6 rounded-xl bg-secondary/20 border border-border/30 hover:border-primary/30 transition-colors"
            >
              <EmojiRating
                question={question}
                questionNumber={index + 1}
                value={(formData as Record<string, number | string | undefined>)[`q${index + 1}`] as number | null ?? null}
                onChange={(value) => handleInputChange(`q${index + 1}` as keyof SurveyData, value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Comment */}
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
