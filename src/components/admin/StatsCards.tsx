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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      <Card className="glass-card border-border/50">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ผู้ตอบทั้งหมด</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.totalResponses}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-border/50">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">คะแนนเฉลี่ย</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">
                {stats.avgTotal.toFixed(2)}
                <span className="text-sm text-muted-foreground">/5</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-border/50">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-accent/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">พึงพอใจ</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">
                {stats.avgTotal > 0 ? ((stats.avgTotal / 5) * 100).toFixed(0) : 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={`glass-card border-border/50 ${stats.dissatisfiedPercent > 20 ? 'border-destructive/50' : ''}`}>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col items-center text-center gap-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              stats.dissatisfiedPercent > 20 ? 'bg-destructive/20' : 'bg-yellow-500/20'
            }`}>
              <AlertTriangle className={`w-5 h-5 ${
                stats.dissatisfiedPercent > 20 ? 'text-destructive' : 'text-yellow-500'
              }`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ไม่พอใจ</p>
              <p className={`text-xl sm:text-2xl font-bold ${
                stats.dissatisfiedPercent > 20 ? 'text-destructive' : 'text-foreground'
              }`}>
                {stats.dissatisfiedPercent.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-border/50 col-span-2 md:col-span-1">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/30 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Median</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">
                {stats.median.toFixed(2)}
                <span className="text-sm text-muted-foreground">/5</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;
