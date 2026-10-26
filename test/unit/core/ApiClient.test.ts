// Caja blanca, patron Singleton: cliente HTTP unico con autenticacion Bearer.
import { API_URL } from '../../../src/core/config';
import { ApiClient, ApiError } from '../../../src/core/http/ApiClient';
import { sessionStore } from '../../../src/core/state/sessionStore';
import { mockFetchResponse, requestOf } from '../../integration/mockFetch';

const user = { name: 'Admin', email: 'admin@carlyn.mx', phone: '' };

describe('ApiClient', () => {
  beforeEach(() => sessionStore.signOut());

  it('siempre devuelve la misma instancia', () => {
    expect(ApiClient.getInstance()).toBe(ApiClient.getInstance());
    expect(ApiClient.getInstance().baseUrl).toBe(API_URL);
  });

  it('no envia token en solicitudes publicas', async () => {
    const fetchMock = mockFetchResponse({ ok: true });
    sessionStore.signIn('token-sesion', user);
    await ApiClient.getInstance().request('/locales');
    expect(requestOf(fetchMock).headers.Authorization).toBeUndefined();
  });

  it('toma el token de la sesion activa cuando la solicitud es autenticada', async () => {
    const fetchMock = mockFetchResponse({ ok: true });
    sessionStore.signIn('token-sesion', user);
    await ApiClient.getInstance().request('/citas', { auth: true });
    expect(requestOf(fetchMock).headers.Authorization).toBe('Bearer token-sesion');
  });

  it('prefiere un token explicito sobre el de la sesion', async () => {
    const fetchMock = mockFetchResponse({ ok: true });
    await ApiClient.getInstance().request('/auth/profile', { token: 'token-guardado' });
    expect(requestOf(fetchMock).headers.Authorization).toBe('Bearer token-guardado');
  });

  it('envia el cuerpo como JSON con su encabezado', async () => {
    const fetchMock = mockFetchResponse({ ok: true });
    await ApiClient.getInstance().request('/citas', { method: 'POST', body: { fecha: '2026-10-27' } });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"fecha":"2026-10-27"}');
    expect(requestOf(fetchMock).headers['Content-Type']).toBe('application/json');
  });

  it('lanza ApiError con el codigo HTTP y el mensaje de la API', async () => {
    mockFetchResponse({ error: 'Token no proporcionado' }, 401);
    const request = ApiClient.getInstance().request('/citas');
    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toMatchObject({ status: 401, message: 'Token no proporcionado' });
  });
});
