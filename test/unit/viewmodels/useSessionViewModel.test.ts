// Caja blanca, ViewModel: inicio de sesion con Google (proveedor nativo y backend simulados).
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { sessionStore } from '../../../src/core/state/sessionStore';
import { GoogleAuthProvider } from '../../../src/data/google/googleSignIn';
import { AuthRepository } from '../../../src/data/repositories/AuthRepository';
import { SessionStorage } from '../../../src/data/storage/sessionStorage';
import { useSessionViewModel } from '../../../src/presentation/viewmodels/useSessionViewModel';

const user = { name: 'Javier Flores', email: 'javier@gmail.com', phone: '' };

function fakes(googleToken: string | null = 'ya29.token-google') {
  const auth: AuthRepository = {
    login: jest.fn(),
    loginWithGoogle: jest.fn().mockResolvedValue({ token: 'jwt-carlyn', user }),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
  };
  const storage: SessionStorage = { read: jest.fn().mockResolvedValue(null), save: jest.fn(), clear: jest.fn() };
  const google: GoogleAuthProvider = { getAccessToken: jest.fn().mockResolvedValue(googleToken), signOut: jest.fn() };
  return { auth, storage, google };
}

async function render(deps: ReturnType<typeof fakes>) {
  const { result } = await renderHook(() => useSessionViewModel(deps.auth, deps.storage, deps.google));
  await waitFor(() => expect(result.current.status).toBe('signedOut'));
  return result;
}

async function call<T>(action: () => Promise<T>) {
  let value: T | undefined;
  await act(async () => { value = await action(); });
  return value;
}

describe('useSessionViewModel con Google', () => {
  beforeEach(() => sessionStore.signOut());

  it('inicia sesion con el token de Google y guarda la sesion cifrada', async () => {
    const deps = fakes();
    const result = await render(deps);
    expect(await call(() => result.current.signInWithGoogle())).toBeNull();
    expect(deps.auth.loginWithGoogle).toHaveBeenCalledWith('ya29.token-google');
    expect(deps.storage.save).toHaveBeenCalledWith({ token: 'jwt-carlyn', email: 'javier@gmail.com' });
    expect(result.current.status).toBe('signedIn');
    expect(result.current.name).toBe('Javier Flores');
  });

  it('no hace nada si el usuario cancela la ventana de Google', async () => {
    const deps = fakes(null);
    const result = await render(deps);
    expect(await call(() => result.current.signInWithGoogle())).toBeNull();
    expect(deps.auth.loginWithGoogle).not.toHaveBeenCalled();
    expect(result.current.status).toBe('signedOut');
  });

  it('muestra el motivo cuando Google no esta disponible (por ejemplo en Expo Go)', async () => {
    const deps = fakes();
    (deps.google.getAccessToken as jest.Mock).mockRejectedValue(new Error('El acceso con Google funciona en la app instalada (development build), no en Expo Go.'));
    const result = await render(deps);
    expect(await call(() => result.current.signInWithGoogle())).toMatchObject({ ok: false, title: 'No fue posible entrar con Google' });
    expect(result.current.loadingGoogle).toBe(false);
  });

  it('cierra tambien la sesion de Google al salir', async () => {
    const deps = fakes();
    const result = await render(deps);
    await call(() => result.current.signInWithGoogle());
    await call(() => result.current.signOut());
    expect(deps.google.signOut).toHaveBeenCalled();
    expect(result.current.status).toBe('signedOut');
  });
});
