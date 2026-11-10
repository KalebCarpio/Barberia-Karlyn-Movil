// Recordatorios locales de citas: reglas puras, sin depender de las notificaciones del sistema.
import { Appointment } from './models';

export const REMINDER_MINUTES_BEFORE = 60;
const REMINDER_PREFIX = 'cita-';

export type PlannedReminder = { id: string; date: Date; title: string; body: string };

// El identificador incluye fecha y hora: si la cita se reprograma cambia y se vuelve a programar.
export function reminderId(appointment: Appointment) {
  return `${REMINDER_PREFIX}${appointment.id}-${appointment.date}-${appointment.time}`;
}

export function isAppointmentReminder(id: string) {
  return id.startsWith(REMINDER_PREFIX);
}

export function reminderDate(appointment: Appointment, minutesBefore = REMINDER_MINUTES_BEFORE) {
  const [year, month, day] = appointment.date.split('-').map(Number);
  const [hours, minutes] = appointment.time.split(':').map(Number);
  if (!year || !month || !day || Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return new Date(year, month - 1, day, hours, minutes - minutesBefore, 0, 0);
}

// Solo citas activas cuyo recordatorio todavia esta en el futuro.
export function planReminders(appointments: Appointment[], now = new Date()): PlannedReminder[] {
  return appointments.flatMap((appointment) => {
    if (!appointment.canManage) return [];
    const date = reminderDate(appointment);
    if (!date || date <= now) return [];
    return [{
      id: reminderId(appointment),
      date,
      title: 'Tu cita en Carlyn es en 1 hora',
      body: `${appointment.service.name} a las ${appointment.time} con ${appointment.barber}.`,
    }];
  });
}
