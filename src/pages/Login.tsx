import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { LogIn, Loader2, AlertCircle, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import NeuralBackground from '@/components/ui/NeuralBackground';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().trim().email('กรุณากรอก Email ให้ถูกต้อง'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
});

const Login = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoginError('');

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0] as string] = err.message;
      });
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    const { error } = await signIn(formData.email, formData.password);

    if (error) {
      setLoginError('Email หรือรหัสผ่านไม่ถูกต้อง');
      setIsSubmitting(false);
      return;
    }

    navigate('/admin');
  };

  return (
    <div className="relative min-h-screen">
      <NeuralBackground />
      
      <div className="relative z-10 container py-8 sm:py-12 md:py-16 px-4 flex items-center justify-center min-h-screen">
        <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl animate-slide-up w-full max-w-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center space-y-4 pb-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent glow-primary mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Feeldi
              </h1>
              <p className="text-muted-foreground text-sm">
                เข้าสู่ระบบสำหรับผู้ดูแลระบบ
              </p>
            </div>

            {loginError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="w-4 h-4" />
                {loginError}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={cn(
                    'bg-background/50 border-border/50 focus:border-primary input-glow transition-all',
                    errors.email && 'border-destructive'
                  )}
                />
                {errors.email && (
                  <p className="text-destructive text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium">
                  รหัสผ่าน
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={cn(
                    'bg-background/50 border-border/50 focus:border-primary input-glow transition-all',
                    errors.password && 'border-destructive'
                  )}
                />
                {errors.password && (
                  <p className="text-destructive text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.password}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (!formData.email) {
                    setErrors({ email: 'กรุณากรอก Email ก่อน' });
                    return;
                  }
                  const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                  });
                  if (error) {
                    toast.error('ไม่สามารถส่งลิงก์ได้: ' + error.message);
                  } else {
                    toast.success('ส่งลิงก์รีเซ็ตรหัสผ่านไปที่ Email แล้ว');
                  }
                }}
                className="text-sm text-primary hover:underline"
              >
                ลืมรหัสผ่าน?
              </button>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              size="lg"
              className={cn(
                'w-full gap-2 font-semibold text-base',
                'bg-gradient-to-r from-primary to-primary/80',
                'hover:from-primary/90 hover:to-primary/70',
                'glow-primary transition-all duration-300'
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  เข้าสู่ระบบ
                </>
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              ยังไม่มีบัญชี?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                สมัครสมาชิก
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
