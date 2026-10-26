import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'carlyn-mobile-session';

export type StoredSession = {
  token: string;
  email: string;
};

export interface SessionStorage {
  read(): Promise<StoredSession | null>;
  save(session: StoredSession): Promise<void>;
  clear(): Promise<void>;
}

// Guarda la sesion cifrada: Keychain en iOS y almacenamiento cifrado con Keystore en Android.
export const secureSessionStorage: SessionStorage = {
  async read() {
    const rawSession = await SecureStore.getItemAsync(SESSION_KEY);
    if (!rawSession) return null;

    try {
      const session = JSON.parse(rawSession) as StoredSession;
      return session.token && session.email ? session : null;
    } catch {
      await this.clear();
      return null;
    }
  },

  async save(session) {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
  },

  async clear() {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  },
};
