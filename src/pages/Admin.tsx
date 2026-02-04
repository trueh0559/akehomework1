import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import NeuralBackground from '@/components/ui/NeuralBackground';
import AdminHeader from '@/components/admin/AdminHeader';
import { Loader2, Users, TrendingUp, AlertTriangle, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { Survey, SurveyQuestion, SurveyResponse, QuestionType } from '@/types/survey';
import { SCORE_QUESTION_TYPES } from '@/types/survey';

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>('');
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [dateRange, setDateRange] = useState<'7' | '30' | 'all'>('30');

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
      fetchSurveys();
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (selectedSurveyId) {
      fetchSurveyData();
    }
  }, [selectedSurveyId, dateRange]);

  const fetchSurveys = async () => {
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching surveys:', error);
    } else if (data && data.length > 0) {
      setSurveys(data);
      setSelectedSurveyId(data[0].id);
    }
    setLoading(false);
  };

  const fetchSurveyData = async () => {
    // Fetch questions
    const { data: questionsData } = await supabase
      .from('survey_questions')
      .select('*')
      .eq('survey_id', selectedSurveyId)
      .order('order_index', { ascending: true });

    if (questionsData) {
      setQuestions(
        questionsData.map((q) => ({
          ...q,
          question_type: q.question_type as QuestionType,
          config: q.config as SurveyQuestion['config'],
        }))
      );
    }

    // Fetch responses with date filter
    let query = supabase
      .from('survey_responses')
      .select('*')
      .eq('survey_id', selectedSurveyId)
      .order('submitted_at', { ascending: false });

    if (dateRange !== 'all') {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));
      query = query.gte('submitted_at', daysAgo.toISOString());
    }

    const { data: responsesData } = await query;

    if (responsesData) {
      setResponses(responsesData as SurveyResponse[]);
    }
  };

  // Calculate analytics
  const analytics = useMemo(() => {
    if (!questions.length || !responses.length) {
      return { scoreQuestions: [], choiceQuestions: [], textQuestions: [] };
    }

    const scoreQuestions: any[] = [];
    const choiceQuestions: any[] = [];
    const textQuestions: any[] = [];

    questions.forEach((q) => {
      const isScoreType = SCORE_QUESTION_TYPES.includes(q.question_type);
      const isChoiceType = ['single_choice', 'multi_choice', 'icon_size_scale'].includes(q.question_type);
      const isTextType = ['short_text', 'long_text'].includes(q.question_type);

      const questionAnswers = responses
        .map((r) => r.answers[q.id])
        .filter(Boolean);

      if (isScoreType) {
        const scores = questionAnswers.map((a) => a.score).filter((s) => typeof s === 'number');
        const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        
        // Distribution
        const distribution: Record<number, number> = {};
        const max = q.config.max || 5;
        const buckets = max <= 5 ? [1, 2, 3, 4, 5] : [0, 2, 4, 6, 8, 10];
        
        scores.forEach((s) => {
          const bucket = max <= 5 ? Math.round(s) : Math.floor(s / 2) * 2;
          distribution[bucket] = (distribution[bucket] || 0) + 1;
        });

        scoreQuestions.push({
          id: q.id,
          text: q.question_text,
          type: q.question_type,
          avg: avg.toFixed(2),
          count: scores.length,
          max,
          distribution: Object.entries(distribution).map(([score, count]) => ({
            score: Number(score),
            count,
          })),
        });
      }

      if (isChoiceType) {
        const distribution: Record<string, number> = {};
        
        questionAnswers.forEach((a) => {
          const selected = Array.isArray(a.selected) ? a.selected : [a.selected];
          selected.forEach((s: string) => {
            if (s) distribution[s] = (distribution[s] || 0) + 1;
          });
        });

        choiceQuestions.push({
          id: q.id,
          text: q.question_text,
          type: q.question_type,
          distribution: Object.entries(distribution)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value),
        });
      }

      if (isTextType) {
        const texts = questionAnswers
          .map((a) => a.text)
          .filter((t) => t && t.trim())
          .slice(0, 10);

        textQuestions.push({
          id: q.id,
          text: q.question_text,
          type: q.question_type,
          responses: texts,
        });
      }
    });

    return { scoreQuestions, choiceQuestions, textQuestions };
  }, [questions, responses]);

  // Overall stats
  const overallStats = useMemo(() => {
    if (!analytics.scoreQuestions.length) {
      return { avgScore: 0, satisfiedPercent: 0, totalResponses: responses.length };
    }

    const allAvgs = analytics.scoreQuestions.map((q) => parseFloat(q.avg));
    const overallAvg = allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length;

    // Calculate satisfaction (avg >= 4 on 1-5 scale or >= 7 on 0-10 scale)
    let satisfiedCount = 0;
    analytics.scoreQuestions.forEach((q) => {
      const threshold = q.max <= 5 ? 4 : 7;
      if (parseFloat(q.avg) >= threshold) satisfiedCount++;
    });
    const satisfiedPercent = (satisfiedCount / analytics.scoreQuestions.length) * 100;

    return {
      avgScore: overallAvg.toFixed(2),
      satisfiedPercent: satisfiedPercent.toFixed(0),
      totalResponses: responses.length,
    };
  }, [analytics, responses]);

  if (authLoading || loading) {
    return (
      <div className="relative min-h-screen">
        <NeuralBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <NeuralBackground />

      <div className="relative z-10">
        <AdminHeader />

        <main className="container py-6 px-4 space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label className="mb-2 block">เลือกแบบสำรวจ</Label>
              <Select value={selectedSurveyId} onValueChange={setSelectedSurveyId}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกแบบสำรวจ" />
                </SelectTrigger>
                <SelectContent>
                  {surveys.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">ช่วงเวลา</Label>
              <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 วันล่าสุด</SelectItem>
                  <SelectItem value="30">30 วันล่าสุด</SelectItem>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/20">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">จำนวนคำตอบ</p>
                      <p className="text-3xl font-bold">{overallStats.totalResponses}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-accent/20">
                      <TrendingUp className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">คะแนนเฉลี่ย</p>
                      <p className="text-3xl font-bold">{overallStats.avgScore}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-green-500/20">
                      <AlertTriangle className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ความพึงพอใจ</p>
                      <p className="text-3xl font-bold">{overallStats.satisfiedPercent}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {responses.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">ยังไม่มีคำตอบในช่วงเวลานี้</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Score Questions Charts */}
              {analytics.scoreQuestions.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">ค่าเฉลี่ยคะแนนรายข้อ</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {analytics.scoreQuestions.map((q, idx) => (
                      <motion.div
                        key={q.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <Card className="glass-card">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium line-clamp-2">
                              {q.text}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                              ค่าเฉลี่ย: <span className="text-primary font-bold">{q.avg}</span> / {q.max}
                            </p>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={150}>
                              <BarChart data={q.distribution}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="score" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip
                                  contentStyle={{
                                    background: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                  }}
                                />
                                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Choice Questions Charts */}
              {analytics.choiceQuestions.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">การกระจายตัวเลือก</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {analytics.choiceQuestions.map((q, idx) => (
                      <motion.div
                        key={q.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <Card className="glass-card">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium line-clamp-2">
                              {q.text}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={200}>
                              <PieChart>
                                <Pie
                                  data={q.distribution}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={40}
                                  outerRadius={70}
                                  paddingAngle={2}
                                  dataKey="value"
                                  label={({ name, percent }) =>
                                    `${name} (${(percent * 100).toFixed(0)}%)`
                                  }
                                  labelLine={false}
                                >
                                  {q.distribution.map((_: any, index: number) => (
                                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Text Responses */}
              {analytics.textQuestions.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">คำตอบแบบข้อความ</h2>
                  {analytics.textQuestions.map((q) => (
                    <Card key={q.id} className="glass-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{q.text}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {q.responses.length === 0 ? (
                            <p className="text-sm text-muted-foreground">ยังไม่มีคำตอบ</p>
                          ) : (
                            q.responses.map((text: string, idx: number) => (
                              <div
                                key={idx}
                                className="p-3 rounded-lg bg-muted/30 text-sm"
                              >
                                "{text}"
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Admin;
