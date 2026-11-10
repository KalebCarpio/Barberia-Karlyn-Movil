// Renueva el token de acceso con el refresh token guardado (cifrado) y actualiza la sesion.
// El ApiClient lo usa cuando una peticion con sesion recibe 401.
import { TokenRefresher } from '../../core/http/ApiClient';
import { sessionStore } from '../../core/state/sessionStore';
import { AuthRepository } from '../repositories/AuthRepository';
import { SessionStorage } from './sessionStorage';

export function createTokenRefresher(auth: AuthRepository, storage: SessionStorage): TokenRefresher {
  return async () => {
    const stored = await storage.read().catch(() => null);
    if (!stored?.refreshToken) return expire(storage);
    try {
      const { token, refreshToken } = await auth.refresh(stored.refreshToken);
      await storage.save({ ...stored, token, refreshToken });
      sessionStore.updateToken(token);
      return token;
    } catch {
      return expire(storage);
    }
  };
}

// Si no se puede renovar, la sesion termina y la app regresa al inicio de sesion.
async function expire(storage: SessionStorage) {
  await storage.clear().catch(() => undefined);
  sessionStore.signOut();
  return null;
}
