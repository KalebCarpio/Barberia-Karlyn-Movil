// Caja blanca: renovacion de la sesion con el refresh token guardado.
import { sessionStore } from '../../../src/core/state/sessionStore';
import { AuthRepository } from '../../../src/data/repositories/AuthRepository';
import { SessionStorage, StoredSession } from '../../../src/data/storage/sessionStorage';
import { createTokenRefresher } from '../../../src/data/storage/tokenRefresher';

const user = { name: 'Javier', email: 'javier@correo.com', phone: '' };

function setup(stored: StoredSession | null, refresh: AuthRepository['refresh'] = jest.fn().mockResolvedValue({ token: 'token-nuevo', refreshToken: 'refresh-nuevo' })) {
  const auth = { login: jest.fn(), loginWithGoogle: jest.fn(), refresh, getProfile: jest.fn(), updateProfile: jest.fn() } as AuthRepository;
  const storage: SessionStorage = { read: jest.fn().mockResolvedValue(stored), save: jest.fn(), clear: jest.fn().mockResolvedValue(undefined) };
  return { auth, storage, refresher: createTokenRefresher(auth, storage) };
}

describe('createTokenRefresher', () => {
  beforeEach(() => sessionStore.signIn('token-viejo', user));

  it('renueva, guarda el refresh token rotado y actualiza la sesion', async () => {
    const { auth, storage, refresher } = setup({ token: 'token-viejo', refreshToken: 'refresh-viejo', email: 'javier@correo.com' });
    await expect(refresher()).resolves.toBe('token-nuevo');
    expect(auth.refresh).toHaveBeenCalledWith('refresh-viejo');
    expect(storage.save).toHaveBeenCalledWith({ token: 'token-nuevo', refreshToken: 'refresh-nuevo', email: 'javier@correo.com' });
    expect(sessionStore.getState()).toMatchObject({ status: 'signedIn', token: 'token-nuevo' });
  });

  it('cierra la sesion si la sesion guardada no tiene refresh token', async () => {
    const { auth, storage, refresher } = setup({ token: 'token-viejo', email: 'javier@correo.com' });
    await expect(refresher()).resolves.toBeNull();
    expect(auth.refresh).not.toHaveBeenCalled();
    expect(storage.clear).toHaveBeenCalled();
    expect(sessionStore.getState().status).toBe('signedOut');
  });

  it('cierra la sesion si el backend rechaza el refresh token', async () => {
    const { storage, refresher } = setup(
      { token: 'token-viejo', refreshToken: 'refresh-vencido', email: 'javier@correo.com' },
      jest.fn().mockRejectedValue(new Error('Tu sesion expiro. Inicia sesion de nuevo.')),
    );
    await expect(refresher()).resolves.toBeNull();
    expect(storage.clear).toHaveBeenCalled();
    expect(sessionStore.getState()).toEqual({ status: 'signedOut', token: null, user: null });
  });
});
