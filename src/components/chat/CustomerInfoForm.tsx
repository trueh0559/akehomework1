import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, User, Phone, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CustomerInfoFormProps {
  sessionId: string;
  onComplete: () => void;
  onSkip: () => void;
  onClose: () => void;
}

const CustomerInfoForm = ({ sessionId, onComplete, onSkip, onClose }: CustomerInfoFormProps) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() && !phone.trim() && !email.trim()) {
      onSkip();
      return;
    }

    setIsSubmitting(true);

    try {
      // Update session with customer info
      const { error: updateError } = await supabase
        .from('chat_sessions')
        .update({
          customer_name: name.trim() || null,
          customer_phone: phone.trim() || null,
          customer_email: email.trim() || null,
        })
        .eq('id', sessionId);

      if (updateError) {
        throw new Error('Failed to save customer info');
      }

      // Call analyze-chat to complete the session
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (!resp.ok) {
        console.error('Failed to analyze chat');
      }

      toast({
        title: 'ขอบคุณครับ/ค่ะ',
        description: 'บันทึกข้อมูลเรียบร้อยแล้ว',
      });

      onComplete();
    } catch (error) {
      console.error('Error submitting customer info:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถบันทึกข้อมูลได้',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-4 right-4 w-[360px] sm:w-[400px] z-50"
    >
      <div className="bg-background border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
          <div>
            <h3 className="font-semibold">ขอข้อมูลติดต่อกลับ</h3>
            <p className="text-xs text-muted-foreground">ไม่บังคับ - สามารถข้ามได้</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              ชื่อ
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ชื่อของคุณ"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              เบอร์โทรศัพท์
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0xx-xxx-xxxx"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              อีเมล
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onSkip}
              disabled={isSubmitting}
            >
              ข้าม
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  กำลังบันทึก...
                </>
              ) : (
                'ส่งข้อมูล'
              )}
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default CustomerInfoForm;
