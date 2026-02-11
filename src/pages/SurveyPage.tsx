import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Send, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import NeuralBackground from '@/components/ui/NeuralBackground';
import QuestionRenderer from '@/components/surveys/QuestionRenderer';
import FloatingAdminButton from '@/components/FloatingAdminButton';
import PostSurveyLogin from '@/components/survey/PostSurveyLogin';
import type { Survey, SurveyQuestion, QuestionType } from '@/types/survey';

const SurveyPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lastResponseId, setLastResponseId] = useState<string | null>(null);
  const [notOpen, setNotOpen] = useState(false);
  const [notOpenMessage, setNotOpenMessage] = useState('');
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (id) {
      fetchSurvey();
    }
  }, [id]);

  const fetchSurvey = async () => {
    const { data: surveyData, error: surveyError } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', id)
      .single();

    if (surveyError || !surveyData) {
      setLoading(false);
      return;
    }

    // Check if survey is open
    const now = new Date();
    const startAt = surveyData.start_at ? new Date(surveyData.start_at) : null;
    const endAt = surveyData.end_at ? new Date(surveyData.end_at) : null;

    if (!surveyData.is_active) {
      setNotOpen(true);
      setNotOpenMessage('แบบสำรวจนี้ปิดรับคำตอบแล้ว');
      setLoading(false);
      return;
    }

    if (startAt && startAt > now) {
      setNotOpen(true);
      setNotOpenMessage(`แบบสำรวจจะเปิดในวันที่ ${startAt.toLocaleDateString('th-TH')}`);
      setLoading(false);
      return;
    }

    if (endAt && endAt < now) {
      setNotOpen(true);
      setNotOpenMessage('แบบสำรวจนี้หมดเวลารับคำตอบแล้ว');
      setLoading(false);
      return;
    }

    setSurvey(surveyData);

    // Get questions
    const { data: questionsData } = await supabase
      .from('survey_questions')
      .select('*')
      .eq('survey_id', id)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (questionsData) {
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
    for (const question of questions) {
      if (question.is_required) {
        const answer = answers[question.id];
        if (!answer) {
          toast.error(`กรุณาตอบคำถามข้อ ${question.order_index + 1}`);
          return false;
        }
      }
    }

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
      const insertPayload: any = {
        survey_id: survey.id,
        respondent_name: isAnonymous ? null : name,
        respondent_email: isAnonymous ? null : email,
        is_anonymous: isAnonymous,
        answers: answers,
      };

      // Include user_id if authenticated (needed for RLS SELECT after insert)
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        insertPayload.user_id = currentUser.id;
      }

      const { data: responseData, error: responseError } = await supabase
        .from('survey_responses')
        .insert(insertPayload)
        .select()
        .single();

      if (responseError) throw responseError;
      setLastResponseId(responseData.id);

      // Trigger notification
      try {
        await supabase.functions.invoke('notify-new-response', {
          body: { response_id: responseData.id },
        });
      } catch (notifyError) {
        console.error('Notification error:', notifyError);
      }

      setSubmitted(true);
      toast.success('ส่งคำตอบเรียบร้อยแล้ว!');
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <NeuralBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (notOpen || !survey) {
    return (
      <div className="relative min-h-screen">
        <NeuralBackground />
        <div className="relative z-10 container py-8 px-4 max-w-2xl">
          <Card className="glass-card text-center py-12">
            <CardContent className="space-y-4">
              <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto" />
              <h2 className="text-xl font-semibold">
                {notOpenMessage || 'ไม่พบแบบสำรวจ'}
              </h2>
              <Button variant="outline" onClick={() => navigate('/')} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                กลับหน้าหลัก
              </Button>
            </CardContent>
          </Card>
        </div>
        <FloatingAdminButton />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="relative min-h-screen">
        <NeuralBackground />
        <div className="relative z-10 container py-8 px-4 max-w-2xl">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glass-card py-8">
              <CardContent>
                <PostSurveyLogin
                  responseId={lastResponseId || ''}
                  onLoginSuccess={() => navigate('/my-coupons')}
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>
        <FloatingAdminButton />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <NeuralBackground />
      
      <div className="relative z-10 container py-8 sm:py-12 px-4 max-w-2xl">
        <div className="glass-card rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="space-y-6">
            {/* Progress */}
            <div className="space-y-2 sticky top-0 bg-card/80 backdrop-blur-sm -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-2xl z-10">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>ความคืบหน้า</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Survey Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-2"
            >
              <h1 className="text-2xl font-bold">{survey.title}</h1>
              {survey.description && (
                <p className="text-muted-foreground">{survey.description}</p>
              )}
            </motion.div>

            {/* Questions */}
            <AnimatePresence>
              {questions.map((question, index) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-start gap-2">
                        <span className="text-muted-foreground">{index + 1}.</span>
                        <span>
                          {question.question_text}
                          {question.is_required && (
                            <span className="text-destructive ml-1">*</span>
                          )}
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
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Respondent Info - At the end */}
            <Separator className="my-6" />
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="text-lg">ข้อมูลผู้ตอบ</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    กรอกข้อมูลเพื่อรับการติดตามผล หรือเลือกไม่ระบุตัวตน
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>ไม่ระบุตัวตน</Label>
                      <p className="text-xs text-muted-foreground">ซ่อนชื่อและอีเมลของคุณ</p>
                    </div>
                    <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                  </div>

                  <AnimatePresence>
                    {!isAnonymous && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid sm:grid-cols-2 gap-4"
                      >
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>

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
        </div>
        
        <p className="text-center text-muted-foreground text-xs sm:text-sm mt-8 opacity-60">
          © 2026 AI App Development Course
        </p>
      </div>

      <FloatingAdminButton />
    </div>
  );
};

export default SurveyPage;
