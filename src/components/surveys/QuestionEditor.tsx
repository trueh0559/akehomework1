import { useState } from 'react';
import { GripVertical, Trash2, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { SurveyQuestion, QuestionType, QuestionConfig } from '@/types/survey';
import { QUESTION_TYPE_INFO, DEFAULT_QUESTION_CONFIGS } from '@/types/survey';

interface QuestionEditorProps {
  question: Partial<SurveyQuestion>;
  index: number;
  onChange: (updates: Partial<SurveyQuestion>) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const QuestionEditor = ({
  question,
  index,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: QuestionEditorProps) => {
  const [showConfig, setShowConfig] = useState(false);
  const config = question.config || {};

  const updateConfig = (updates: Partial<QuestionConfig>) => {
    onChange({ config: { ...config, ...updates } });
  };

  // When type changes, apply default config and set default is_required
  const handleTypeChange = (type: QuestionType) => {
    const defaultConfig = DEFAULT_QUESTION_CONFIGS[type] || {};
    // Text questions default to not required
    const defaultRequired = type !== 'short_text' && type !== 'long_text';
    onChange({ question_type: type, config: { ...defaultConfig }, is_required: defaultRequired });
  };

  const renderConfigFields = () => {
    const type = question.question_type as QuestionType;

    if (type === 'slider_continuous') {
      return (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">ค่าต่ำสุด</Label>
            <Input
              type="number"
              value={config.min ?? 1}
              onChange={(e) => updateConfig({ min: Number(e.target.value) })}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">ค่าสูงสุด</Label>
            <Input
              type="number"
              value={config.max ?? 5}
              onChange={(e) => updateConfig({ max: Number(e.target.value) })}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Label ต่ำสุด</Label>
            <Input
              value={config.minLabel ?? ''}
              onChange={(e) => updateConfig({ minLabel: e.target.value })}
              placeholder="น้อยที่สุด"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Label สูงสุด</Label>
            <Input
              value={config.maxLabel ?? ''}
              onChange={(e) => updateConfig({ maxLabel: e.target.value })}
              placeholder="มากที่สุด"
              className="mt-1"
            />
          </div>
        </div>
      );
    }

    if (type === 'face_slider_continuous') {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">ค่าต่ำสุด</Label>
              <Input
                type="number"
                value={config.min ?? 1}
                onChange={(e) => updateConfig({ min: Number(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">ค่าสูงสุด</Label>
              <Input
                type="number"
                value={config.max ?? 5}
                onChange={(e) => updateConfig({ max: Number(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Step</Label>
              <Input
                type="number"
                step="0.1"
                value={config.step ?? 0.1}
                onChange={(e) => updateConfig({ step: Number(e.target.value) })}
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Label ด้านซ้าย</Label>
              <Input
                value={config.leftLabel ?? ''}
                onChange={(e) => updateConfig({ leftLabel: e.target.value })}
                placeholder="ไม่เลย"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Label ด้านขวา</Label>
              <Input
                value={config.rightLabel ?? ''}
                onChange={(e) => updateConfig({ rightLabel: e.target.value })}
                placeholder="มากที่สุด"
                className="mt-1"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            หน้าตาอิโมจิจะเปลี่ยนตามค่าที่เลือกอัตโนมัติ (ใช้ค่า default 5 ระดับ)
          </p>
        </div>
      );
    }

    if (type === 'icon_size_scale') {
      const sizeOptions = config.sizeOptions || DEFAULT_QUESTION_CONFIGS.icon_size_scale?.sizeOptions;
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">ตัวเลือกขนาด (value,label,icon คั่นด้วย | แต่ละบรรทัด)</Label>
            <Textarea
              value={sizeOptions?.map((o) => `${o.value},${o.label},${o.icon}`).join('\n') || ''}
              onChange={(e) => {
                const lines = e.target.value.split('\n').filter((l) => l.trim());
                const newOptions = lines.map((line, i) => {
                  const [value, label, icon] = line.split(',');
                  return {
                    value: value?.trim() || `opt${i}`,
                    label: label?.trim() || value?.trim() || `${i}`,
                    icon: icon?.trim() || '👕',
                    scale: 0.7 + i * 0.15,
                  };
                });
                updateConfig({ sizeOptions: newOptions });
              }}
              placeholder="XS,XS,👕&#10;S,S,👕&#10;M,M,👕&#10;L,L,👕&#10;XL,XL,👕"
              rows={5}
              className="mt-1 font-mono text-xs"
            />
          </div>
        </div>
      );
    }

    if (type === 'linear_1_5') {
      return (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Label ต่ำสุด (1)</Label>
            <Input
              value={config.minLabel ?? ''}
              onChange={(e) => updateConfig({ minLabel: e.target.value })}
              placeholder="น้อยที่สุด"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Label สูงสุด (5)</Label>
            <Input
              value={config.maxLabel ?? ''}
              onChange={(e) => updateConfig({ maxLabel: e.target.value })}
              placeholder="มากที่สุด"
              className="mt-1"
            />
          </div>
        </div>
      );
    }

    if (type === 'emoji_visual') {
      return (
        <div>
          <Label className="text-xs">Emojis (5 ตัว คั่นด้วย ,)</Label>
          <Input
            value={(config.emojis || ['😡', '😟', '😐', '🙂', '😍']).join(',')}
            onChange={(e) => updateConfig({ emojis: e.target.value.split(',') })}
            placeholder="😡,😟,😐,🙂,😍"
            className="mt-1"
          />
        </div>
      );
    }

    if (type === 'icon_rating') {
      return (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Icon</Label>
            <Input
              value={config.icons?.[0] ?? '⭐'}
              onChange={(e) => updateConfig({ icons: [e.target.value] })}
              placeholder="⭐"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">จำนวน (max)</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={config.max ?? 5}
              onChange={(e) => updateConfig({ max: Number(e.target.value) })}
              className="mt-1"
            />
          </div>
        </div>
      );
    }

    if (type === 'single_choice' || type === 'multi_choice') {
      const options = config.options || [''];
      return (
        <div>
          <Label className="text-xs">ตัวเลือก (หนึ่งตัวเลือกต่อบรรทัด)</Label>
          <Textarea
            value={options.join('\n')}
            onChange={(e) =>
              updateConfig({ options: e.target.value.split('\n').filter((o) => o.trim()) })
            }
            placeholder="ตัวเลือก 1&#10;ตัวเลือก 2&#10;ตัวเลือก 3"
            rows={4}
            className="mt-1"
          />
        </div>
      );
    }

    if (type === 'short_text' || type === 'long_text') {
      return (
        <div>
          <Label className="text-xs">Placeholder</Label>
          <Input
            value={config.placeholder ?? ''}
            onChange={(e) => updateConfig({ placeholder: e.target.value })}
            placeholder="พิมพ์คำตอบของคุณ..."
            className="mt-1"
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="border rounded-lg bg-card">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-1 pt-2">
            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
            <span className="text-xs font-medium text-muted-foreground">
              {index + 1}
            </span>
          </div>

          <div className="flex-1 space-y-3">
            <Input
              value={question.question_text || ''}
              onChange={(e) => onChange({ question_text: e.target.value })}
              placeholder="พิมพ์คำถาม..."
              className="text-base font-medium"
            />

            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={question.question_type || 'linear_1_5'}
                onValueChange={(value) => handleTypeChange(value as QuestionType)}
              >
                <SelectTrigger className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(QUESTION_TYPE_INFO).map(([type, info]) => (
                    <SelectItem key={type} value={type}>
                      {info.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Switch
                  checked={question.is_required ?? true}
                  onCheckedChange={(checked) => onChange({ is_required: checked })}
                />
                <Label className="text-sm text-muted-foreground">จำเป็น</Label>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMoveUp}
              disabled={isFirst}
              className="h-7 w-7"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onMoveDown}
              disabled={isLast}
              className="h-7 w-7"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-7 w-7 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Collapsible open={showConfig} onOpenChange={setShowConfig}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="mt-2 gap-1">
              <Settings className="w-3 h-3" />
              ตั้งค่าเพิ่มเติม
              <ChevronDown
                className={cn('w-3 h-3 transition-transform', showConfig && 'rotate-180')}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            {renderConfigFields()}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export default QuestionEditor;
