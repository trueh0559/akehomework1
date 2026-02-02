import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  current: number;
  total: number;
  className?: string;
}

const ProgressIndicator = ({ current, total, className }: ProgressIndicatorProps) => {
  const percentage = Math.min((current / total) * 100, 100);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">ความคืบหน้า</span>
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
