import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

const questionLabels = [
  'ความเข้าใจเนื้อหา',
  'ความชัดเจน',
  'นำไปใช้งานจริง',
  'คุณภาพเครื่องมือ',
  'ความคุ้มค่า',
];

interface Distribution {
  [key: string]: { [score: number]: number };
}

interface DistributionChartProps {
  distribution: Distribution;
}

const DistributionChart = ({ distribution }: DistributionChartProps) => {
  const getBarColor = (score: number) => {
    if (score <= 2) return 'hsl(var(--destructive))';
    if (score === 3) return 'hsl(45, 93%, 47%)';
    return 'hsl(var(--accent))';
  };

  const prepareChartData = (questionKey: string) => {
    const questionData = distribution[questionKey] || {};
    return [1, 2, 3, 4, 5].map((score) => ({
      score: `${score} คะแนน`,
      count: questionData[score] || 0,
      scoreValue: score,
    }));
  };

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          📊 การกระจายคะแนนรายข้อ
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="q1" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            {[1, 2, 3, 4, 5].map((q) => (
              <TabsTrigger key={q} value={`q${q}`} className="text-xs sm:text-sm">
                ข้อ {q}
              </TabsTrigger>
            ))}
          </TabsList>

          {[1, 2, 3, 4, 5].map((q) => (
            <TabsContent key={q} value={`q${q}`}>
              <p className="text-sm text-muted-foreground mb-4 text-center">
                {questionLabels[q - 1]}
              </p>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prepareChartData(`q${q}`)} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis 
                      dataKey="score" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(value: number) => [`${value} คน`, 'จำนวน']}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {prepareChartData(`q${q}`).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(entry.scoreValue)} />
                      ))}
                      <LabelList 
                        dataKey="count" 
                        position="top" 
                        fill="hsl(var(--foreground))"
                        fontSize={12}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DistributionChart;
