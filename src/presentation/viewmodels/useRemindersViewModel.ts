// Recordatorios de citas: sincroniza las notificaciones locales con las citas y con la preferencia
// de oposicion "Recordatorios" de Privacidad. El permiso se pide a demanda, no al abrir la app.
import { useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { notificationReminders, PermissionState, ReminderScheduler } from '../../data/notifications/reminderScheduler';
import { Appointment } from '../../domain/models';
import { planReminders } from '../../domain/reminders';

export function useRemindersViewModel(
  appointments: Appointment[],
  remindersAllowed: boolean,
  scheduler: ReminderScheduler = notificationReminders,
) {
  const [permission, setPermission] = useState<PermissionState>('undetermined');
  // "Ahora no" en el dialogo: no se vuelve a ofrecer en esta sesion.
  const [declined, setDeclined] = useState(false);

  useEffect(() => {
    scheduler.permission().then(setPermission).catch(() => setPermission('denied'));
  }, [scheduler]);

  useEffect(() => {
    if (permission !== 'granted') return;
    // Con la oposicion activa se cancelan todos los recordatorios programados.
    void scheduler.sync(remindersAllowed ? planReminders(appointments) : []).catch(() => undefined);
  }, [permission, remindersAllowed, appointments, scheduler]);

  const request = useCallback(async () => {
    const granted = await scheduler.requestPermission().catch(() => false);
    setPermission(granted ? 'granted' : await scheduler.permission().catch(() => 'denied' as const));
    return granted;
  }, [scheduler]);

  return {
    permission,
    // Se ofrece tras reservar si hay recordatorios permitidos y aun no se pidio el permiso.
    shouldOffer: remindersAllowed && permission === 'undetermined' && !declined,
    decline: () => setDeclined(true),
    request,
    canAskAgain: () => scheduler.canAskAgain().catch(() => false),
    openSettings: () => Linking.openSettings(),
  };
}

export type RemindersViewModel = ReturnType<typeof useRemindersViewModel>;
