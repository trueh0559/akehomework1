import { useState } from 'react';
import { Loader2, Sparkles, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { SurveyQuestion, QuestionType } from '@/types/survey';

interface AIQuestionGeneratorProps {
  open: boolean;
  onClose: () => void;
  onInsert: (questions: Partial<SurveyQuestion>[], mode: 'replace' | 'append') => void;
  surveyTitle: string;
}

const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: 'linear_1_5', label: 'คะแนน 1-5' },
  { value: 'emoji_visual', label: 'อิโมจิ' },
  { value: 'face_slider_continuous', label: 'หน้าเปลี่ยนตามคะแนน' },
  { value: 'icon_rating', label: 'ให้ดาว' },
  { value: 'single_choice', label: 'เลือกตอบ (เดียว)' },
  { value: 'multi_choice', label: 'เลือกตอบ (หลายข้อ)' },
  { value: 'short_text', label: 'ข้อความสั้น' },
];

const AIQuestionGenerator = ({
  open,
  onClose,
  onInsert,
  surveyTitle,
}: AIQuestionGeneratorProps) => {
  const [context, setContext] = useState(surveyTitle);
  const [tone, setTone] = useState<'friendly' | 'casual' | 'professional'>('friendly');
  const [count, setCount] = useState(5);
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([
    'linear_1_5',
    'emoji_visual',
    'face_slider_continuous',
    'single_choice',
  ]);
  const [generating, setGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<Partial<SurveyQuestion>[]>([]);
  const [insertMode, setInsertMode] = useState<'replace' | 'append'>('append');

  const toggleType = (type: QuestionType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleGenerate = async () => {
    if (!context.trim()) {
      toast.error('กรุณาระบุหัวข้อ/บริบท');
      return;
    }
    if (selectedTypes.length === 0) {
      toast.error('กรุณาเลือกประเภทคำถามอย่างน้อย 1 แบบ');
      return;
    }

    setGenerating(true);
    setGeneratedQuestions([]);

    try {
      const { data, error } = await supabase.functions.invoke('ai-generate-questions', {
        body: {
          context,
          tone,
          count,
          allowed_types: selectedTypes,
        },
      });

      if (error) throw error;

      if (data?.questions && Array.isArray(data.questions)) {
        setGeneratedQuestions(data.questions);
        toast.success(`สร้าง ${data.questions.length} คำถามสำเร็จ`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('AI generation error:', err);
      toast.error('เกิดข้อผิดพลาด: ' + (err.message || 'ไม่สามารถสร้างคำถามได้'));
    } finally {
      setGenerating(false);
    }
  };

  const handleInsert = () => {
    if (generatedQuestions.length === 0) return;
    onInsert(generatedQuestions, insertMode);
    setGeneratedQuestions([]);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI ช่วยคิดคำถาม
          </DialogTitle>
          <DialogDescription>
            ใส่บริบทและเลือกประเภทคำถาม ให้ AI สร้างคำถามที่เน้นความรู้สึกจริง
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Input section */}
          <div className="space-y-4">
            <div>
              <Label>หัวข้อ/บริบท</Label>
              <Textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="เช่น คอร์ส AI รุ่น 3, ความพึงพอใจ, เน้นความรู้สึกจริง..."
                className="mt-1"
                rows={2}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>โทน</Label>
                <Select value={tone} onValueChange={(v: any) => setTone(v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">เป็นมิตร</SelectItem>
                    <SelectItem value="casual">สบายๆ</SelectItem>
                    <SelectItem value="professional">เป็นทางการ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>จำนวนคำถาม</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">ประเภทคำถามที่ต้องการ</Label>
              <div className="flex flex-wrap gap-2">
                {QUESTION_TYPE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                      selectedTypes.includes(opt.value)
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Checkbox
                      checked={selectedTypes.includes(opt.value)}
                      onCheckedChange={() => toggleType(opt.value)}
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังสร้าง...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate
                </>
              )}
            </Button>
          </div>

          {/* Preview section */}
          {generatedQuestions.length > 0 && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <Label>คำถามที่สร้าง ({generatedQuestions.length})</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="gap-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  สร้างใหม่
                </Button>
              </div>
              <ScrollArea className="flex-1 border rounded-lg p-2">
                <div className="space-y-2">
                  {generatedQuestions.map((q, i) => (
                    <Card key={i} className="bg-muted/30">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            {i + 1}.
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{q.question_text}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              ประเภท: {q.question_type}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {generatedQuestions.length > 0 && (
          <DialogFooter className="flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-4">
              <Label>วิธีเพิ่ม:</Label>
              <RadioGroup
                value={insertMode}
                onValueChange={(v) => setInsertMode(v as 'replace' | 'append')}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="append" id="ai-append" />
                  <Label htmlFor="ai-append" className="cursor-pointer">
                    เพิ่มต่อท้าย
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="replace" id="ai-replace" />
                  <Label htmlFor="ai-replace" className="cursor-pointer">
                    แทนที่ทั้งหมด
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <Button onClick={handleInsert}>
              เพิ่มคำถาม
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AIQuestionGenerator;
