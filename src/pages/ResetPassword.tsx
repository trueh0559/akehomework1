import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { KeyRound, Loader2, AlertCircle, Heart, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import NeuralBackground from '@/components/ui/NeuralBackground';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const passwordSchema = z.object({
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'รหัสผ่านไม่ตรงกัน',
  path: ['confirmPassword'],
});

const ResetPassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User arrived via reset link - they can now set new password
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = passwordSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0] as string] = err.message;
      });
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.updateUser({
      password: formData.password,
    });

    if (error) {
      toast.error('ไม่สามารถเปลี่ยนรหัสผ่านได้: ' + error.message);
      setIsSubmitting(false);
      return;
    }

    setSuccess(true);
    toast.success('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
    setTimeout(() => navigate('/login'), 2000);
  };

  if (success) {
    return (
      <div className="relative min-h-screen">
        <NeuralBackground />
        <div className="relative z-10 container flex items-center justify-center min-h-screen px-4">
          <div className="glass-card rounded-2xl p-8 text-center max-w-md w-full">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">เปลี่ยนรหัสผ่านสำเร็จ!</h2>
            <p className="text-muted-foreground">กำลังพาไปหน้าเข้าสู่ระบบ...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <NeuralBackground />
      <div className="relative z-10 container py-8 px-4 flex items-center justify-center min-h-screen">
        <div className="glass-card rounded-2xl p-6 sm:p-8 shadow-2xl w-full max-w-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center space-y-4 pb-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent glow-primary mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">ตั้งรหัสผ่านใหม่</h1>
              <p className="text-muted-foreground text-sm">กรอกรหัสผ่านใหม่ที่ต้องการ</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">รหัสผ่านใหม่</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={cn('bg-background/50 border-border/50', errors.password && 'border-destructive')}
                />
                {errors.password && (
                  <p className="text-destructive text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {errors.password}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={cn('bg-background/50 border-border/50', errors.confirmPassword && 'border-destructive')}
                />
                {errors.confirmPassword && (
                  <p className="text-destructive text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              size="lg"
              className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80"
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> กำลังบันทึก...</>
              ) : (
                <><KeyRound className="w-5 h-5" /> ตั้งรหัสผ่านใหม่</>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
