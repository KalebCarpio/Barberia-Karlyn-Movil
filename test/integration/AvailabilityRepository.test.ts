// Integracion REST API (fetch simulado). AVAIL-01 (#68):
// distintas fechas y barberos, horarios libres, dia sin horarios, token y error de consulta.
import fechas from '../fixtures/fechas-disponibles.json';
import horarios from '../fixtures/horarios-disponibles.json';
import sinHorarios from '../fixtures/horarios-sin-disponibilidad.json';
import { API_URL } from '../../src/core/config';
import { sessionStore } from '../../src/core/state/sessionStore';
import { createRepositories } from '../../src/data/repositories';
import { mockFetchNetworkError, mockFetchResponse, requestOf } from './mockFetch';

const TOKEN = 'token-de-prueba';
const { availability } = createRepositories();

beforeEach(() => sessionStore.signIn(TOKEN, { name: 'Admin', email: 'admin@carlyn.mx', phone: '' }));

describe('AVAIL-01 GET /citas/fechas-disponibles', () => {
  it('envia barbero y token de la sesion, y devuelve las fechas sin disponibilidad', async () => {
    const fetchMock = mockFetchResponse(fechas);
    const result = await availability.getUnavailableDates(34);
    const request = requestOf(fetchMock);
    expect(request.url).toBe(`${API_URL}/api/citas/fechas-disponibles?barberoId=34`);
    expect(request.headers.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(result).toEqual(['2026-10-26', '2026-11-01']);
  });

  it('devuelve lista vacia si la respuesta no trae fechas bloqueadas', async () => {
    mockFetchResponse({});
    await expect(availability.getUnavailableDates(34)).resolves.toEqual([]);
  });
});

describe('AVAIL-01 GET /citas/horarios-disponibles', () => {
  it.each([
    [34, '2026-10-27'],
    [35, '2026-10-31'],
  ])('consulta horarios del barbero %i en la fecha %s', async (barberId, date) => {
    const fetchMock = mockFetchResponse(horarios);
    await availability.getSlots(barberId, date);
    expect(requestOf(fetchMock).url).toBe(`${API_URL}/api/citas/horarios-disponibles?barberoId=${barberId}&fecha=${date}`);
  });

  it('devuelve horarios libres y ocupados', async () => {
    mockFetchResponse(horarios);
    const slots = await availability.getSlots(34, '2026-10-27');
    expect(slots.filter((slot) => slot.available).map((slot) => slot.time)).toEqual(['09:40', '11:00']);
    expect(slots.filter((slot) => !slot.available).map((slot) => slot.reason)).toEqual(['Horario pasado', 'Horario reservado']);
  });

  it('devuelve lista vacia cuando el barbero no trabaja ese dia', async () => {
    mockFetchResponse(sinHorarios);
    await expect(availability.getSlots(34, '2026-11-01')).resolves.toEqual([]);
  });

  it('propaga el rechazo de la API cuando no hay sesion', async () => {
    sessionStore.signOut();
    const fetchMock = mockFetchResponse({ error: 'Token no proporcionado' }, 401);
    await expect(availability.getSlots(34, '2026-10-27')).rejects.toThrow('Token no proporcionado');
    expect(requestOf(fetchMock).headers.Authorization).toBeUndefined();
  });

  it('propaga la validacion de la API con fecha invalida', async () => {
    mockFetchResponse({ message: 'fecha inválida' }, 400);
    await expect(availability.getSlots(34, '2026-13-45')).rejects.toThrow('fecha inválida');
  });

  it('propaga la falla de red sin conexion', async () => {
    mockFetchNetworkError();
    await expect(availability.getSlots(34, '2026-10-27')).rejects.toThrow('Network request failed');
  });
});
