import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

/**
 * Локальное напоминание о тренировке. Текст только на русском, без иврита и
 * без звука произношения: уведомление не учит, а просто напоминает зайти.
 *
 * Само уведомление не влияет на серию дней — серия растёт только когда
 * сессия доведена до конца (см. finishSession в lib/store.tsx).
 */

const CHANNEL_ID = 'daily-practice';
const IDENTIFIER = 'hebrew-trainer-daily';

export type PermissionOutcome = 'granted' | 'denied' | 'unsupported';

function supported(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

export async function requestPermission(): Promise<PermissionOutcome> {
  if (!supported()) return 'unsupported';
  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted) return 'granted';
    if (!existing.canAskAgain) return 'denied';
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted ? 'granted' : 'denied';
  } catch {
    return 'unsupported';
  }
}

export async function hasPermission(): Promise<boolean> {
  if (!supported()) return false;
  try {
    const status = await Notifications.getPermissionsAsync();
    return status.granted;
  } catch {
    return false;
  }
}

function reminderBody(minutesPerDay: number): string {
  if (minutesPerDay <= 5) return 'Пять минут — и серия дней останется цела.';
  if (minutesPerDay <= 10) return 'Десять минут на буквы и слова. Очередь уже собрана.';
  return 'Двадцать минут — и сегодняшние повторения закрыты.';
}

export async function cancelReminder(): Promise<void> {
  if (!supported()) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(IDENTIFIER);
  } catch {
    // Напоминания могло и не быть — это не ошибка.
  }
}

/**
 * Переназначает ежедневное напоминание на выбранный час. Возвращает false,
 * если разрешения нет: отказ не должен мешать пользоваться приложением.
 */
export async function scheduleReminder(hour: number, minutesPerDay: number): Promise<boolean> {
  if (!supported()) return false;
  if (!(await hasPermission())) return false;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Ежедневная тренировка',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    await cancelReminder();
    await Notifications.scheduleNotificationAsync({
      identifier: IDENTIFIER,
      content: {
        title: 'Пора потренироваться',
        body: reminderBody(minutesPerDay),
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: Math.min(23, Math.max(0, Math.round(hour))),
        minute: 0,
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function syncReminder(settings: {
  remindersEnabled: boolean;
  reminderHour: number;
  minutesPerDay: number;
}): Promise<boolean> {
  if (!settings.remindersEnabled) {
    await cancelReminder();
    return false;
  }
  return scheduleReminder(settings.reminderHour, settings.minutesPerDay);
}
