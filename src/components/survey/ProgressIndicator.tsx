import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface ProgressIndicatorProps {
  current: number;
  total: number;
  className?: string;
  isSticky?: boolean;
}

const ProgressIndicator = ({ current, total, className, isSticky = false }: ProgressIndicatorProps) => {
  const percentage = Math.min((current / total) * 100, 100);
  const estimatedMinutes = Math.max(1, Math.ceil((total - current) * 0.3));

  return (
    <div 
      className={cn(
        'space-y-2 py-3 transition-all duration-300',
        isSticky && 'sticky top-0 z-20 bg-background/80 backdrop-blur-md -mx-6 sm:-mx-8 md:-mx-10 px-6 sm:px-8 md:px-10 border-b border-border/30',
        className
      )}
    >
      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">ความคืบหน้า</span>
          {/* Estimated Time Badge - Feature #1 */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
            <Clock className="w-3 h-3" />
            ~{estimatedMinutes} นาที
          </span>
        </div>
        <span className="text-accent font-medium">
          {current} / {total} คำถาม
        </span>
      </div>
      
      <div className="relative h-2 bg-muted/50 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 progress-glow rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
        {/* Shimmer effect */}
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full transition-all duration-500',
            'bg-gradient-to-r from-transparent via-white/20 to-transparent',
            'animate-shimmer bg-[length:200%_100%]'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressIndicator;
