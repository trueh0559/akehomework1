import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const questionLabels = [
  'ความเข้าใจเนื้อหา',
  'ความชัดเจน',
  'นำไปใช้งานจริง',
  'คุณภาพเครื่องมือ',
  'ความคุ้มค่า',
];

interface AverageChartProps {
  data: { question: number; avg: number }[];
}

const AverageChart = ({ data }: AverageChartProps) => {
  const chartData = data.map((d, index) => ({
    name: `ข้อ ${d.question}`,
    label: questionLabels[index],
    avg: Number(d.avg.toFixed(2)),
  }));

  const getBarColor = (value: number) => {
    if (value >= 4) return 'hsl(var(--accent))';
    if (value >= 3) return 'hsl(var(--primary))';
    if (value >= 2) return 'hsl(45, 93%, 47%)';
    return 'hsl(var(--destructive))';
  };

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          📊 ค่าเฉลี่ยคะแนนรายข้อ
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                type="number" 
                domain={[0, 5]} 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                type="category" 
                dataKey="label" 
                width={100}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [`${value.toFixed(2)} / 5`, 'คะแนนเฉลี่ย']}
              />
              <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.avg)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default AverageChart;
