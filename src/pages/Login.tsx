import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { LogIn, Loader2, AlertCircle, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast.error('ไม่สามารถเข้าสู่ระบบด้วย Google ได้');
      setIsGoogleLoading(false);
    }
  };

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
                เข้าสู่ระบบ
              </p>
            </div>

            {/* Google Login */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={isGoogleLoading}
              onClick={handleGoogleLogin}
              className="w-full gap-3 font-medium text-base bg-background/50 border-border/50 hover:bg-background/80"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              เข้าสู่ระบบด้วย Google
            </Button>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">หรือ</span>
              <Separator className="flex-1" />
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
