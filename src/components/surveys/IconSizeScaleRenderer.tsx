import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { SizeOption } from '@/types/survey';

interface IconSizeScaleRendererProps {
  config: {
    sizeOptions?: SizeOption[];
    style?: 'slider' | 'buttons';
  };
  value: { selected?: string } | undefined;
  onChange: (value: { selected: string }) => void;
  disabled?: boolean;
}

const DEFAULT_OPTIONS: SizeOption[] = [
  { value: 'XS', label: 'XS', icon: '👕', scale: 0.7 },
  { value: 'S', label: 'S', icon: '👕', scale: 0.85 },
  { value: 'M', label: 'M', icon: '👕', scale: 1 },
  { value: 'L', label: 'L', icon: '👕', scale: 1.15 },
  { value: 'XL', label: 'XL', icon: '👕', scale: 1.3 },
];

const IconSizeScaleRenderer = ({
  config,
  value,
  onChange,
  disabled,
}: IconSizeScaleRendererProps) => {
  const options = config.sizeOptions || DEFAULT_OPTIONS;
  const selectedValue = value?.selected;
  const selectedOption = options.find((o) => o.value === selectedValue);

  return (
    <div className="space-y-6 py-4">
      {/* Large preview icon */}
      <div className="flex justify-center">
        <motion.div
          className="relative"
          animate={{
            scale: selectedOption?.scale || 1,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <span className="text-7xl">
            {selectedOption?.icon || options[Math.floor(options.length / 2)].icon}
          </span>
        </motion.div>
      </div>

      {/* Selection indicator */}
      {selectedValue && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-lg font-medium text-primary"
        >
          คุณเลือก: {selectedOption?.label}
        </motion.p>
      )}

      {/* Size buttons */}
      <div className="flex justify-center gap-2">
        {options.map((option, index) => (
          <motion.button
            key={option.value}
            type="button"
            onClick={() => !disabled && onChange({ selected: option.value })}
            disabled={disabled}
            className={cn(
              'flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all min-w-[60px]',
              selectedValue === option.value
                ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <span
              className="text-2xl transition-transform"
              style={{ transform: `scale(${option.scale})` }}
            >
              {option.icon}
            </span>
            <span
              className={cn(
                'text-sm font-medium',
                selectedValue === option.value ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {option.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default IconSizeScaleRenderer;
