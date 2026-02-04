import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import QuestionRenderer from '@/components/surveys/QuestionRenderer';
import type { Survey, SurveyQuestion, QuestionType } from '@/types/survey';

interface DynamicSurveyFormProps {
  onComplete?: () => void;
}

const DynamicSurveyForm = ({ onComplete }: DynamicSurveyFormProps) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    fetchActiveSurvey();
  }, []);

  const fetchActiveSurvey = async () => {
    // Get active survey
    const { data: surveyData, error: surveyError } = await supabase
      .from('surveys')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (surveyError) {
      console.error('Error fetching survey:', surveyError);
      setLoading(false);
      return;
    }

    if (!surveyData) {
      setLoading(false);
      return;
    }

    setSurvey(surveyData);

    // Get questions
    const { data: questionsData, error: questionsError } = await supabase
      .from('survey_questions')
      .select('*')
      .eq('survey_id', surveyData.id)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
    } else if (questionsData) {
      const typedQuestions: SurveyQuestion[] = questionsData.map((q) => ({
        ...q,
        question_type: q.question_type as QuestionType,
        config: q.config as SurveyQuestion['config'],
      }));
      setQuestions(typedQuestions);
    }

    setLoading(false);
  };

  const progress = questions.length > 0
    ? (Object.keys(answers).filter((k) => answers[k] !== undefined).length / questions.length) * 100
    : 0;

  const validateForm = (): boolean => {
    // Check required questions
    for (const question of questions) {
      if (question.is_required) {
        const answer = answers[question.id];
        if (!answer) {
          toast.error(`กรุณาตอบคำถามข้อ ${question.order_index + 1}`);
          return false;
        }
      }
    }

    // Check name/email if not anonymous
    if (!isAnonymous) {
      if (!name.trim()) {
        toast.error('กรุณากรอกชื่อ');
        return false;
      }
      if (!email.trim() || !email.includes('@')) {
        toast.error('กรุณากรอกอีเมลที่ถูกต้อง');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!survey || !validateForm()) return;

    setSubmitting(true);

    try {
      // Insert response
      const { data: responseData, error: responseError } = await supabase
        .from('survey_responses')
        .insert({
          survey_id: survey.id,
          respondent_name: isAnonymous ? null : name,
          respondent_email: isAnonymous ? null : email,
          is_anonymous: isAnonymous,
          answers: answers,
        })
        .select()
        .single();

      if (responseError) throw responseError;

      // Trigger notification edge function
      try {
        await supabase.functions.invoke('notify-new-response', {
          body: { response_id: responseData.id },
        });
      } catch (notifyError) {
        console.error('Notification error (non-critical):', notifyError);
      }

      setSubmitted(true);
      toast.success('ส่งคำตอบเรียบร้อยแล้ว!');
      onComplete?.();
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!survey) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <p className="text-muted-foreground">ไม่มีแบบสำรวจที่เปิดใช้งานอยู่</p>
        </CardContent>
      </Card>
    );
  }

  if (submitted) {
    return (
      <Card className="text-center py-12">
        <CardContent className="space-y-4">
          <CheckCircle className="w-16 h-16 text-primary mx-auto" />
          <h2 className="text-2xl font-bold">ขอบคุณค่ะ!</h2>
          <p className="text-muted-foreground">ความคิดเห็นของคุณมีค่ามากสำหรับเรา</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>ความคืบหน้า</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Survey Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">{survey.title}</h1>
        {survey.description && (
          <p className="text-muted-foreground">{survey.description}</p>
        )}
      </div>

      {/* Respondent Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ข้อมูลผู้ตอบ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>ไม่ระบุตัวตน</Label>
              <p className="text-xs text-muted-foreground">ซ่อนชื่อและอีเมลของคุณ</p>
            </div>
            <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
          </div>

          {!isAnonymous && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>ชื่อ *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ชื่อของคุณ"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>อีเมล *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questions */}
      {questions.map((question, index) => (
        <Card key={question.id}>
          <CardHeader>
            <CardTitle className="text-lg flex items-start gap-2">
              <span className="text-muted-foreground">{index + 1}.</span>
              <span>
                {question.question_text}
                {question.is_required && <span className="text-destructive ml-1">*</span>}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QuestionRenderer
              question={question}
              value={answers[question.id]}
              onChange={(value) =>
                setAnswers((prev) => ({ ...prev, [question.id]: value }))
              }
            />
          </CardContent>
        </Card>
      ))}

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full gap-2"
        size="lg"
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        ส่งคำตอบ
      </Button>
    </div>
  );
};

export default DynamicSurveyForm;
