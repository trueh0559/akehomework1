import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Eye, EyeOff, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import NeuralBackground from '@/components/ui/NeuralBackground';
import AdminHeader from '@/components/admin/AdminHeader';
import type { Survey, SurveyQuestion } from '@/types/survey';

interface SurveyWithQuestions extends Survey {
  questionCount: number;
}

const AdminSurveys = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [surveys, setSurveys] = useState<SurveyWithQuestions[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  const fetchSurveys = async () => {
    const { data: surveysData, error: surveysError } = await supabase
      .from('surveys')
      .select('*')
      .order('created_at', { ascending: false });

    if (surveysError) {
      console.error('Error fetching surveys:', surveysError);
      toast.error('ไม่สามารถโหลดแบบสำรวจได้');
      setLoading(false);
      return;
    }

    // Get question counts
    const surveyIds = surveysData?.map((s) => s.id) || [];
    const { data: questionsData } = await supabase
      .from('survey_questions')
      .select('survey_id')
      .in('survey_id', surveyIds);

    const questionCounts: Record<string, number> = {};
    questionsData?.forEach((q) => {
      questionCounts[q.survey_id] = (questionCounts[q.survey_id] || 0) + 1;
    });

    const surveysWithCounts: SurveyWithQuestions[] = (surveysData || []).map((s) => ({
      ...s,
      questionCount: questionCounts[s.id] || 0,
    }));

    setSurveys(surveysWithCounts);
    setLoading(false);
  };

  const createSurvey = async () => {
    const { data, error } = await supabase
      .from('surveys')
      .insert({
        title: 'แบบสำรวจใหม่',
        description: '',
        is_active: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating survey:', error);
      toast.error('สร้างแบบสำรวจไม่สำเร็จ');
      return;
    }

    navigate(`/admin/surveys/${data.id}/edit`);
  };

  const toggleActive = async (survey: SurveyWithQuestions) => {
    // If activating, deactivate all others first
    if (!survey.is_active) {
      await supabase
        .from('surveys')
        .update({ is_active: false })
        .neq('id', survey.id);
    }

    const { error } = await supabase
      .from('surveys')
      .update({ is_active: !survey.is_active })
      .eq('id', survey.id);

    if (error) {
      console.error('Error toggling survey:', error);
      toast.error('อัพเดทไม่สำเร็จ');
      return;
    }

    setSurveys((prev) =>
      prev.map((s) =>
        s.id === survey.id
          ? { ...s, is_active: !survey.is_active }
          : { ...s, is_active: !survey.is_active ? false : s.is_active }
      )
    );
    toast.success(survey.is_active ? 'ปิดใช้งานแล้ว' : 'เปิดใช้งานแล้ว');
  };

  const deleteSurvey = async () => {
    if (!deleteId) return;

    const { error } = await supabase.from('surveys').delete().eq('id', deleteId);

    if (error) {
      console.error('Error deleting survey:', error);
      toast.error('ลบไม่สำเร็จ');
    } else {
      setSurveys((prev) => prev.filter((s) => s.id !== deleteId));
      toast.success('ลบแบบสำรวจเรียบร้อย');
    }
    setDeleteId(null);
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/admin')} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                กลับ
              </Button>
              <h1 className="text-2xl font-bold">จัดการแบบสำรวจ</h1>
            </div>
            <Button onClick={createSurvey} className="gap-2">
              <Plus className="w-4 h-4" />
              สร้างใหม่
            </Button>
          </div>

          {surveys.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">ยังไม่มีแบบสำรวจ</h3>
                <p className="text-muted-foreground mb-4">สร้างแบบสำรวจแรกของคุณ</p>
                <Button onClick={createSurvey} className="gap-2">
                  <Plus className="w-4 h-4" />
                  สร้างแบบสำรวจ
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {surveys.map((survey) => (
                <Card key={survey.id} className="glass-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {survey.title}
                          {survey.is_active && (
                            <Badge variant="default">
                              กำลังใช้งาน
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {survey.description || 'ไม่มีคำอธิบาย'}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleActive(survey)}
                          title={survey.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                        >
                          {survey.is_active ? (
                            <Eye className="w-4 h-4 text-primary" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/admin/surveys/${survey.id}/edit`)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(survey.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{survey.questionCount} คำถาม</span>
                      <span>•</span>
                      <span>
                        สร้างเมื่อ{' '}
                        {new Date(survey.created_at).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบแบบสำรวจนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={deleteSurvey} className="bg-destructive text-destructive-foreground">
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminSurveys;
