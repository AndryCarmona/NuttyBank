import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import lessons from './lessons.json';

export type QuizResult = { number: number; answers: number[]; score: number; completedAt: number };
export type Attempt = { version: number; answers: number[]; step: number; completed: boolean; bestCorrect?: number; finishedBefore?: boolean; updatedAt?: number; view?: string; question?: number; page?: number; history?: QuizResult[] };
export const MAX_QUIZZES = 3;
export function isLessonUnlocked(id: string, data: Record<string, Attempt>) {
  const index = lessons.findIndex(l => l.id === id);
  if (index < 0) return false;
  if (index < 4) return true;
  const previous = data[lessons[index - 1].id];
  return !!(previous?.completed || previous?.finishedBefore);
}
export function quizHistory(id: string, attempt?: Attempt): QuizResult[] {
  if (attempt?.history) return attempt.history;
  const lesson = lessons.find(l => l.id === id);
  return attempt?.completed && lesson ? [{ number: 1, answers: [...attempt.answers], score: lesson.questions.filter((q, i) => q.correct === attempt.answers[i]).length, completedAt: attempt.updatedAt ?? 0 }] : [];
}
export function quizOrder(attemptNumber: number) {
  const shift = Math.max(0, Math.min(2, attemptNumber - 1));
  return [0, 1, 2].map(i => (i + shift) % 3);
}
export function answerFeedback(question: { mistakes: string }, selected: number) {
  if (selected < 0 || selected > 2) return '';
  return question.mistakes.match(new RegExp(`(?:^| )${'ABC'[selected]}: (.*?)(?= [ABC]: |$)`))?.[1] ?? question.mistakes;
}
export function beginQuiz(id: string, previous: Attempt): Attempt {
  const history = quizHistory(id, previous);
  if (!previous.completed || history.length >= MAX_QUIZZES) return previous;
  return { ...previous, history, completed: false, answers: [-1, -1, -1], question: 0, view: 'quiz', updatedAt: Date.now() };
}
export function learningStats(data: Record<string, Attempt>) {
  const completed = lessons.filter(l => data[l.id]?.finishedBefore || data[l.id]?.completed).length;
  const correct = lessons.reduce((sum, l) => sum + (data[l.id]?.bestCorrect ?? (data[l.id]?.completed ? l.questions.filter((q, i) => q.correct === data[l.id].answers[i]).length : 0)), 0);
  return { completed, correct, points: completed * 20 + correct * 10, maximum: lessons.length * 50 };
}
export function mergeAttempt(id: string, previous: Attempt | undefined, patch: Partial<Attempt>): Attempt {
  const history = quizHistory(id, previous);
  // Un quiz enviado queda cerrado; solo beginQuiz puede abrir otro intento.
  const safePatch = previous?.completed ? { ...patch, answers: previous.answers, completed: true } : patch;
  const attempt: Attempt = { version: 1, answers: [-1, -1, -1], step: 0, completed: false, ...previous, ...safePatch, history };
  if (attempt.completed && attempt.answers.some(n => n < 0)) attempt.completed = false;
  const lesson = lessons.find(l => l.id === id);
  const previousCorrect = previous?.completed && lesson ? lesson.questions.filter((q, i) => q.correct === previous.answers[i]).length : 0;
  const correct = attempt.completed && lesson ? lesson.questions.filter((q, i) => q.correct === attempt.answers[i]).length : 0;
  if (attempt.completed && !previous?.completed && history.length < MAX_QUIZZES && attempt.answers.every(n => n >= 0)) attempt.history = [...history, { number: history.length + 1, answers: [...attempt.answers], score: correct, completedAt: Date.now() }];
  return { ...attempt, updatedAt: Date.now(), finishedBefore: !!(previous?.finishedBefore || previous?.completed || attempt.completed), bestCorrect: Math.max(previous?.bestCorrect ?? previousCorrect, correct) };
}
export function useLearningProgress(currentLesson?: string) {
  const { session } = useAuth();
  const key = `nutty:learn:v1:${session?.user.id ?? 'guest'}`;
  const [state, setState] = useState<{ key: string; data: Record<string, Attempt> }>();
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(key).then(raw => {
      const parsed = raw ? JSON.parse(raw) : {};
      const data: Record<string, Attempt> = {};
      for (const [id, value] of Object.entries(parsed)) {
        const item = value as Attempt;
        if (item && item.version === 1 && Array.isArray(item.answers) && item.answers.length === 3 && item.answers.every(n => Number.isInteger(n) && n >= -1 && n <= 2) && Number.isInteger(item.step) && item.step >= 0 && typeof item.completed === 'boolean') data[id] = item;
      }
      if (currentLesson && isLessonUnlocked(currentLesson, data)) data[currentLesson] = mergeAttempt(currentLesson, data[currentLesson], {});
      if (active) { setState({ key, data }); setError(''); }
    }).catch(() => { if (active) setError('No pudimos recuperar tu progreso. Inténtalo de nuevo.'); });
    return () => { active = false; };
  }, [key, retry, currentLesson]);
  useEffect(() => {
    if (state?.key !== key) return;
    // AsyncStorage encola las escrituras del mismo proceso en su orden de envío.
    AsyncStorage.setItem(key, JSON.stringify(state.data)).catch(() => setError('No pudimos guardar tu progreso en este dispositivo.'));
  }, [state, key]);
  return { data: state?.key === key ? state.data : {}, ready: state?.key === key,
    error, retry: () => setRetry(n => n + 1),
    startNextQuiz: (id: string) => setState(old => old?.key === key && old.data[id] && isLessonUnlocked(id, old.data) ? { key, data: { ...old.data, [id]: beginQuiz(id, old.data[id]) } } : old),
    save: (id: string, patch: Partial<Attempt>) => setState(old => {
      if (old?.key !== key || !isLessonUnlocked(id, old.data)) return old;
      return { key, data: { ...old.data, [id]: mergeAttempt(id, old.data[id], patch) } };
    }) };
}
