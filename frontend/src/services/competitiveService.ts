import { CompetitiveQuestion, CompetitiveExamsProgress, UserAttemptRecord } from '../types/competitive';
import questionsData from '../data/competitiveQuestions.json';

const STORAGE_KEY = 'competitive_exams_progress_v1';

export const competitiveService = {
  getAllQuestions(): CompetitiveQuestion[] {
    return questionsData as CompetitiveQuestion[];
  },

  getTopics(): string[] {
    const questions = this.getAllQuestions();
    const set = new Set<string>();
    questions.forEach(q => set.add(q.topic));
    return Array.from(set);
  },

  getProgress(): CompetitiveExamsProgress {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to load progress', e);
    }
    return { attempts: {}, bookmarks: [] };
  },

  saveAttempt(questionId: string, selectedIndex: number, isCorrect: boolean): CompetitiveExamsProgress {
    const progress = this.getProgress();
    progress.attempts[questionId] = {
      questionId,
      selectedIndex,
      isCorrect,
      timestamp: new Date().toISOString()
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.error('Failed to save progress', e);
    }
    return progress;
  },

  toggleBookmark(questionId: string): CompetitiveExamsProgress {
    const progress = this.getProgress();
    const idx = progress.bookmarks.indexOf(questionId);
    if (idx >= 0) {
      progress.bookmarks.splice(idx, 1);
    } else {
      progress.bookmarks.push(questionId);
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.error('Failed to save bookmark', e);
    }
    return progress;
  },

  resetProgress(): CompetitiveExamsProgress {
    const clean: CompetitiveExamsProgress = { attempts: {}, bookmarks: [] };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    } catch (e) {
      console.error('Failed to reset progress', e);
    }
    return clean;
  }
};
