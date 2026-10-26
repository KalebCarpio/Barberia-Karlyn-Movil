// Caja blanca, dominio. AVAIL-01 (#68): fechas reservables y horarios sin red.
import fechas from '../../fixtures/fechas-disponibles.json';
import horarios from '../../fixtures/horarios-disponibles.json';
import sinHorarios from '../../fixtures/horarios-sin-disponibilidad.json';
import { ModelFactory } from '../../../src/data/factories/ModelFactory';
import { bookingDates, dateKey, displayDate, hasAvailableSlot } from '../../../src/domain/availability';

const SLOT_KEYS = ['slots', 'disponibles'];

describe('AVAIL-01 fechas', () => {
  const today = new Date(2026, 9, 26, 8, 0);

  it('formatea fechas como AAAA-MM-DD con ceros a la izquierda', () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('muestra Sin seleccionar cuando no hay fecha', () => {
    expect(displayDate('')).toBe('Sin seleccionar');
  });

  it('genera 14 dias consecutivos desde hoy', () => {
    const dates = bookingDates([], today);
    expect(dates).toHaveLength(14);
    expect(dates[0].key).toBe('2026-10-26');
    expect(dates[13].key).toBe('2026-11-08');
  });

  it('bloquea las fechas que la API reporta sin disponibilidad', () => {
    const blocked = bookingDates(fechas.fechasNoDisponibles, today).filter((date) => !date.available).map((date) => date.key);
    expect(blocked).toEqual(['2026-10-26', '2026-11-01']);
  });
});

describe('AVAIL-01 horarios', () => {
  it('detecta si un dia tiene al menos un horario libre', () => {
    expect(hasAvailableSlot(ModelFactory.createList('slot', horarios, SLOT_KEYS))).toBe(true);
    expect(hasAvailableSlot(ModelFactory.createList('slot', sinHorarios, SLOT_KEYS))).toBe(false);
  });
});
