import { useEffect, useState, useSyncExternalStore } from 'react';
import { ApiClient, ApiError } from '../../core/http/ApiClient';
import { sessionStore } from '../../core/state/sessionStore';
import { repositories } from '../../data/repositories';
import { GoogleAuthProvider, nativeGoogleAuth } from '../../data/google/googleSignIn';
import { AuthRepository } from '../../data/repositories/AuthRepository';
import { secureSessionStorage, SessionStorage } from '../../data/storage/sessionStorage';
import { createTokenRefresher } from '../../data/storage/tokenRefresher';
import { UserProfile } from '../../domain/models';
import { ActionResult, errorMessage } from './types';

// ViewModel de sesion y perfil: login, restauracion de sesion guardada, edicion de perfil y cierre.
export function useSessionViewModel(
  auth: AuthRepository = repositories.auth,
  storage: SessionStorage = secureSessionStorage,
  google: GoogleAuthProvider = nativeGoogleAuth,
) {
  const session = useSyncExternalStore(sessionStore.subscribe, sessionStore.getState);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const applyUser = (user: UserProfile) => {
    setEmail(user.email);
    setName(user.name);
    setPhone(user.phone);
  };

  // El ApiClient renueva el token con el refresh token cuando una peticion con sesion recibe 401.
  useEffect(() => {
    const client = ApiClient.getInstance();
    client.setTokenRefresher(createTokenRefresher(auth, storage));
    return () => client.setTokenRefresher(null);
  }, [auth, storage]);

  useEffect(() => {
    const restoreSession = async () => {
      // Si el almacenamiento seguro no esta disponible (por ejemplo en web) se pide iniciar sesion.
      const stored = await storage.read().catch(() => null);
      if (!stored) {
        sessionStore.signOut();
        return;
      }
      try {
        let token = stored.token;
        let user;
        try {
          user = await auth.getProfile(token, stored.email);
        } catch (error) {
          // Token guardado vencido: se renueva con el refresh token antes de pedir iniciar sesion.
          if (!(error instanceof ApiError) || error.status !== 401) throw error;
          const renewed = await createTokenRefresher(auth, storage)();
          if (!renewed) return;
          token = renewed;
          user = await auth.getProfile(token, stored.email);
        }
        applyUser(user);
        sessionStore.signIn(token, user);
      } catch {
        await storage.clear();
        sessionStore.signOut();
      }
    };
    void restoreSession();
  }, [auth, storage]);

  const signIn = async (): Promise<ActionResult | null> => {
    if (!email.trim() || !password) {
      return { ok: false, title: 'Faltan datos', message: 'Escribe tu correo y contrasena para continuar.' };
    }
    setLoadingLogin(true);
    try {
      const { token, refreshToken, user } = await auth.login(email.trim(), password);
      await storage.save({ token, refreshToken, email: email.trim() });
      applyUser({ ...user, email: email.trim() });
      setPassword('');
      sessionStore.signIn(token, user);
      return null;
    } catch (error) {
      return { ok: false, title: 'No fue posible iniciar sesion', message: errorMessage(error, 'Verifica tus datos e intenta de nuevo.') };
    } finally {
      setLoadingLogin(false);
    }
  };

  const signInWithGoogle = async (): Promise<ActionResult | null> => {
    setLoadingGoogle(true);
    try {
      const googleToken = await google.getAccessToken();
      if (!googleToken) return null;
      const { token, refreshToken, user } = await auth.loginWithGoogle(googleToken);
      await storage.save({ token, refreshToken, email: user.email });
      applyUser(user);
      setPassword('');
      sessionStore.signIn(token, user);
      return null;
    } catch (error) {
      return { ok: false, title: 'No fue posible entrar con Google', message: errorMessage(error, 'Intenta nuevamente.') };
    } finally {
      setLoadingGoogle(false);
    }
  };

  const saveProfile = async (): Promise<ActionResult | null> => {
    if (!session.token) return null;
    try {
      const user = await auth.updateProfile(name, phone);
      setName(user.name);
      setPhone(user.phone);
      sessionStore.updateUser({ ...user, email });
      return { ok: true, title: 'Perfil actualizado', message: 'Tus datos se guardaron correctamente.' };
    } catch (error) {
      return { ok: false, title: 'No fue posible actualizar', message: errorMessage(error, 'Intenta nuevamente.') };
    }
  };

  const signOut = async () => {
    await storage.clear();
    await google.signOut();
    setPassword('');
    sessionStore.signOut();
  };

  return {
    status: session.status,
    token: session.token,
    email,
    setEmail,
    password,
    setPassword,
    passwordVisible,
    togglePasswordVisible: () => setPasswordVisible((current) => !current),
    name,
    setName,
    phone,
    setPhone,
    loadingLogin,
    loadingGoogle,
    signIn,
    signInWithGoogle,
    saveProfile,
    signOut,
  };
}

export type SessionViewModel = ReturnType<typeof useSessionViewModel>;
