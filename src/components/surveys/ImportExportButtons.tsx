import { useRef, useState } from 'react';
import { Download, Upload, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import type { Survey, SurveyQuestion, SurveyExportSchema, QuestionType } from '@/types/survey';

interface ImportExportButtonsProps {
  survey: Survey | null;
  questions: Partial<SurveyQuestion>[];
  onImport: (questions: Partial<SurveyQuestion>[], mode: 'replace' | 'append') => void;
}

const VALID_QUESTION_TYPES: QuestionType[] = [
  'slider_continuous',
  'linear_1_5',
  'emoji_visual',
  'single_choice',
  'multi_choice',
  'icon_rating',
  'short_text',
  'long_text',
  'face_slider_continuous',
  'icon_size_scale',
];

const ImportExportButtons = ({ survey, questions, onImport }: ImportExportButtonsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [pendingImport, setPendingImport] = useState<Partial<SurveyQuestion>[] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const handleExport = () => {
    if (!survey) return;

    const exportData: SurveyExportSchema = {
      survey: {
        title: survey.title,
        description: survey.description,
        start_at: survey.start_at,
        end_at: survey.end_at,
      },
      questions: questions.map((q, index) => ({
        order_index: index,
        question_text: q.question_text || '',
        question_type: q.question_type || 'linear_1_5',
        is_required: q.is_required ?? true,
        config: q.config || {},
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `survey_${survey.id}_questions.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('ส่งออกคำถามสำเร็จ');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setPendingImport(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text) as SurveyExportSchema;

      // Validate structure
      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error('ไฟล์ต้องมี questions array');
      }

      // Validate each question
      const validatedQuestions: Partial<SurveyQuestion>[] = [];
      for (let i = 0; i < data.questions.length; i++) {
        const q = data.questions[i];
        
        if (!q.question_text || typeof q.question_text !== 'string') {
          throw new Error(`คำถามข้อ ${i + 1}: ต้องมี question_text`);
        }
        
        if (!q.question_type || !VALID_QUESTION_TYPES.includes(q.question_type)) {
          throw new Error(`คำถามข้อ ${i + 1}: question_type ไม่ถูกต้อง`);
        }

        validatedQuestions.push({
          question_text: q.question_text,
          question_type: q.question_type,
          is_required: q.is_required ?? true,
          config: q.config || {},
          is_active: true,
        });
      }

      setPendingImport(validatedQuestions);
      setImportDialogOpen(true);
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setImportError('ไฟล์ JSON ไม่ถูกต้อง');
      } else {
        setImportError(err.message || 'เกิดข้อผิดพลาดในการอ่านไฟล์');
      }
      toast.error('นำเข้าไม่สำเร็จ');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const confirmImport = () => {
    if (!pendingImport) return;

    setImporting(true);
    
    try {
      onImport(pendingImport, importMode);
      toast.success(`นำเข้า ${pendingImport.length} คำถามสำเร็จ`);
      setImportDialogOpen(false);
      setPendingImport(null);
    } catch (err) {
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="gap-2"
        >
          <Upload className="w-4 h-4" />
          Import
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {importError && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{importError}</AlertDescription>
        </Alert>
      )}

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>นำเข้าคำถาม</DialogTitle>
            <DialogDescription>
              พบ {pendingImport?.length || 0} คำถามในไฟล์
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label className="mb-3 block">เลือกวิธีการนำเข้า:</Label>
            <RadioGroup
              value={importMode}
              onValueChange={(v) => setImportMode(v as 'replace' | 'append')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="replace" id="replace" />
                <Label htmlFor="replace" className="cursor-pointer">
                  แทนที่ทั้งหมด (ลบคำถามเดิม)
                </Label>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem value="append" id="append" />
                <Label htmlFor="append" className="cursor-pointer">
                  เพิ่มต่อท้าย (คงคำถามเดิมไว้)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={confirmImport} disabled={importing}>
              {importing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              นำเข้า
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImportExportButtons;
