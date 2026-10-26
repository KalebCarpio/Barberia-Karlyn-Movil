// Pruebas de integracion de AVAIL-01 (#68) contra la REST API simulada:
// distintas fechas y barberos, horarios libres, dia sin horarios, token y error de consulta.
import horarios from '../fixtures/horarios-disponibles.json';
import sinHorarios from '../fixtures/horarios-sin-disponibilidad.json';
import fechas from '../fixtures/fechas-disponibles.json';
import { API_URL } from '../../src/api';
import { fetchSlots, fetchUnavailableDates } from '../../src/availability';
import { mockFetchNetworkError, mockFetchResponse, requestOf } from './mockFetch';

const TOKEN = 'token-de-prueba';

describe('AVAIL-01 GET /citas/fechas-disponibles', () => {
  it('envia barbero y token, y devuelve las fechas sin disponibilidad', async () => {
    const fetchMock = mockFetchResponse(fechas);
    const result = await fetchUnavailableDates(34, TOKEN);
    const request = requestOf(fetchMock);
    expect(request.url).toBe(`${API_URL}/api/citas/fechas-disponibles?barberoId=34`);
    expect(request.headers.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(result).toEqual(['2026-10-26', '2026-11-01']);
  });

  it('devuelve lista vacia si la respuesta no trae fechas bloqueadas', async () => {
    mockFetchResponse({});
    await expect(fetchUnavailableDates(34, TOKEN)).resolves.toEqual([]);
  });
});

describe('AVAIL-01 GET /citas/horarios-disponibles', () => {
  it.each([
    [34, '2026-10-27'],
    [35, '2026-10-31'],
  ])('consulta horarios del barbero %i en la fecha %s', async (barberId, date) => {
    const fetchMock = mockFetchResponse(horarios);
    await fetchSlots(barberId, date, TOKEN);
    expect(requestOf(fetchMock).url).toBe(`${API_URL}/api/citas/horarios-disponibles?barberoId=${barberId}&fecha=${date}`);
  });

  it('devuelve horarios libres y ocupados', async () => {
    mockFetchResponse(horarios);
    const slots = await fetchSlots(34, '2026-10-27', TOKEN);
    expect(slots.filter((slot) => slot.available).map((slot) => slot.time)).toEqual(['09:40', '11:00']);
    expect(slots.filter((slot) => !slot.available).map((slot) => slot.reason)).toEqual(['Horario pasado', 'Horario reservado']);
  });

  it('devuelve lista vacia cuando el barbero no trabaja ese dia', async () => {
    mockFetchResponse(sinHorarios);
    await expect(fetchSlots(34, '2026-11-01', TOKEN)).resolves.toEqual([]);
  });

  it('propaga el rechazo de la API cuando no hay token', async () => {
    mockFetchResponse({ error: 'Token no proporcionado' }, 401);
    await expect(fetchSlots(34, '2026-10-27', null)).rejects.toThrow('Token no proporcionado');
  });

  it('propaga la validacion de la API con fecha invalida', async () => {
    mockFetchResponse({ message: 'fecha inválida' }, 400);
    await expect(fetchSlots(34, '2026-13-45', TOKEN)).rejects.toThrow('fecha inválida');
  });

  it('propaga la falla de red sin conexion', async () => {
    mockFetchNetworkError();
    await expect(fetchSlots(34, '2026-10-27', TOKEN)).rejects.toThrow('Network request failed');
  });
});
