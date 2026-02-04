import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import type { FaceConfig } from '@/types/survey';

interface FaceSliderRendererProps {
  config: {
    min?: number;
    max?: number;
    step?: number;
    leftLabel?: string;
    rightLabel?: string;
    faces?: FaceConfig[];
  };
  value: { score?: number } | undefined;
  onChange: (value: { score: number }) => void;
  disabled?: boolean;
}

// Faces ordered: unhappy (left/low score) -> happy (right/high score)
// Scale 1-5: each score maps to one face
const DEFAULT_FACES: FaceConfig[] = [
  { min: 1, max: 1, emoji: '😠', text: 'ไม่พอใจมาก' },
  { min: 2, max: 2, emoji: '😟', text: 'ไม่พอใจ' },
  { min: 3, max: 3, emoji: '😐', text: 'ปานกลาง' },
  { min: 4, max: 4, emoji: '🙂', text: 'พอใจ' },
  { min: 5, max: 5, emoji: '😍', text: 'พอใจมาก' },
];

const FaceSliderRenderer = ({
  config,
  value,
  onChange,
  disabled,
}: FaceSliderRendererProps) => {
  const min = config.min ?? 1;
  const max = config.max ?? 5;
  const step = config.step ?? 1;
  const faces = config.faces || DEFAULT_FACES;
  // Default to 3 (middle value for 1-5 scale) if no value selected
  const currentValue = value?.score ?? 3;

  const currentFace = useMemo(() => {
    return faces.find((f) => currentValue >= f.min && currentValue < f.max) || faces[faces.length - 1];
  }, [currentValue, faces]);

  const leftFace = faces[0];
  const rightFace = faces[faces.length - 1];

  return (
    <div className="space-y-6 py-4">
      {/* Faces display */}
      <div className="flex items-center justify-between px-4">
        {/* Left face */}
        <div className="text-center opacity-60">
          <span className="text-3xl">{leftFace.emoji}</span>
          <p className="text-xs text-muted-foreground mt-1">
            {config.leftLabel || leftFace.text}
          </p>
        </div>

        {/* Center face - dynamic */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentFace.emoji}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="text-center"
          >
            <motion.span
              className="text-6xl block"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.3 }}
            >
              {currentFace.emoji}
            </motion.span>
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-medium text-primary mt-2"
            >
              {currentFace.text}
            </motion.p>
          </motion.div>
        </AnimatePresence>

        {/* Right face */}
        <div className="text-center opacity-60">
          <span className="text-3xl">{rightFace.emoji}</span>
          <p className="text-xs text-muted-foreground mt-1">
            {config.rightLabel || rightFace.text}
          </p>
        </div>
      </div>

      {/* Slider */}
      <div className="px-4">
        <Slider
          min={min}
          max={max}
          step={step}
          value={[currentValue]}
          onValueChange={([v]) => onChange({ score: v })}
          disabled={disabled}
          className="w-full"
        />
      </div>

      {/* Value display */}
      <div className="text-center">
        <motion.span
          key={currentValue.toFixed(1)}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="text-2xl font-bold text-primary"
        >
          {currentValue.toFixed(1)}
        </motion.span>
        <span className="text-muted-foreground">/{max}</span>
      </div>
    </div>
  );
};

export default FaceSliderRenderer;
