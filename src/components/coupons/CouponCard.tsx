import { Gift, CheckCircle, Clock, Copy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

interface CouponCardProps {
  code: string;
  status: 'active' | 'used' | 'expired';
  campaignName: string;
  discountType: string;
  discountValue: number;
  description?: string;
  createdAt: string;
  usedAt?: string | null;
  expireAt?: string | null;
}

const CouponCard = ({
  code,
  status,
  campaignName,
  discountType,
  discountValue,
  description,
  createdAt,
  usedAt,
  expireAt,
}: CouponCardProps) => {
  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success('คัดลอกรหัสคูปองแล้ว!');
  };

  const statusConfig = {
    active: { label: 'ใช้ได้', variant: 'default' as const, icon: Gift, color: 'text-primary' },
    used: { label: 'ใช้แล้ว', variant: 'secondary' as const, icon: CheckCircle, color: 'text-muted-foreground' },
    expired: { label: 'หมดอายุ', variant: 'destructive' as const, icon: Clock, color: 'text-destructive' },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  const discountLabel = discountType === 'percentage'
    ? `ส่วนลด ${discountValue}%`
    : discountType === 'fixed'
    ? `ส่วนลด ฿${discountValue}`
    : `ของแถม/ของแจก`;

  return (
    <Card className={`glass-card overflow-hidden transition-all ${status !== 'active' ? 'opacity-60' : ''}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <StatusIcon className={`w-5 h-5 ${config.color}`} />
              <h3 className="font-semibold text-foreground">{campaignName}</h3>
              <Badge variant={config.variant}>{config.label}</Badge>
            </div>

            <p className="text-sm text-primary font-medium">{discountLabel}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}

            <div className="flex items-center gap-2 mt-2">
              <code className="text-lg font-mono font-bold text-foreground bg-muted px-3 py-1 rounded">
                {code}
              </code>
              {status === 'active' && (
                <Button variant="ghost" size="sm" onClick={copyCode}>
                  <Copy className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="flex gap-4 text-xs text-muted-foreground mt-1">
              <span>ออกเมื่อ: {new Date(createdAt).toLocaleDateString('th-TH')}</span>
              {usedAt && <span>ใช้เมื่อ: {new Date(usedAt).toLocaleDateString('th-TH')}</span>}
              {expireAt && <span>หมดอายุ: {new Date(expireAt).toLocaleDateString('th-TH')}</span>}
            </div>
          </div>

          {status === 'active' && (
            <div className="shrink-0">
              <QRCodeSVG value={code} size={80} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CouponCard;
