import { QuizQuestion, DifficultyLevel, QuizConfig } from '../types/quiz';
import { VERIFIED_QUIZ_QUESTIONS } from '../data/quizQuestions';

// Fisher-Yates shuffle helper
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Shuffles option choices for a question while maintaining correctIndex & optionExplanations alignment.
 */
function randomizeQuestionOptions(q: QuizQuestion): QuizQuestion {
  const originalOptions = [...q.options];
  const originalCorrectIndex = q.correctIndex;
  const originalExplanations = q.optionExplanations ? [...q.optionExplanations] : null;

  // Create indexed tuples
  const tuples = originalOptions.map((opt, idx) => ({
    text: opt,
    isCorrect: idx === originalCorrectIndex,
    exp: originalExplanations ? originalExplanations[idx] : null
  }));

  const shuffledTuples = shuffleArray(tuples);
  const newOptions = shuffledTuples.map(t => t.text) as [string, string, string, string];
  const newCorrectIndex = shuffledTuples.findIndex(t => t.isCorrect);
  const newOptionExplanations = originalExplanations
    ? (shuffledTuples.map(t => t.exp || '') as [string, string, string, string])
    : undefined;

  return {
    ...q,
    options: newOptions,
    correctIndex: newCorrectIndex,
    optionExplanations: newOptionExplanations
  };
}

export const fetchQuizQuestions = async (config: QuizConfig): Promise<QuizQuestion[]> => {
  const { difficulty, questionCount } = config;

  // Filter verified pool by difficulty
  let pool = VERIFIED_QUIZ_QUESTIONS.filter(q => q.difficulty === difficulty);

  // If pool is smaller than questionCount, pad with other questions
  if (pool.length < questionCount) {
    const remaining = VERIFIED_QUIZ_QUESTIONS.filter(q => q.difficulty !== difficulty);
    pool = [...pool, ...shuffleArray(remaining)];
  }

  // Shuffle question selection
  const selected = shuffleArray(pool).slice(0, questionCount);

  // Randomize option order for each selected question
  return selected.map(q => randomizeQuestionOptions(q));
};
