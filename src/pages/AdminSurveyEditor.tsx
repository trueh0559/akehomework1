import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Eye, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import NeuralBackground from '@/components/ui/NeuralBackground';
import AdminHeader from '@/components/admin/AdminHeader';
import QuestionEditor from '@/components/surveys/QuestionEditor';
import QuestionRenderer from '@/components/surveys/QuestionRenderer';
import ImportExportButtons from '@/components/surveys/ImportExportButtons';
import SchedulingPicker from '@/components/surveys/SchedulingPicker';
import AIQuestionGenerator from '@/components/surveys/AIQuestionGenerator';
import type { Survey, SurveyQuestion, QuestionType } from '@/types/survey';

const AdminSurveyEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Partial<SurveyQuestion>[]>([]);
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState('edit');
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
        return;
      }
      if (!isAdmin) {
        navigate('/');
        return;
      }
      if (id) {
        fetchSurvey();
      }
    }
  }, [user, isAdmin, authLoading, navigate, id]);

  const fetchSurvey = async () => {
    const { data: surveyData, error: surveyError } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', id)
      .single();

    if (surveyError) {
      console.error('Error fetching survey:', surveyError);
      toast.error('ไม่พบแบบสำรวจ');
      navigate('/admin/surveys');
      return;
    }

    setSurvey(surveyData);

    const { data: questionsData, error: questionsError } = await supabase
      .from('survey_questions')
      .select('*')
      .eq('survey_id', id)
      .order('order_index', { ascending: true });

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
    } else if (questionsData) {
      const typedQuestions: Partial<SurveyQuestion>[] = questionsData.map((q) => ({
        ...q,
        question_type: q.question_type as QuestionType,
        config: q.config as SurveyQuestion['config'],
      }));
      setQuestions(typedQuestions);
    }

    setLoading(false);
  };

  const addQuestion = () => {
    const newQuestion: Partial<SurveyQuestion> = {
      survey_id: id,
      order_index: questions.length,
      question_text: '',
      question_type: 'linear_1_5',
      is_required: true,
      config: {},
      is_active: true,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updates: Partial<SurveyQuestion>) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...updates } : q))
    );
  };

  const deleteQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;

    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    setQuestions(newQuestions);
  };

  const handleImport = (importedQuestions: Partial<SurveyQuestion>[], mode: 'replace' | 'append') => {
    if (mode === 'replace') {
      setQuestions(importedQuestions.map((q, i) => ({ ...q, survey_id: id, order_index: i })));
    } else {
      const startIndex = questions.length;
      const newQuestions = importedQuestions.map((q, i) => ({
        ...q,
        survey_id: id,
        order_index: startIndex + i,
      }));
      setQuestions([...questions, ...newQuestions]);
    }
  };

  const handleAIInsert = (generatedQuestions: Partial<SurveyQuestion>[], mode: 'replace' | 'append') => {
    handleImport(generatedQuestions, mode);
    setShowAIGenerator(false);
  };

  const saveSurvey = async () => {
    if (!survey || !id) return;

    setSaving(true);

    try {
      const { error: surveyError } = await supabase
        .from('surveys')
        .update({
          title: survey.title,
          description: survey.description,
          start_at: survey.start_at,
          end_at: survey.end_at,
          is_active: survey.is_active,
        })
        .eq('id', id);

      if (surveyError) throw surveyError;

      await supabase.from('survey_questions').delete().eq('survey_id', id);

      if (questions.length > 0) {
        const questionsToInsert = questions.map((q, index) => ({
          survey_id: id,
          order_index: index,
          question_text: q.question_text || '',
          question_type: q.question_type || 'linear_1_5',
          is_required: q.is_required ?? true,
          config: JSON.parse(JSON.stringify(q.config || {})),
          is_active: q.is_active ?? true,
        }));

        const { error: questionsError } = await supabase
          .from('survey_questions')
          .insert(questionsToInsert as any);

        if (questionsError) throw questionsError;
      }

      toast.success('บันทึกเรียบร้อย');
    } catch (error: any) {
      console.error('Error saving survey:', error);
      toast.error('บันทึกไม่สำเร็จ: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="relative min-h-screen">
        <NeuralBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <NeuralBackground />
      <div className="relative z-10">
        <AdminHeader />

        <main className="container py-6 px-4">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <Button variant="ghost" onClick={() => navigate('/admin/surveys')} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              กลับ
            </Button>
            <div className="flex items-center gap-2">
              <ImportExportButtons
                survey={survey}
                questions={questions}
                onImport={handleImport}
              />
              <Button onClick={saveSurvey} disabled={saving} className="gap-2">
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                บันทึก
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="edit">แก้ไข</TabsTrigger>
              <TabsTrigger value="schedule">กำหนดเวลา</TabsTrigger>
              <TabsTrigger value="preview">ตัวอย่าง</TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="space-y-6">
              {/* Survey Info */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>ข้อมูลแบบสำรวจ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>ชื่อแบบสำรวจ</Label>
                    <Input
                      value={survey?.title || ''}
                      onChange={(e) =>
                        setSurvey(survey ? { ...survey, title: e.target.value } : null)
                      }
                      placeholder="ชื่อแบบสำรวจ"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>คำอธิบาย</Label>
                    <Textarea
                      value={survey?.description || ''}
                      onChange={(e) =>
                        setSurvey(survey ? { ...survey, description: e.target.value } : null)
                      }
                      placeholder="คำอธิบายแบบสำรวจ (ไม่บังคับ)"
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Questions */}
              <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
                  <CardTitle>คำถาม ({questions.length})</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAIGenerator(true)}
                      className="gap-1"
                    >
                      <Sparkles className="w-4 h-4" />
                      AI ช่วยคิด
                    </Button>
                    <Button onClick={addQuestion} size="sm" className="gap-1">
                      <Plus className="w-4 h-4" />
                      เพิ่มคำถาม
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AnimatePresence>
                    {questions.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-8 text-muted-foreground"
                      >
                        <p>ยังไม่มีคำถาม</p>
                        <div className="flex justify-center gap-2 mt-4">
                          <Button onClick={addQuestion} variant="outline" className="gap-1">
                            <Plus className="w-4 h-4" />
                            เพิ่มคำถามแรก
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowAIGenerator(true)}
                            className="gap-1"
                          >
                            <Sparkles className="w-4 h-4" />
                            ให้ AI สร้าง
                          </Button>
                        </div>
                      </motion.div>
                    ) : (
                      questions.map((question, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <QuestionEditor
                            question={question}
                            index={index}
                            onChange={(updates) => updateQuestion(index, updates)}
                            onDelete={() => deleteQuestion(index)}
                            onMoveUp={() => moveQuestion(index, 'up')}
                            onMoveDown={() => moveQuestion(index, 'down')}
                            isFirst={index === 0}
                            isLast={index === questions.length - 1}
                          />
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>กำหนดเวลาเปิด-ปิด</CardTitle>
                </CardHeader>
                <CardContent>
                  <SchedulingPicker
                    survey={survey}
                    onChange={(updates) =>
                      setSurvey(survey ? { ...survey, ...updates } : null)
                    }
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview">
              <Card className="glass-card max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle>{survey?.title || 'แบบสำรวจ'}</CardTitle>
                  {survey?.description && (
                    <p className="text-muted-foreground">{survey.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-8">
                  {questions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      ยังไม่มีคำถาม
                    </p>
                  ) : (
                    questions.map((question, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="space-y-3"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            {index + 1}.
                          </span>
                          <div className="flex-1">
                            <p className="font-medium">
                              {question.question_text || 'คำถาม'}
                              {question.is_required && (
                                <span className="text-destructive ml-1">*</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="ml-6">
                          <QuestionRenderer
                            question={question as SurveyQuestion}
                            value={previewAnswers[index]}
                            onChange={(value) =>
                              setPreviewAnswers((prev) => ({ ...prev, [index]: value }))
                            }
                          />
                        </div>
                      </motion.div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* AI Generator Dialog */}
      <AIQuestionGenerator
        open={showAIGenerator}
        onClose={() => setShowAIGenerator(false)}
        onInsert={handleAIInsert}
        surveyTitle={survey?.title || ''}
      />
    </div>
  );
};

export default AdminSurveyEditor;
