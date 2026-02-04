import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Calendar, Clock, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Survey } from '@/types/survey';

interface SchedulingPickerProps {
  survey: Survey | null;
  onChange: (updates: Partial<Survey>) => void;
}

const SchedulingPicker = ({ survey, onChange }: SchedulingPickerProps) => {
  if (!survey) return null;

  const now = new Date();
  const startAt = survey.start_at ? new Date(survey.start_at) : null;
  const endAt = survey.end_at ? new Date(survey.end_at) : null;

  // Determine status
  let status: 'scheduled' | 'open' | 'closed' = 'open';
  if (!survey.is_active) {
    status = 'closed';
  } else if (startAt && startAt > now) {
    status = 'scheduled';
  } else if (endAt && endAt < now) {
    status = 'closed';
  }

  const statusBadge = {
    scheduled: { label: 'กำหนดเวลา', variant: 'secondary' as const },
    open: { label: 'เปิดรับ', variant: 'default' as const },
    closed: { label: 'ปิด', variant: 'destructive' as const },
  };

  const handleOpenNow = () => {
    onChange({
      is_active: true,
      start_at: new Date().toISOString(),
      end_at: null,
    });
  };

  const handleCloseNow = () => {
    onChange({
      end_at: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-4">
      {/* Status */}
      <div className="flex items-center gap-2">
        <Label>สถานะ:</Label>
        <Badge variant={statusBadge[status].variant}>
          {statusBadge[status].label}
        </Badge>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleOpenNow}
          className="gap-1"
        >
          <Play className="w-4 h-4" />
          เปิดทันที
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCloseNow}
          className="gap-1"
        >
          <Square className="w-4 h-4" />
          ปิดทันที
        </Button>
      </div>

      {/* Date pickers */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4" />
            เวลาเริ่ม
          </Label>
          <Input
            type="datetime-local"
            value={startAt ? format(startAt, "yyyy-MM-dd'T'HH:mm") : ''}
            onChange={(e) =>
              onChange({
                start_at: e.target.value ? new Date(e.target.value).toISOString() : null,
              })
            }
          />
          <p className="text-xs text-muted-foreground mt-1">
            ว่างไว้ = เปิดทันที
          </p>
        </div>

        <div>
          <Label className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4" />
            เวลาปิด
          </Label>
          <Input
            type="datetime-local"
            value={endAt ? format(endAt, "yyyy-MM-dd'T'HH:mm") : ''}
            onChange={(e) =>
              onChange({
                end_at: e.target.value ? new Date(e.target.value).toISOString() : null,
              })
            }
          />
          <p className="text-xs text-muted-foreground mt-1">
            ว่างไว้ = ไม่มีกำหนดปิด
          </p>
        </div>
      </div>

      {/* Summary */}
      {(startAt || endAt) && (
        <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          {startAt && (
            <p>
              🗓️ เริ่ม: {format(startAt, 'd MMMM yyyy HH:mm น.', { locale: th })}
            </p>
          )}
          {endAt && (
            <p>
              ⏰ ปิด: {format(endAt, 'd MMMM yyyy HH:mm น.', { locale: th })}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SchedulingPicker;
