import { useState } from 'react';
import { CheckCircle2, Sparkles, Gift, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';

interface PostSurveyLoginProps {
  responseId: string;
  onLoginSuccess: () => void;
}

const PostSurveyLogin = ({ responseId, onLoginSuccess }: PostSurveyLoginProps) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // Store response_id in localStorage so we can link it after redirect
      localStorage.setItem('pending_survey_response_id', responseId);
      
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + '/my-coupons',
      });

      if (error) {
        toast.error('เข้าสู่ระบบไม่สำเร็จ: ' + error.message);
        setLoading(false);
      }
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาด');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-8 py-12 animate-slide-up">
      {/* Success Icon */}
      <div className="relative">
        <div className="absolute inset-0 animate-pulse-glow">
          <div className="w-24 h-24 rounded-full bg-accent/20 blur-xl" />
        </div>
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-accent">
          <CheckCircle2 className="w-12 h-12 text-white" />
        </div>
      </div>

      {/* Success Message */}
      <div className="space-y-4 max-w-md">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            ขอบคุณสำหรับ Feedback!
          </h2>
          <Sparkles className="w-5 h-5 text-accent" />
        </div>
        
        <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
          ล็อกอินด้วย Gmail เพื่อรับ <span className="text-primary font-semibold">E-Coupon</span> สิทธิพิเศษ!
        </p>
      </div>

      {/* Coupon Preview */}
      <div className="flex gap-4 text-4xl opacity-80">
        <span className="animate-bounce" style={{ animationDelay: '0s' }}>🎁</span>
        <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>🎟️</span>
        <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>✨</span>
      </div>

      {/* Gmail Login Button */}
      <Button
        onClick={handleGoogleLogin}
        disabled={loading}
        size="lg"
        className="gap-3 px-8 py-6 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 shadow-lg"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Gift className="w-5 h-5" />
        )}
        ล็อกอินด้วย Gmail เพื่อรับคูปอง
      </Button>

      <p className="text-xs text-muted-foreground">
        เราจะไม่เผยแพร่ข้อมูลของคุณ ใช้สำหรับรับคูปองเท่านั้น
      </p>
    </div>
  );
};

export default PostSurveyLogin;
