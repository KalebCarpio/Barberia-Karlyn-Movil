// Pruebas unitarias de AVAIL-01 (#68): fechas reservables y normalizacion de horarios sin red.
import horarios from '../fixtures/horarios-disponibles.json';
import sinHorarios from '../fixtures/horarios-sin-disponibilidad.json';
import fechas from '../fixtures/fechas-disponibles.json';
import { bookingDates, dateKey, hasAvailableSlot, normalizeSlots } from '../../src/availability';

describe('AVAIL-01 fechas', () => {
  const today = new Date(2026, 9, 26, 8, 0);

  it('formatea fechas como AAAA-MM-DD con ceros a la izquierda', () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('genera 14 dias consecutivos desde hoy', () => {
    const dates = bookingDates([], today);
    expect(dates).toHaveLength(14);
    expect(dates[0].key).toBe('2026-10-26');
    expect(dates[13].key).toBe('2026-11-08');
  });

  it('bloquea las fechas que la API reporta sin disponibilidad', () => {
    const dates = bookingDates(fechas.fechasNoDisponibles, today);
    const blocked = dates.filter((date) => !date.available).map((date) => date.key);
    expect(blocked).toEqual(['2026-10-26', '2026-11-01']);
  });
});

describe('AVAIL-01 horarios', () => {
  it('usa la lista completa de slots para mostrar libres y ocupados', () => {
    expect(normalizeSlots(horarios)).toEqual([
      { time: '09:00', available: false, reason: 'Horario pasado' },
      { time: '09:40', available: true, reason: undefined },
      { time: '10:20', available: false, reason: 'Horario reservado' },
      { time: '11:00', available: true, reason: undefined },
    ]);
  });

  it('acepta solo la lista de disponibles cuando no viene slots', () => {
    expect(normalizeSlots({ disponibles: horarios.disponibles }).map((slot) => slot.time)).toEqual(['09:40', '11:00']);
  });

  it('recorta horas con segundos a HH:MM y descarta registros sin hora', () => {
    expect(normalizeSlots([{ hora_inicio: '13:20:00' }, { motivo: 'sin hora' }])).toEqual([
      { time: '13:20', available: true, reason: undefined },
    ]);
  });

  it('detecta cuando un dia no tiene horarios libres', () => {
    expect(hasAvailableSlot(normalizeSlots(sinHorarios))).toBe(false);
    expect(hasAvailableSlot(normalizeSlots(horarios))).toBe(true);
  });
});
