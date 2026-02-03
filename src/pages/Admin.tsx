import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import NeuralBackground from '@/components/ui/NeuralBackground';
import AdminHeader from '@/components/admin/AdminHeader';
import StatsCards from '@/components/admin/StatsCards';
import AverageChart from '@/components/admin/AverageChart';
import DistributionChart from '@/components/admin/DistributionChart';
import ResponsesTable from '@/components/admin/ResponsesTable';
import ResponseDetailModal from '@/components/admin/ResponseDetailModal';
import { Loader2 } from 'lucide-react';

export interface Response {
  id: string;
  created_at: string;
  name: string;
  email: string;
  q1_score: number;
  q2_score: number;
  q3_score: number;
  q4_score: number;
  q5_score: number;
  comment: string | null;
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [scoreFilter, setScoreFilter] = useState<string>('all');

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
      fetchResponses();
    }
  }, [user, isAdmin, authLoading, navigate]);

  const fetchResponses = async () => {
    try {
      const { data, error } = await supabase
        .from('responses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResponses(data || []);
    } catch (error) {
      console.error('Error fetching responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResponses = responses.filter((response) => {
    const matchesSearch =
      response.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      response.email.toLowerCase().includes(searchTerm.toLowerCase());

    const totalScore =
      response.q1_score +
      response.q2_score +
      response.q3_score +
      response.q4_score +
      response.q5_score;
    const avgScore = totalScore / 5;

    let matchesScore = true;
    if (scoreFilter === 'low') matchesScore = avgScore < 2.5;
    else if (scoreFilter === 'medium') matchesScore = avgScore >= 2.5 && avgScore < 4;
    else if (scoreFilter === 'high') matchesScore = avgScore >= 4;

    return matchesSearch && matchesScore;
  });

  // Calculate distribution for each question
  const distribution: { [key: string]: { [score: number]: number } } = {};
  [1, 2, 3, 4, 5].forEach((q) => {
    distribution[`q${q}`] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    responses.forEach((r) => {
      const score = r[`q${q}_score` as keyof Response] as number;
      distribution[`q${q}`][score] = (distribution[`q${q}`][score] || 0) + 1;
    });
  });

  // Calculate average scores for each response
  const responseAverages = responses.map((r) => 
    (r.q1_score + r.q2_score + r.q3_score + r.q4_score + r.q5_score) / 5
  );

  // Calculate dissatisfied percent (avg <= 2)
  const dissatisfiedCount = responseAverages.filter((avg) => avg <= 2).length;
  const dissatisfiedPercent = responses.length > 0 
    ? (dissatisfiedCount / responses.length) * 100 
    : 0;

  // Calculate median
  const calculateMedian = (values: number[]): number => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  const median = calculateMedian(responseAverages);

  const stats = {
    totalResponses: responses.length,
    avgTotal:
      responses.length > 0
        ? responseAverages.reduce((acc, avg) => acc + avg, 0) / responses.length
        : 0,
    avgByQuestion: [1, 2, 3, 4, 5].map((q) => ({
      question: q,
      avg:
        responses.length > 0
          ? responses.reduce((acc, r) => acc + (r[`q${q}_score` as keyof Response] as number), 0) /
            responses.length
          : 0,
    })),
    dissatisfiedPercent,
    median,
  };

  const exportCSV = () => {
    const headers = [
      'วันที่',
      'ชื่อ',
      'Email',
      'คะแนนข้อ 1',
      'คะแนนข้อ 2',
      'คะแนนข้อ 3',
      'คะแนนข้อ 4',
      'คะแนนข้อ 5',
      'คะแนนรวม',
      'ความคิดเห็น',
    ];

    const rows = filteredResponses.map((r) => [
      new Date(r.created_at).toLocaleDateString('th-TH'),
      r.name,
      r.email,
      r.q1_score,
      r.q2_score,
      r.q3_score,
      r.q4_score,
      r.q5_score,
      r.q1_score + r.q2_score + r.q3_score + r.q4_score + r.q5_score,
      r.comment || '',
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `survey-responses-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (authLoading || loading) {
    return (
      <div className="relative min-h-screen">
        <NeuralBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
          </div>
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
          <StatsCards stats={stats} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AverageChart data={stats.avgByQuestion} />
            <DistributionChart distribution={distribution} />
          </div>

          <ResponsesTable
            responses={filteredResponses}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            scoreFilter={scoreFilter}
            onScoreFilterChange={setScoreFilter}
            onViewDetail={setSelectedResponse}
            onExportCSV={exportCSV}
          />
        </main>
      </div>

      <ResponseDetailModal
        response={selectedResponse}
        onClose={() => setSelectedResponse(null)}
      />
    </div>
  );
};

export default Admin;
