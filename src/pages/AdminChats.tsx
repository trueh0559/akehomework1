import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { 
  MessageSquare, 
  Search, 
  Filter,
  Eye,
  Loader2,
  User,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  Heart,
  Building2,
  FileQuestion,
  Users,
  HelpCircle,
  AlertTriangle,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AdminHeader from '@/components/admin/AdminHeader';
import NeuralBackground from '@/components/ui/NeuralBackground';
import { useNavigate } from 'react-router-dom';

type ChatSession = {
  id: string;
  started_at: string;
  ended_at: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  sentiment: 'satisfied' | 'neutral' | 'dissatisfied' | null;
  sentiment_reason: string | null;
  summary: string | null;
  status: string;
  message_count: number;
  department: string | null;
  problem_type: string | null;
  page_url: string | null;
  source: string | null;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

const sentimentConfig = {
  satisfied: { label: 'พอใจ', color: 'bg-green-500/20 text-green-500 border-green-500/30', icon: '😊' },
  neutral: { label: 'กลางๆ', color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30', icon: '😐' },
  dissatisfied: { label: 'ไม่พอใจ', color: 'bg-red-500/20 text-red-500 border-red-500/30', icon: '😞' },
};

const departmentConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  survey: { label: 'ฝ่ายวิเคราะห์ข้อมูล', icon: <FileQuestion className="w-4 h-4" /> },
  insurance: { label: 'ที่ปรึกษาประกัน', icon: <Heart className="w-4 h-4" /> },
  real_estate: { label: 'ที่ปรึกษาอสังหาฯ', icon: <Building2 className="w-4 h-4" /> },
  customer_service: { label: 'บริการลูกค้า', icon: <Users className="w-4 h-4" /> },
  general: { label: 'ทั่วไป', icon: <HelpCircle className="w-4 h-4" /> },
};

const AdminChats = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [sessionMessages, setSessionMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/login');
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchSessions();
    }
  }, [user, isAdmin]);

  const fetchSessions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
    } else {
      setSessions((data || []) as ChatSession[]);
    }
    setLoading(false);
  };

  const fetchMessages = async (sessionId: string) => {
    setLoadingMessages(true);
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setSessionMessages((data || []) as ChatMessage[]);
    }
    setLoadingMessages(false);
  };

  const handleViewSession = async (session: ChatSession) => {
    setSelectedSession(session);
    await fetchMessages(session.id);
  };

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch = 
      !searchTerm ||
      session.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.problem_type?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSentiment = 
      sentimentFilter === 'all' || session.sentiment === sentimentFilter;

    const matchesDepartment = 
      departmentFilter === 'all' || session.department === departmentFilter;

    return matchesSearch && matchesSentiment && matchesDepartment;
  });

  // Stats
  const totalSessions = sessions.length;
  const satisfiedCount = sessions.filter(s => s.sentiment === 'satisfied').length;
  const neutralCount = sessions.filter(s => s.sentiment === 'neutral').length;
  const dissatisfiedCount = sessions.filter(s => s.sentiment === 'dissatisfied').length;

  if (authLoading || (!user && loading)) {
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    ประวัติ Chat
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                      AI Chat – รู้ใจ
                    </Badge>
                  </h1>
                  <p className="text-sm text-muted-foreground">ดูและวิเคราะห์การสนทนากับลูกค้า</p>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="glass-card">
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{totalSessions}</div>
                  <p className="text-sm text-muted-foreground">ทั้งหมด</p>
                </CardContent>
              </Card>
              <Card className="glass-card border-green-500/30">
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-green-500">{satisfiedCount}</div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <span>😊</span> พอใจ
                  </p>
                </CardContent>
              </Card>
              <Card className="glass-card border-yellow-500/30">
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-yellow-500">{neutralCount}</div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <span>😐</span> กลางๆ
                  </p>
                </CardContent>
              </Card>
              <Card className="glass-card border-red-500/30">
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-red-500">{dissatisfiedCount}</div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <span>😞</span> ไม่พอใจ
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="glass-card mb-6">
              <CardContent className="pt-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="ค้นหาชื่อ, อีเมล, สรุป, หรือประเภทปัญหา..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <Building2 className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="แผนก" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทุกแผนก</SelectItem>
                      <SelectItem value="survey">ฝ่ายวิเคราะห์ข้อมูล</SelectItem>
                      <SelectItem value="insurance">ที่ปรึกษาประกัน</SelectItem>
                      <SelectItem value="real_estate">ที่ปรึกษาอสังหาฯ</SelectItem>
                      <SelectItem value="customer_service">บริการลูกค้า</SelectItem>
                      <SelectItem value="general">ทั่วไป</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="ความพึงพอใจ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                      <SelectItem value="satisfied">😊 พอใจ</SelectItem>
                      <SelectItem value="neutral">😐 กลางๆ</SelectItem>
                      <SelectItem value="dissatisfied">😞 ไม่พอใจ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Sessions Table */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">รายการสนทนา</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>ไม่พบรายการสนทนา</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>วันที่</TableHead>
                          <TableHead>ลูกค้า</TableHead>
                          <TableHead>แผนก/บทบาท</TableHead>
                          <TableHead>ความพึงพอใจ</TableHead>
                          <TableHead>สรุป</TableHead>
                          <TableHead>ข้อความ</TableHead>
                          <TableHead className="text-right">ดู</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSessions.map((session) => (
                          <TableRow 
                            key={session.id}
                            className={session.sentiment === 'dissatisfied' ? 'bg-red-500/5' : ''}
                          >
                            <TableCell className="whitespace-nowrap">
                              <div className="text-sm">
                                {format(new Date(session.started_at), 'd MMM yyyy', { locale: th })}
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(session.started_at), 'HH:mm น.')}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="flex items-center gap-1">
                                  {session.sentiment === 'dissatisfied' && (
                                    <AlertTriangle className="w-3 h-3 text-red-500" />
                                  )}
                                  {session.customer_name || '-'}
                                </div>
                                {session.customer_email && (
                                  <p className="text-xs text-muted-foreground">{session.customer_email}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {session.department ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-primary">
                                    {departmentConfig[session.department]?.icon}
                                  </span>
                                  <span className="text-xs">
                                    {departmentConfig[session.department]?.label || session.department}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {session.sentiment ? (
                                <Badge 
                                  variant="outline" 
                                  className={sentimentConfig[session.sentiment].color}
                                >
                                  <span className="mr-1">{sentimentConfig[session.sentiment].icon}</span>
                                  {sentimentConfig[session.sentiment].label}
                                </Badge>
                              ) : (
                                <Badge variant="outline">รอวิเคราะห์</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <p className="text-sm max-w-[200px] truncate">
                                {session.summary || '-'}
                              </p>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{session.message_count}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewSession(session)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>

      {/* Session Detail Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              รายละเอียดการสนทนา
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 ml-2">
                AI Chat – รู้ใจ
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          {selectedSession && (
            <ScrollArea className="max-h-[calc(85vh-100px)]">
              <div className="space-y-4 pr-4">
                {/* Customer Info */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedSession.customer_name || 'ไม่ระบุชื่อ'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedSession.customer_phone || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedSession.customer_email || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{format(new Date(selectedSession.started_at), 'd MMM yyyy HH:mm', { locale: th })}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Department & Role Info */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">บทบาทรู้ใจ:</span>
                        {selectedSession.department ? (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            {departmentConfig[selectedSession.department]?.icon}
                            {departmentConfig[selectedSession.department]?.label}
                          </Badge>
                        ) : (
                          <span>-</span>
                        )}
                      </div>
                      {selectedSession.problem_type && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">ประเภทปัญหา:</span>
                          <Badge variant="outline">{selectedSession.problem_type}</Badge>
                        </div>
                      )}
                      {selectedSession.page_url && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {selectedSession.page_url}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Sentiment & Summary */}
                <Card className={selectedSession.sentiment === 'dissatisfied' ? 'border-red-500/50' : ''}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-sm font-medium">ความพึงพอใจ:</span>
                      {selectedSession.sentiment ? (
                        <Badge 
                          variant="outline" 
                          className={sentimentConfig[selectedSession.sentiment].color}
                        >
                          <span className="mr-1">{sentimentConfig[selectedSession.sentiment].icon}</span>
                          {sentimentConfig[selectedSession.sentiment].label}
                        </Badge>
                      ) : (
                        <Badge variant="outline">รอวิเคราะห์</Badge>
                      )}
                    </div>
                    
                    {selectedSession.sentiment_reason && (
                      <div className="mb-3">
                        <span className="text-sm font-medium">เหตุผล:</span>
                        <p className="text-sm text-muted-foreground mt-1 p-2 bg-muted/50 rounded-md">
                          {selectedSession.sentiment_reason}
                        </p>
                      </div>
                    )}

                    <div>
                      <span className="text-sm font-medium">สรุป:</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedSession.summary || 'ยังไม่มีสรุป'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Messages */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">ข้อความ ({sessionMessages.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-[300px] overflow-y-auto pr-2">
                      {loadingMessages ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      ) : sessionMessages.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">ไม่มีข้อความ</p>
                      ) : (
                        <div className="space-y-3">
                          {sessionMessages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                                  msg.role === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                {msg.role === 'assistant' && (
                                  <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
                                    <Heart className="w-3 h-3" /> รู้ใจ
                                  </p>
                                )}
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                <p className="text-[10px] opacity-70 mt-1">
                                  {format(new Date(msg.created_at), 'HH:mm')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminChats;
