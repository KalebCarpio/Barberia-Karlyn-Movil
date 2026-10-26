// AVAIL-01 (#68): reglas de fechas y horarios, sin dependencias de red ni de interfaz.
import { BookingDate, Slot } from './models';

export function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function displayDate(value: string) {
  if (!value) return 'Sin seleccionar';
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1, 12);
  return new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
    .format(date)
    .replace('.', '');
}

// Proximos dias reservables; los que la API reporta sin disponibilidad quedan bloqueados.
export function bookingDates(unavailable: string[] = [], today = new Date(), days = 14): BookingDate[] {
  const blocked = new Set(unavailable);
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + index);
    const key = dateKey(date);
    return { key, label: displayDate(key), available: !blocked.has(key) };
  });
}

export function hasAvailableSlot(slots: Slot[]) {
  return slots.some((slot) => slot.available);
}
