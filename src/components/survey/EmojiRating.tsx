import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EmojiRatingProps {
  value: number | null;
  onChange: (value: number) => void;
  question: string;
  questionNumber: number;
}

const emojis = [
  { emoji: '😠', label: 'ไม่พอใจเลย', value: 1, description: 'ต้องปรับปรุงอย่างมาก' },
  { emoji: '😕', label: 'ยังไม่ค่อยเข้าใจ', value: 2, description: 'ยังมีบางส่วนที่ต้องปรับปรุง' },
  { emoji: '😐', label: 'พอใช้ได้', value: 3, description: 'ปานกลาง ไม่ดีไม่แย่' },
  { emoji: '🙂', label: 'ดีมาก', value: 4, description: 'ประทับใจในภาพรวม' },
  { emoji: '😄', label: 'ดีมากและนำไปใช้ได้จริง', value: 5, description: 'ยอดเยี่ยม! พึงพอใจมากที่สุด' },
];

const EmojiRating = ({ value, onChange, question, questionNumber }: EmojiRatingProps) => {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);

  const activeValue = hoveredValue ?? value;

  return (
    <div className="space-y-4 animate-fade-in" style={{ animationDelay: `${questionNumber * 0.1}s` }}>
      <p className="text-foreground font-medium text-base sm:text-lg leading-relaxed">
        <span className="text-accent font-semibold mr-2">{questionNumber}.</span>
        {question}
      </p>
      
      <TooltipProvider delayDuration={300}>
        <div className="flex justify-between items-center gap-2 sm:gap-4 py-2">
          {emojis.map((item) => (
            <Tooltip key={item.value}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onChange(item.value)}
                  onMouseEnter={() => setHoveredValue(item.value)}
                  onMouseLeave={() => setHoveredValue(null)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-2 sm:p-3 rounded-xl transition-all duration-300 ease-out',
                    'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-background',
                    value === item.value
                      ? 'scale-110 bg-accent/10'
                      : 'bg-transparent'
                  )}
                  aria-label={item.label}
                >
                  <span
                    className={cn(
                      'text-3xl sm:text-4xl md:text-5xl transition-all duration-300',
                      value === item.value
                        ? 'drop-shadow-[0_0_15px_hsl(185_100%_50%/0.8)] grayscale-0'
                        : activeValue === item.value
                        ? 'grayscale-0 drop-shadow-[0_0_10px_hsl(185_100%_50%/0.5)]'
                        : 'grayscale opacity-50 hover:grayscale-0 hover:opacity-100'
                    )}
                  >
                    {item.emoji}
                  </span>
                  <span
                    className={cn(
                      'text-xs sm:text-sm font-medium text-center leading-tight max-w-[60px] sm:max-w-[80px] transition-all duration-300',
                      value === item.value
                        ? 'text-accent text-glow-accent'
                        : 'text-muted-foreground'
                    )}
                  >
                    {item.label}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent 
                side="top" 
                className="bg-popover/95 backdrop-blur-sm border-border/50"
              >
                <p className="text-sm font-medium">{item.description}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
};

export default EmojiRating;
