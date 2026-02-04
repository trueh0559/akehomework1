import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { SurveyQuestion, QuestionType } from '@/types/survey';

interface QuestionRendererProps {
  question: SurveyQuestion;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

const DEFAULT_EMOJIS = ['😡', '😟', '😐', '🙂', '😍'];
const DEFAULT_ICONS = ['⭐'];

const QuestionRenderer = ({ question, value, onChange, disabled }: QuestionRendererProps) => {
  const { question_type, config } = question;

  // Slider Continuous
  if (question_type === 'slider_continuous') {
    const min = config.min ?? 1;
    const max = config.max ?? 5;
    const step = config.step ?? 0.1;
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{config.minLabel || min}</span>
          <span>{config.maxLabel || max}</span>
        </div>
        <Slider
          min={min}
          max={max}
          step={step}
          value={[value?.score ?? (min + max) / 2]}
          onValueChange={([v]) => onChange({ score: v })}
          disabled={disabled}
          className="w-full"
        />
        <div className="text-center">
          <span className="text-2xl font-bold text-primary">
            {(value?.score ?? (min + max) / 2).toFixed(1)}
          </span>
        </div>
      </div>
    );
  }

  // Linear Scale 1-5
  if (question_type === 'linear_1_5') {
    const scores = [1, 2, 3, 4, 5];
    
    return (
      <div className="space-y-3">
        <div className="flex justify-between gap-2">
          {scores.map((score) => (
            <button
              key={score}
              type="button"
              onClick={() => onChange({ score })}
              disabled={disabled}
              className={cn(
                'flex-1 py-3 px-4 rounded-lg border-2 transition-all text-lg font-medium',
                value?.score === score
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:border-primary/50 hover:bg-primary/5'
              )}
            >
              {score}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          <span>{config.minLabel || 'น้อยที่สุด'}</span>
          <span>{config.maxLabel || 'มากที่สุด'}</span>
        </div>
      </div>
    );
  }

  // Emoji Visual
  if (question_type === 'emoji_visual') {
    const emojis = config.emojis || DEFAULT_EMOJIS;
    
    return (
      <div className="flex justify-center gap-2 sm:gap-4">
        {emojis.map((emoji, index) => {
          const score = index + 1;
          return (
            <button
              key={index}
              type="button"
              onClick={() => onChange({ score })}
              disabled={disabled}
              className={cn(
                'text-3xl sm:text-4xl p-2 sm:p-3 rounded-xl transition-all',
                value?.score === score
                  ? 'bg-primary/20 scale-125 ring-2 ring-primary'
                  : 'hover:bg-muted hover:scale-110 opacity-60 hover:opacity-100'
              )}
            >
              {emoji}
            </button>
          );
        })}
      </div>
    );
  }

  // Icon Rating (Stars)
  if (question_type === 'icon_rating') {
    const maxRating = config.max ?? 5;
    const icon = (config.icons?.[0]) || DEFAULT_ICONS[0];
    
    return (
      <div className="flex justify-center gap-1">
        {Array.from({ length: maxRating }, (_, i) => i + 1).map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange({ score: rating })}
            disabled={disabled}
            className={cn(
              'text-3xl sm:text-4xl p-1 transition-all',
              (value?.score ?? 0) >= rating
                ? 'opacity-100 scale-110'
                : 'opacity-30 hover:opacity-60'
            )}
          >
            {icon}
          </button>
        ))}
      </div>
    );
  }

  // Single Choice
  if (question_type === 'single_choice') {
    const options = config.options || [];
    
    return (
      <RadioGroup
        value={value?.selected || ''}
        onValueChange={(selected) => onChange({ selected })}
        disabled={disabled}
        className="space-y-2"
      >
        {options.map((option, index) => (
          <div
            key={index}
            className={cn(
              'flex items-center space-x-3 p-3 rounded-lg border transition-all',
              value?.selected === option
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/30'
            )}
          >
            <RadioGroupItem value={option} id={`option-${index}`} />
            <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
              {option}
            </Label>
          </div>
        ))}
      </RadioGroup>
    );
  }

  // Multiple Choice
  if (question_type === 'multi_choice') {
    const options = config.options || [];
    const selected: string[] = value?.selected || [];
    
    const toggleOption = (option: string) => {
      const newSelected = selected.includes(option)
        ? selected.filter((s) => s !== option)
        : [...selected, option];
      onChange({ selected: newSelected });
    };
    
    return (
      <div className="space-y-2">
        {options.map((option, index) => (
          <div
            key={index}
            className={cn(
              'flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer',
              selected.includes(option)
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/30'
            )}
            onClick={() => !disabled && toggleOption(option)}
          >
            <Checkbox
              checked={selected.includes(option)}
              onCheckedChange={() => toggleOption(option)}
              disabled={disabled}
            />
            <Label className="flex-1 cursor-pointer">{option}</Label>
          </div>
        ))}
      </div>
    );
  }

  // Short Text
  if (question_type === 'short_text') {
    return (
      <Input
        value={value?.text || ''}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder={config.placeholder || 'พิมพ์คำตอบของคุณ...'}
        disabled={disabled}
        className="text-base"
      />
    );
  }

  // Long Text
  if (question_type === 'long_text') {
    return (
      <Textarea
        value={value?.text || ''}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder={config.placeholder || 'พิมพ์คำตอบของคุณ...'}
        disabled={disabled}
        rows={4}
        className="text-base resize-none"
      />
    );
  }

  return (
    <p className="text-muted-foreground">
      ประเภทคำถามไม่รองรับ: {question_type}
    </p>
  );
};

export default QuestionRenderer;
