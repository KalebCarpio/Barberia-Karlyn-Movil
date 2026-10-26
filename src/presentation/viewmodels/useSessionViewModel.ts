import { useEffect, useState, useSyncExternalStore } from 'react';
import { sessionStore } from '../../core/state/sessionStore';
import { repositories } from '../../data/repositories';
import { AuthRepository } from '../../data/repositories/AuthRepository';
import { secureSessionStorage, SessionStorage } from '../../data/storage/sessionStorage';
import { UserProfile } from '../../domain/models';
import { ActionResult, errorMessage } from './types';

// ViewModel de sesion y perfil: login, restauracion de sesion guardada, edicion de perfil y cierre.
export function useSessionViewModel(auth: AuthRepository = repositories.auth, storage: SessionStorage = secureSessionStorage) {
  const session = useSyncExternalStore(sessionStore.subscribe, sessionStore.getState);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);

  const applyUser = (user: UserProfile) => {
    setEmail(user.email);
    setName(user.name);
    setPhone(user.phone);
  };

  useEffect(() => {
    const restoreSession = async () => {
      // Si el almacenamiento seguro no esta disponible (por ejemplo en web) se pide iniciar sesion.
      const stored = await storage.read().catch(() => null);
      if (!stored) {
        sessionStore.signOut();
        return;
      }
      try {
        const user = await auth.getProfile(stored.token, stored.email);
        applyUser(user);
        sessionStore.signIn(stored.token, user);
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
      const { token, user } = await auth.login(email.trim(), password);
      await storage.save({ token, email: email.trim() });
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
    signIn,
    saveProfile,
    signOut,
  };
}

export type SessionViewModel = ReturnType<typeof useSessionViewModel>;
