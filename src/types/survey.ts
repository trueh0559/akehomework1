// Question Types
export type QuestionType = 
  | 'slider_continuous'
  | 'linear_1_5'
  | 'emoji_visual'
  | 'single_choice'
  | 'multi_choice'
  | 'icon_rating'
  | 'short_text'
  | 'long_text'
  | 'face_slider_continuous'
  | 'icon_size_scale';

export interface FaceConfig {
  min: number;
  max: number;
  emoji: string;
  text: string;
}

export interface SizeOption {
  value: string;
  label: string;
  icon: string;
  scale: number;
}

export interface QuestionConfig {
  min?: number;
  max?: number;
  step?: number;
  minLabel?: string;
  maxLabel?: string;
  options?: string[];
  placeholder?: string;
  emojis?: string[];
  icons?: string[];
  // Face slider config
  leftLabel?: string;
  rightLabel?: string;
  faces?: FaceConfig[];
  // Icon size scale config
  sizeOptions?: SizeOption[];
  style?: 'slider' | 'buttons';
}

export interface Survey {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  start_at?: string | null;
  end_at?: string | null;
}

export interface SurveyQuestion {
  id: string;
  survey_id: string;
  order_index: number;
  question_text: string;
  question_type: QuestionType;
  is_required: boolean;
  config: QuestionConfig;
  is_active: boolean;
  created_at: string;
}

export interface SurveyResponse {
  id: string;
  survey_id: string;
  submitted_at: string;
  respondent_name: string | null;
  respondent_email: string | null;
  is_anonymous: boolean;
  answers: Record<string, any>;
  meta: Record<string, any> | null;
}

export interface AdminSettings {
  id: string;
  low_score_threshold: number;
  admin_emails: string[];
  created_at: string;
}

export interface AdminNotification {
  id: string;
  type: 'low_score' | 'system_error' | 'new_response';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  is_read: boolean;
  created_at: string;
  payload: Record<string, any>;
}

// Answer payload types
export interface ScoreAnswer {
  score: number;
}

export interface ChoiceAnswer {
  selected: string | string[];
}

export interface TextAnswer {
  text: string;
}

export type AnswerPayload = ScoreAnswer | ChoiceAnswer | TextAnswer;

// Low score item for notifications
export interface LowScoreItem {
  question_id: string;
  question_text: string;
  score: number;
  threshold: number;
}

// Question type metadata
export const QUESTION_TYPE_INFO: Record<QuestionType, { label: string; icon: string; hasScore: boolean }> = {
  slider_continuous: { label: 'Slider (ต่อเนื่อง)', icon: 'Sliders', hasScore: true },
  linear_1_5: { label: 'Linear Scale 1-5', icon: 'List', hasScore: true },
  emoji_visual: { label: 'Emoji Rating', icon: 'Smile', hasScore: true },
  single_choice: { label: 'ตัวเลือกเดียว', icon: 'CircleDot', hasScore: false },
  multi_choice: { label: 'หลายตัวเลือก', icon: 'CheckSquare', hasScore: false },
  icon_rating: { label: 'Icon Rating', icon: 'Star', hasScore: true },
  short_text: { label: 'ข้อความสั้น', icon: 'Type', hasScore: false },
  long_text: { label: 'ข้อความยาว', icon: 'AlignLeft', hasScore: false },
  face_slider_continuous: { label: 'หน้าเปลี่ยนตามคะแนน', icon: 'SmilePlus', hasScore: true },
  icon_size_scale: { label: 'เลือกขนาด', icon: 'Maximize2', hasScore: false },
};

// Score question types
export const SCORE_QUESTION_TYPES: QuestionType[] = [
  'slider_continuous',
  'linear_1_5',
  'emoji_visual',
  'icon_rating',
  'face_slider_continuous',
];

// Default configs for each question type
export const DEFAULT_QUESTION_CONFIGS: Partial<Record<QuestionType, QuestionConfig>> = {
  face_slider_continuous: {
    min: 0,
    max: 10,
    step: 0.1,
    leftLabel: 'ไม่พอใจ',
    rightLabel: 'พอใจมาก',
    faces: [
      { min: 0, max: 2, emoji: '😠', text: 'ไม่พอใจมาก' },
      { min: 2, max: 4, emoji: '😟', text: 'ไม่พอใจ' },
      { min: 4, max: 6, emoji: '😐', text: 'ปานกลาง' },
      { min: 6, max: 8, emoji: '🙂', text: 'พอใจ' },
      { min: 8, max: 10, emoji: '😍', text: 'พอใจมาก' },
    ],
  },
  icon_size_scale: {
    sizeOptions: [
      { value: 'XS', label: 'XS', icon: '👕', scale: 0.7 },
      { value: 'S', label: 'S', icon: '👕', scale: 0.85 },
      { value: 'M', label: 'M', icon: '👕', scale: 1 },
      { value: 'L', label: 'L', icon: '👕', scale: 1.15 },
      { value: 'XL', label: 'XL', icon: '👕', scale: 1.3 },
    ],
    style: 'slider',
  },
  short_text: {
    placeholder: 'พิมพ์คำตอบสั้นๆ...',
  },
  long_text: {
    placeholder: 'พิมพ์คำตอบของคุณ...',
  },
};

// Export schema for import/export
export interface SurveyExportSchema {
  survey: {
    title: string;
    description: string | null;
    start_at?: string | null;
    end_at?: string | null;
  };
  questions: Array<{
    order_index: number;
    question_text: string;
    question_type: QuestionType;
    is_required: boolean;
    config: QuestionConfig;
  }>;
}

// Legacy Response type for old static 5-question system
export interface Response {
  id: string;
  created_at: string;
  name: string;
  email: string;
  q1_score: number;
  q2_score: number;
  q3_score: number;
  q4_score: number;
  q5_score: number;
  comment: string | null;
}
