import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'hebrew-coach/reports/v1';

export type ExerciseReport = {
  at: number;
  lessonKey: string;
  cardId: string;
  exercise: string;
  refId: string;
  answer: string;
};

export async function reportExercise(entry: ExerciseReport): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as ExerciseReport[]) : [];
    list.push(entry);
    await AsyncStorage.setItem(KEY, JSON.stringify(list.slice(-200)));
  } catch {
    // Local-only: a failed write must not break the lesson.
  }
}

export async function loadReports(): Promise<ExerciseReport[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ExerciseReport[]) : [];
  } catch {
    return [];
  }
}
