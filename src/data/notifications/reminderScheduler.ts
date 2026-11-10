// Programa recordatorios locales con expo-notifications. Es el unico permiso sensible de la app
// (POST_NOTIFICATIONS en Android 13+) y se pide solo cuando el usuario quiere recordatorios.
import { Platform } from 'react-native';
import { isAppointmentReminder, PlannedReminder } from '../../domain/reminders';

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export interface ReminderScheduler {
  permission(): Promise<PermissionState>;
  // canAskAgain=false: el usuario lo nego "para siempre" y solo puede activarlo en Ajustes.
  canAskAgain(): Promise<boolean>;
  requestPermission(): Promise<boolean>;
  // Deja programados exactamente estos recordatorios: agrega los nuevos y cancela los que sobran.
  sync(reminders: PlannedReminder[]): Promise<void>;
}

type NotificationsModule = typeof import('expo-notifications');
const CHANNEL_ID = 'recordatorios-citas';
let prepared: NotificationsModule | null = null;

async function load(): Promise<NotificationsModule | null> {
  if (Platform.OS === 'web') return null;
  if (prepared) return prepared;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module: NotificationsModule = require('expo-notifications');
    module.setNotificationHandler({
      handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
    });
    if (Platform.OS === 'android') {
      await module.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Recordatorios de citas',
        description: 'Avisos 1 hora antes de tus citas en Carlyn',
        importance: module.AndroidImportance.HIGH,
      });
    }
    prepared = module;
    return module;
  } catch {
    return null;
  }
}

export const notificationReminders: ReminderScheduler = {
  async permission() {
    const module = await load();
    if (!module) return 'denied';
    const { status } = await module.getPermissionsAsync();
    return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
  },

  async canAskAgain() {
    const module = await load();
    if (!module) return false;
    return (await module.getPermissionsAsync()).canAskAgain;
  },

  async requestPermission() {
    const module = await load();
    if (!module) return false;
    const { status } = await module.requestPermissionsAsync();
    return status === 'granted';
  },

  async sync(reminders) {
    const module = await load();
    if (!module) return;
    const wanted = new Map(reminders.map((reminder) => [reminder.id, reminder]));
    const scheduled = (await module.getAllScheduledNotificationsAsync())
      .map((notification) => notification.identifier)
      .filter(isAppointmentReminder);

    await Promise.all(scheduled.filter((id) => !wanted.has(id)).map((id) => module.cancelScheduledNotificationAsync(id)));
    const existing = new Set(scheduled);
    await Promise.all(reminders.filter((reminder) => !existing.has(reminder.id)).map((reminder) => module.scheduleNotificationAsync({
      identifier: reminder.id,
      content: { title: reminder.title, body: reminder.body },
      trigger: { type: module.SchedulableTriggerInputTypes.DATE, date: reminder.date, channelId: CHANNEL_ID },
    })));
  },
};
