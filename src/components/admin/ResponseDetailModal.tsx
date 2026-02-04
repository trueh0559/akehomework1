import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Response } from '@/types/survey';

const emojis = ['😠', '😕', '😐', '🙂', '😄'];
const labels = [
  'ไม่พอใจเลย',
  'ยังไม่ค่อยเข้าใจ',
  'พอใช้ได้',
  'ดีมาก',
  'ดีมากและนำไปใช้ได้จริง',
];

const questionLabels = [
  'ความเข้าใจเนื้อหาการเขียน App ด้วย AI',
  'ความชัดเจนในการอธิบายและตัวอย่าง',
  'ความสามารถในการนำไปใช้งานจริง',
  'คุณภาพของเครื่องมือ / AI ที่ใช้ในคอร์ส',
  'ความคุ้มค่าและความพึงพอใจโดยรวมต่อคอร์ส',
];

interface ResponseDetailModalProps {
  response: Response | null;
  onClose: () => void;
}

const ResponseDetailModal = ({ response, onClose }: ResponseDetailModalProps) => {
  if (!response) return null;

  const scores = [
    response.q1_score,
    response.q2_score,
    response.q3_score,
    response.q4_score,
    response.q5_score,
  ];

  return (
    <Dialog open={!!response} onOpenChange={() => onClose()}>
      <DialogContent className="glass-card border-border/50 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center justify-between">
            รายละเอียดคำตอบ
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* User Info */}
          <div className="space-y-2 p-4 rounded-lg bg-secondary/30">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ชื่อ</span>
              <span className="text-foreground font-medium">{response.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="text-foreground">{response.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">วันที่</span>
              <span className="text-foreground">
                {new Date(response.created_at).toLocaleString('th-TH')}
              </span>
            </div>
          </div>

          {/* Scores */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">คะแนนรายข้อ</h3>
            {scores.map((score, index) => (
              <div key={index} className="p-3 rounded-lg bg-secondary/20 space-y-2">
                <p className="text-sm text-muted-foreground">
                  {index + 1}. {questionLabels[index]}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{emojis[score - 1]}</span>
                  <div>
                    <p className="text-foreground font-medium">{labels[score - 1]}</p>
                    <p className="text-sm text-muted-foreground">คะแนน: {score}/5</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Comment */}
          {response.comment && (
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">ข้อเสนอแนะเพิ่มเติม</h3>
              <p className="p-4 rounded-lg bg-secondary/30 text-foreground whitespace-pre-wrap">
                {response.comment}
              </p>
            </div>
          )}

          {/* Total */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-primary/20 to-accent/20 text-center">
            <p className="text-muted-foreground text-sm">คะแนนรวม</p>
            <p className="text-4xl font-bold text-foreground">
              {scores.reduce((a, b) => a + b, 0)}
              <span className="text-lg text-muted-foreground">/25</span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResponseDetailModal;
