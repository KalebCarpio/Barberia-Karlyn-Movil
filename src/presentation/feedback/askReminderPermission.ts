// Dialogo explicativo antes del permiso del sistema: dice para que se usa y como desactivarlo.
// Si el permiso ya fue negado de forma permanente, ofrece abrir los Ajustes del telefono.
import { RemindersViewModel } from '../viewmodels/useRemindersViewModel';
import { useDialog } from './DialogProvider';

type Dialog = ReturnType<typeof useDialog>;

export async function askReminderPermission(reminders: RemindersViewModel, dialog: Dialog) {
  if (reminders.permission === 'granted') return true;

  if (reminders.permission === 'denied' && !(await reminders.canAskAgain())) {
    const openSettings = await dialog.confirm({
      title: 'Notificaciones desactivadas',
      message: 'Para recibir recordatorios activa las notificaciones de Carlyn en los Ajustes de tu telefono.',
      confirmLabel: 'Abrir Ajustes',
      cancelLabel: 'Ahora no',
    });
    if (openSettings) await reminders.openSettings();
    return false;
  }

  const accepted = await dialog.confirm({
    title: '¿Te recordamos tu cita?',
    message: 'Te enviaremos una notificacion 1 hora antes de cada cita. Para eso necesitamos permiso para mostrar notificaciones; no usamos tu ubicacion, camara ni contactos. Puedes desactivarlo cuando quieras en Perfil > Privacidad y datos.',
    confirmLabel: 'Si, recordarme',
    cancelLabel: 'Ahora no',
  });
  if (!accepted) {
    reminders.decline();
    return false;
  }
  return reminders.request();
}
