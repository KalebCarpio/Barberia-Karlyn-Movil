// Caja blanca, dominio: que recordatorios se programan y cuando.
import { Appointment } from '../../../src/domain/models';
import { isAppointmentReminder, planReminders, reminderDate, reminderId } from '../../../src/domain/reminders';

const service = { id: 11, name: 'Corte First Class', category: 'Paquetes', description: '', price: 250, duration: 60 };
const base: Appointment = { id: 7, service, date: '2026-11-20', time: '10:20', barber: 'Carlos', status: 'Pendiente', canManage: true };
const now = new Date(2026, 10, 20, 8, 0);

describe('Recordatorios', () => {
  it('programa el recordatorio 1 hora antes de la cita', () => {
    expect(reminderDate(base)).toEqual(new Date(2026, 10, 20, 9, 20));
  });

  it('el identificador cambia si la cita se reprograma', () => {
    expect(reminderId(base)).toBe('cita-7-2026-11-20-10:20');
    expect(reminderId({ ...base, time: '11:00' })).not.toBe(reminderId(base));
    expect(isAppointmentReminder(reminderId(base))).toBe(true);
    expect(isAppointmentReminder('otra-notificacion')).toBe(false);
  });

  it('solo incluye citas activas cuyo recordatorio esta en el futuro', () => {
    const planned = planReminders([
      base,
      { ...base, id: 8, time: '08:30' },
      { ...base, id: 9, status: 'Cancelada', canManage: false },
      { ...base, id: 10, date: 'sin-fecha' },
    ], now);
    expect(planned.map((reminder) => reminder.id)).toEqual(['cita-7-2026-11-20-10:20']);
    expect(planned[0]).toMatchObject({ title: 'Tu cita en Carlyn es en 1 hora', body: 'Corte First Class a las 10:20 con Carlos.' });
  });
});
