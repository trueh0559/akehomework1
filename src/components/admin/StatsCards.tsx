import { Users, Star, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardsProps {
  stats: {
    totalResponses: number;
    avgTotal: number;
    avgByQuestion: { question: number; avg: number }[];
  };
}

const StatsCards = ({ stats }: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className="glass-card border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">จำนวนผู้ตอบทั้งหมด</p>
              <p className="text-3xl font-bold text-foreground">{stats.totalResponses}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
              <Star className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">คะแนนเฉลี่ยรวม</p>
              <p className="text-3xl font-bold text-foreground">
                {stats.avgTotal.toFixed(2)}
                <span className="text-lg text-muted-foreground">/5</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-border/50 sm:col-span-2 lg:col-span-1">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/30 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ความพึงพอใจ</p>
              <p className="text-3xl font-bold text-foreground">
                {stats.avgTotal > 0 ? ((stats.avgTotal / 5) * 100).toFixed(0) : 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;
