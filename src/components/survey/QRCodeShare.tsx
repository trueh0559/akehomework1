import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Copy, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface QRCodeShareProps {
  url?: string;
}

const QRCodeShare = ({ url }: QRCodeShareProps) => {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  
  // Use published URL or current location
  const surveyUrl = url || 'https://akehomework1.lovable.app';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(surveyUrl);
      setCopied(true);
      toast.success('คัดลอก URL สำเร็จ');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('ไม่สามารถคัดลอก URL ได้');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-background/50 border-border/50 hover:border-primary/50"
        >
          <QrCode className="w-4 h-4" />
          <span className="hidden sm:inline">แชร์ QR Code</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md glass-card">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            แชร์แบบประเมิน
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6 py-4">
          {/* QR Code */}
          <div className="p-4 bg-white rounded-2xl shadow-lg">
            <QRCodeSVG
              value={surveyUrl}
              size={200}
              level="H"
              includeMargin
              imageSettings={{
                src: '/favicon.ico',
                height: 24,
                width: 24,
                excavate: true,
              }}
            />
          </div>
          
          {/* URL Display */}
          <div className="w-full space-y-2">
            <p className="text-xs text-muted-foreground text-center">
              สแกน QR Code หรือคัดลอก URL ด้านล่าง
            </p>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border/50">
              <span className="flex-1 text-xs text-muted-foreground truncate px-2">
                {surveyUrl}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="shrink-0 hover:bg-accent"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-accent" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Instructions */}
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>📱 ใช้กล้องมือถือสแกน QR Code</p>
            <p>🔗 หรือส่ง URL ให้เพื่อนร่วมคอร์ส</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeShare;
