export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface QuizQuestion {
  id: string;
  difficulty: DifficultyLevel;
  topic: string;
  question: string;
  scheduleText?: string;
  options: [string, string, string, string];
  correctIndex: number; // 0, 1, 2, or 3
  explanation: string;
  optionExplanations?: [string, string, string, string];
}

export interface QuizConfig {
  difficulty: DifficultyLevel;
  questionCount: number; // 5, 10, 15, or 20
  topic: string;
}

export interface UserAnswer {
  questionId: string;
  selectedIndex: number; // 0, 1, 2, or 3
  isCorrect: boolean;
  submitted: boolean;
}

export interface QuizAttempt {
  id: string;
  timestamp: string;
  difficulty: DifficultyLevel;
  topic: string;
  totalQuestions: number;
  score: number;
  percentage: number;
  timeTakenSeconds: number;
  userAnswers: Record<string, number>; // questionId -> selectedIndex
}
