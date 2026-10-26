// AVAIL-01 (#68) fechas y horarios disponibles de un barbero.
import { apiRequest } from './api';
import { pick, records } from './records';

export type Slot = { time: string; available: boolean; reason?: string };
export type BookingDate = { key: string; label: string; available: boolean };

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

// La API devuelve `slots` (todos, con ocupados) y `disponibles` (solo libres); se prefiere la lista completa.
export function normalizeSlots(payload: unknown): Slot[] {
  return records(payload, ['slots', 'disponibles', 'libres', 'data', 'horarios'])
    .map((item) => ({
      time: String(pick(item, 'hora', 'time', 'hora_inicio') || '').slice(0, 5),
      available: pick(item, 'disponible', 'available') !== false && pick(item, 'ocupado', 'busy') !== true,
      reason: pick(item, 'motivo', 'reason') ? String(pick(item, 'motivo', 'reason')) : undefined,
    }))
    .filter((slot) => Boolean(slot.time));
}

export function hasAvailableSlot(slots: Slot[]) {
  return slots.some((slot) => slot.available);
}

export async function fetchUnavailableDates(barberId: number, token?: string | null) {
  const response = await apiRequest<{ fechasNoDisponibles?: unknown }>(`/citas/fechas-disponibles?barberoId=${barberId}`, { token });
  return Array.isArray(response.fechasNoDisponibles) ? response.fechasNoDisponibles.map(String) : [];
}

export async function fetchSlots(barberId: number, date: string, token?: string | null) {
  const response = await apiRequest<unknown>(`/citas/horarios-disponibles?barberoId=${barberId}&fecha=${date}`, { token });
  return normalizeSlots(response);
}
