// Integracion REST API (fetch simulado): derechos ARCO de Oposicion y Cancelacion.
import { API_URL } from '../../src/core/config';
import { sessionStore } from '../../src/core/state/sessionStore';
import { createRepositories } from '../../src/data/repositories';
import { mockFetchResponse, requestOf } from './mockFetch';

const { privacy } = createRepositories();
const API_PRIVACY = { aceptoPrivacidadAt: '2026-11-08T18:00:00.000Z', permitePromociones: false, permiteRecordatorios: true, permiteAnalitica: true };

function sent(fetchMock: jest.Mock) {
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  return { url, method: init.method, body: init.body ? JSON.parse(String(init.body)) : undefined };
}

beforeEach(() => sessionStore.signIn('jwt-carlyn', { name: 'Javier', email: 'javier@correo.com', phone: '' }));

describe('Privacidad', () => {
  it('consulta las preferencias con el token de la sesion', async () => {
    const fetchMock = mockFetchResponse({ privacy: API_PRIVACY });
    expect(await privacy.get()).toEqual({ acceptedAt: '2026-11-08T18:00:00.000Z', promotions: false, reminders: true, analytics: true });
    expect(sent(fetchMock)).toMatchObject({ url: `${API_URL}/api/auth/privacy`, method: 'GET' });
    expect(requestOf(fetchMock).headers.Authorization).toBe('Bearer jwt-carlyn');
  });

  it('reporta como no aceptado un aviso sin fecha', async () => {
    mockFetchResponse({ privacy: { ...API_PRIVACY, aceptoPrivacidadAt: null } });
    expect((await privacy.get()).acceptedAt).toBeNull();
  });

  it('registra la aceptacion del aviso', async () => {
    const fetchMock = mockFetchResponse({ privacy: API_PRIVACY });
    await privacy.acceptNotice();
    expect(sent(fetchMock)).toMatchObject({ url: `${API_URL}/api/auth/privacy/consent`, method: 'POST' });
  });

  it.each([
    ['analytics', 'permiteAnalitica'],
    ['reminders', 'permiteRecordatorios'],
    ['promotions', 'permitePromociones'],
  ] as const)('envia la oposicion de %s con el campo %s', async (preference, field) => {
    const fetchMock = mockFetchResponse({ privacy: API_PRIVACY });
    await privacy.update(preference, false);
    expect(sent(fetchMock)).toEqual({ url: `${API_URL}/api/auth/privacy`, method: 'PUT', body: { [field]: false } });
  });

  it('elimina la cuenta enviando la confirmacion', async () => {
    const fetchMock = mockFetchResponse({ message: 'Tu cuenta y tus datos personales fueron eliminados.', citasCanceladas: 1 });
    await privacy.deleteAccount('ELIMINAR');
    expect(sent(fetchMock)).toEqual({ url: `${API_URL}/api/auth/account`, method: 'DELETE', body: { confirmacion: 'ELIMINAR' } });
  });

  it('propaga el rechazo para cuentas de personal', async () => {
    mockFetchResponse({ message: 'Las cuentas de barberos y administradores se dan de baja con el administrador.' }, 403);
    await expect(privacy.deleteAccount('ELIMINAR')).rejects.toThrow('se dan de baja con el administrador');
  });
});
