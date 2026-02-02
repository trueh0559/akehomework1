import { CheckCircle2, Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ThankYouPageProps {
  onReset: () => void;
}

const ThankYouPage = ({ onReset }: ThankYouPageProps) => {
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
            ขอบคุณสำหรับ Feedback
          </h2>
          <Sparkles className="w-5 h-5 text-accent" />
        </div>
        
        <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
          ทีมงานจะนำความคิดเห็นของคุณไปพัฒนาคอร์ส AI ให้ดียิ่งขึ้น
        </p>
      </div>

      {/* Decorative Elements */}
      <div className="flex gap-4 text-4xl opacity-80">
        <span className="animate-bounce" style={{ animationDelay: '0s' }}>🚀</span>
        <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>🤖</span>
        <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>✨</span>
      </div>

      {/* Reset Button */}
      <Button
        onClick={onReset}
        variant="outline"
        size="lg"
        className="mt-8 gap-2 border-primary/50 text-primary hover:bg-primary/10 hover:border-primary transition-all duration-300"
      >
        <RotateCcw className="w-4 h-4" />
        ทำแบบประเมินอีกครั้ง
      </Button>
    </div>
  );
};

export default ThankYouPage;
