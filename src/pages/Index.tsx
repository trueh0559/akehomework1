import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ChevronRight, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import NeuralBackground from '@/components/ui/NeuralBackground';
import FloatingAdminButton from '@/components/FloatingAdminButton';
import type { Survey } from '@/types/survey';

const Index = () => {
  const [loading, setLoading] = useState(true);
  const [openSurveys, setOpenSurveys] = useState<Survey[]>([]);

  useEffect(() => {
    fetchOpenSurveys();
  }, []);

  const fetchOpenSurveys = async () => {
    const now = new Date().toISOString();
    
    // Fetch active surveys that are currently open
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .eq('is_active', true)
      .or(`start_at.is.null,start_at.lte.${now}`)
      .or(`end_at.is.null,end_at.gte.${now}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching surveys:', error);
    } else {
      // Filter further in JavaScript for complex logic
      const filtered = (data || []).filter((survey) => {
        const startAt = survey.start_at ? new Date(survey.start_at) : null;
        const endAt = survey.end_at ? new Date(survey.end_at) : null;
        const nowDate = new Date();
        
        const startOk = !startAt || startAt <= nowDate;
        const endOk = !endAt || endAt >= nowDate;
        
        return startOk && endOk;
      });
      setOpenSurveys(filtered);
    }
    setLoading(false);
  };

  const getTimeRemaining = (endAt: string | null | undefined) => {
    if (!endAt) return null;
    const end = new Date(endAt);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'หมดเวลา';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `อีก ${days} วัน`;
    if (hours > 0) return `อีก ${hours} ชั่วโมง`;
    return 'ใกล้หมดเวลา';
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

  return (
    <div className="relative min-h-screen">
      <NeuralBackground />
      
      <div className="relative z-10 container py-8 sm:py-12 md:py-16 px-4 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            แบบสำรวจความพึงพอใจ
          </h1>
          <p className="text-muted-foreground text-lg">
            เลือกแบบสำรวจที่ต้องการตอบ
          </p>
        </motion.div>

        {/* Survey Cards */}
        {openSurveys.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="glass-card text-center py-12">
              <CardContent>
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-xl font-medium text-muted-foreground">
                  ไม่มีแบบสำรวจที่เปิดรับอยู่
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  กรุณากลับมาใหม่ภายหลัง
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid gap-4 sm:gap-6">
            {openSurveys.map((survey, index) => (
              <motion.div
                key={survey.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={`/survey/${survey.id}`}>
                  <Card className="glass-card hover:border-primary/50 transition-all cursor-pointer group">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-xl group-hover:text-primary transition-colors">
                            {survey.title}
                          </CardTitle>
                          {survey.description && (
                            <CardDescription className="mt-2 text-base">
                              {survey.description}
                            </CardDescription>
                          )}
                        </div>
                        <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {survey.end_at && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{getTimeRemaining(survey.end_at)}</span>
                          </div>
                        )}
                        {survey.end_at && (
                          <Badge variant="secondary" className="text-xs">
                            ปิด {format(new Date(survey.end_at), 'd MMM yyyy', { locale: th })}
                          </Badge>
                        )}
                        {!survey.end_at && (
                          <Badge variant="outline" className="text-xs">
                            ไม่จำกัดเวลา
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
        
        {/* Footer */}
        <p className="text-center text-muted-foreground text-xs sm:text-sm mt-12 opacity-60">
          © 2026 AI App Development Course
        </p>
      </div>

      <FloatingAdminButton />
    </div>
  );
};

export default Index;
