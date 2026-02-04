import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { UserPlus, Loader2, AlertCircle, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import NeuralBackground from '@/components/ui/NeuralBackground';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const registerSchema = z.object({
  email: z.string().trim().email('กรุณากรอก Email ให้ถูกต้อง'),
  password: z.string().min(3, 'รหัสผ่านต้องมีอย่างน้อย 3 ตัวอักษร'),
  confirmPassword: z.string(),
  displayName: z.string().trim().min(1, 'กรุณากรอกชื่อที่แสดง'),
  role: z.enum(['admin', 'user']),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'รหัสผ่านไม่ตรงกัน',
  path: ['confirmPassword'],
});

const Register = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    role: 'user' as 'admin' | 'user',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setRegisterError('');

    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0] as string] = err.message;
      });
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    const { error } = await signUp(
      formData.email,
      formData.password,
      formData.displayName,
      formData.role
    );

    if (error) {
      if (error.message.includes('already registered')) {
        setRegisterError('Email นี้ถูกใช้งานแล้ว');
      } else {
        setRegisterError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }
      setIsSubmitting(false);
      return;
    }

    toast.success('สมัครสมาชิกสำเร็จ!', {
      description: 'กรุณาเข้าสู่ระบบเพื่อใช้งาน',
    });
    navigate('/login');
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
                สร้างบัญชีผู้ใช้ใหม่
              </p>
            </div>

            {registerError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="w-4 h-4" />
                {registerError}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
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
                <Label htmlFor="displayName" className="text-foreground font-medium">
                  ชื่อที่แสดง <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="ชื่อของคุณ"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className={cn(
                    'bg-background/50 border-border/50 focus:border-primary input-glow transition-all',
                    errors.displayName && 'border-destructive'
                  )}
                />
                {errors.displayName && (
                  <p className="text-destructive text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.displayName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-foreground font-medium">
                  ประเภทผู้ใช้ <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'admin' | 'user') => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger className="bg-background/50 border-border/50 focus:border-primary">
                    <SelectValue placeholder="เลือกประเภทผู้ใช้" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">ผู้ใช้ทั่วไป (User)</SelectItem>
                    <SelectItem value="admin">ผู้ดูแลระบบ (Admin)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium">
                  รหัสผ่าน <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="อย่างน้อย 3 ตัวอักษร"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground font-medium">
                  ยืนยันรหัสผ่าน <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={cn(
                    'bg-background/50 border-border/50 focus:border-primary input-glow transition-all',
                    errors.confirmPassword && 'border-destructive'
                  )}
                />
                {errors.confirmPassword && (
                  <p className="text-destructive text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
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
                  กำลังสมัครสมาชิก...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  สมัครสมาชิก
                </>
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              มีบัญชีอยู่แล้ว?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                เข้าสู่ระบบ
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
