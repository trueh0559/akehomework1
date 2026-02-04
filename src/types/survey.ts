// Question Types
export type QuestionType = 
  | 'slider_continuous'
  | 'linear_1_5'
  | 'emoji_visual'
  | 'single_choice'
  | 'multi_choice'
  | 'icon_rating'
  | 'short_text'
  | 'long_text';

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
}

export interface Survey {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
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
};

// Score question types
export const SCORE_QUESTION_TYPES: QuestionType[] = [
  'slider_continuous',
  'linear_1_5',
  'emoji_visual',
  'icon_rating',
];
