import { QuizAttempt } from '../types/quiz';

const QUIZ_HISTORY_KEY = 'byok_quiz_history';

export const getStoredQuizHistory = (): QuizAttempt[] => {
  try {
    const raw = localStorage.getItem(QUIZ_HISTORY_KEY) || sessionStorage.getItem(QUIZ_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Silent catch
  }
  return [];
};

export const saveQuizAttempt = (attempt: QuizAttempt): void => {
  try {
    const current = getStoredQuizHistory();
    const updated = [attempt, ...current].slice(0, 50); // Store up to 50 past attempts
    localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(updated));
    sessionStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // Silent catch
  }
};

export const clearQuizHistory = (): void => {
  try {
    localStorage.removeItem(QUIZ_HISTORY_KEY);
    sessionStorage.removeItem(QUIZ_HISTORY_KEY);
  } catch {
    // Silent catch
  }
};
