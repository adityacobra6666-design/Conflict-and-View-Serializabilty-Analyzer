export interface CompetitiveQuestion {
  id: string;
  question: string;
  scheduleText?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  exam?: string;
}

export interface UserAttemptRecord {
  questionId: string;
  selectedIndex: number;
  isCorrect: boolean;
  timestamp: string;
}

export interface CompetitiveExamsProgress {
  attempts: Record<string, UserAttemptRecord>;
  bookmarks: string[];
}
