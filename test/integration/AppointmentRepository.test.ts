// Integracion REST API (fetch simulado). MGMT-01 (#59) y HIST-01 (#60): consultar, crear, reprogramar y cancelar.
import { API_URL } from '../../src/core/config';
import { sessionStore } from '../../src/core/state/sessionStore';
import { createRepositories } from '../../src/data/repositories';
import { mockFetchResponse, requestOf } from './mockFetch';

const TOKEN = 'token-de-prueba';
const { appointments } = createRepositories();

function sentBody(fetchMock: jest.Mock) {
  const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  return { method: init.method, body: JSON.parse(String(init.body)) };
}

beforeEach(() => sessionStore.signIn(TOKEN, { name: 'Admin', email: 'admin@carlyn.mx', phone: '' }));

describe('Citas', () => {
  it('lista las citas con el token de la sesion', async () => {
    const fetchMock = mockFetchResponse({ data: [{ id: 7, servicio_nombre: 'Corte', estado_nombre: 'Pendiente' }] });
    const result = await appointments.list();
    expect(requestOf(fetchMock).url).toBe(`${API_URL}/api/citas`);
    expect(requestOf(fetchMock).headers.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(result).toHaveLength(1);
  });

  it('crea una cita con los nombres de campo del backend', async () => {
    const fetchMock = mockFetchResponse({ ok: true }, 201);
    await appointments.create({ barberId: 34, serviceId: 12, branchId: 1, date: '2026-10-27', time: '09:40' });
    expect(sentBody(fetchMock)).toEqual({
      method: 'POST',
      body: { barberoId: 34, servicioId: 12, localId: 1, fecha: '2026-10-27', horaInicio: '09:40', estadoId: 1, notas: '' },
    });
  });

  it('reprograma con PUT sobre la cita', async () => {
    const fetchMock = mockFetchResponse({ ok: true });
    await appointments.reschedule(7, '2026-10-28', '11:00');
    expect(requestOf(fetchMock).url).toBe(`${API_URL}/api/citas/7`);
    expect(sentBody(fetchMock)).toEqual({ method: 'PUT', body: { fecha: '2026-10-28', horaInicio: '11:00', notas: '' } });
  });

  it('propaga el conflicto de horario que valida el backend', async () => {
    mockFetchResponse({ message: 'El barbero ya tiene una cita en ese horario' }, 409);
    await expect(appointments.reschedule(7, '2026-10-28', '10:20')).rejects.toThrow('El barbero ya tiene una cita en ese horario');
  });

  it('cancela con DELETE sobre la cita', async () => {
    const fetchMock = mockFetchResponse({ ok: true });
    await appointments.cancel(7);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${API_URL}/api/citas/7`);
    expect(init.method).toBe('DELETE');
  });
});
