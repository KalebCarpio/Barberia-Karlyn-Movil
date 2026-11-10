// Caja blanca: interceptor de 401 del ApiClient (renovar token y repetir la peticion).
import { ApiClient } from '../../../src/core/http/ApiClient';
import { sessionStore } from '../../../src/core/state/sessionStore';

const user = { name: 'Admin', email: 'admin@carlyn.mx', phone: '' };
const client = ApiClient.getInstance();

type Reply = { status: number; body: unknown };

// fetch simulado que responde en orden y registra el token enviado en cada llamada.
function mockSequence(...replies: Reply[]) {
  const tokens: (string | undefined)[] = [];
  const fetchMock = jest.fn().mockImplementation(async (_url: string, init: RequestInit) => {
    tokens.push((init.headers as Record<string, string>).Authorization);
    const reply = replies.shift() ?? { status: 200, body: {} };
    return { ok: reply.status < 300, status: reply.status, json: async () => reply.body };
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return { fetchMock, tokens };
}

describe('ApiClient: interceptor de 401', () => {
  beforeEach(() => sessionStore.signIn('token-viejo', user));
  afterEach(() => client.setTokenRefresher(null));

  it('renueva el token y repite la peticion con el token nuevo', async () => {
    const refresher = jest.fn().mockResolvedValue('token-nuevo');
    client.setTokenRefresher(refresher);
    const { tokens } = mockSequence({ status: 401, body: { error: 'Token expirado' } }, { status: 200, body: { data: [1] } });

    await expect(client.request('/citas', { auth: true })).resolves.toEqual({ data: [1] });
    expect(refresher).toHaveBeenCalledTimes(1);
    expect(tokens).toEqual(['Bearer token-viejo', 'Bearer token-nuevo']);
  });

  it('renueva una sola vez aunque varias peticiones reciban 401 al mismo tiempo', async () => {
    let resolveRefresh: (token: string) => void = () => undefined;
    const refresher = jest.fn().mockImplementation(() => new Promise<string>((resolve) => { resolveRefresh = resolve; }));
    client.setTokenRefresher(refresher);
    mockSequence(
      { status: 401, body: {} }, { status: 401, body: {} },
      { status: 200, body: { ok: 1 } }, { status: 200, body: { ok: 2 } },
    );

    const both = Promise.all([client.request('/citas', { auth: true }), client.request('/auth/privacy', { auth: true })]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    resolveRefresh('token-nuevo');
    await expect(both).resolves.toHaveLength(2);
    expect(refresher).toHaveBeenCalledTimes(1);
  });

  it('informa que la sesion expiro si no se pudo renovar', async () => {
    client.setTokenRefresher(jest.fn().mockResolvedValue(null));
    mockSequence({ status: 401, body: { error: 'Token expirado' } });
    await expect(client.request('/citas', { auth: true })).rejects.toMatchObject({ status: 401, message: 'Tu sesion expiro. Inicia sesion de nuevo.' });
  });

  it('no intenta renovar en peticiones publicas ni con token explicito', async () => {
    const refresher = jest.fn().mockResolvedValue('token-nuevo');
    client.setTokenRefresher(refresher);

    mockSequence({ status: 401, body: { message: 'Credenciales incorrectas' } });
    await expect(client.request('/auth/login', { method: 'POST', body: {} })).rejects.toThrow('Credenciales incorrectas');

    mockSequence({ status: 401, body: { error: 'Token expirado' } });
    await expect(client.request('/auth/profile', { token: 'token-guardado' })).rejects.toThrow('Token expirado');
    expect(refresher).not.toHaveBeenCalled();
  });

  it('no repite peticiones que fallan por otros motivos', async () => {
    const refresher = jest.fn();
    client.setTokenRefresher(refresher);
    const { fetchMock } = mockSequence({ status: 403, body: { message: 'Sin permiso' } });
    await expect(client.request('/admin/usuarios', { auth: true })).rejects.toMatchObject({ status: 403 });
    expect(refresher).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
