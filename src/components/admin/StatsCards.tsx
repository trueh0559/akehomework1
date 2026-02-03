import { Users, Star, TrendingUp, AlertTriangle, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardsProps {
  stats: {
    totalResponses: number;
    avgTotal: number;
    avgByQuestion: { question: number; avg: number }[];
    dissatisfiedPercent: number;
    median: number;
  };
}

const StatsCards = ({ stats }: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      <Card className="glass-card border-border/50">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">ผู้ตอบทั้งหมด</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{stats.totalResponses}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-border/50">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">คะแนนเฉลี่ย</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">
                {stats.avgTotal.toFixed(2)}
                <span className="text-base sm:text-lg text-muted-foreground">/5</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-border/50">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-accent/30 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">พึงพอใจ</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">
                {stats.avgTotal > 0 ? ((stats.avgTotal / 5) * 100).toFixed(0) : 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={`glass-card border-border/50 ${stats.dissatisfiedPercent > 20 ? 'border-destructive/50' : ''}`}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${
              stats.dissatisfiedPercent > 20 ? 'bg-destructive/20' : 'bg-yellow-500/20'
            }`}>
              <AlertTriangle className={`w-5 h-5 sm:w-6 sm:h-6 ${
                stats.dissatisfiedPercent > 20 ? 'text-destructive' : 'text-yellow-500'
              }`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">ไม่พอใจ</p>
              <p className={`text-2xl sm:text-3xl font-bold ${
                stats.dissatisfiedPercent > 20 ? 'text-destructive' : 'text-foreground'
              }`}>
                {stats.dissatisfiedPercent.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-border/50 col-span-2 sm:col-span-1">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/30 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Median</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">
                {stats.median.toFixed(2)}
                <span className="text-base sm:text-lg text-muted-foreground">/5</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;
