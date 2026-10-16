import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'carlyn-mobile-session';

export type StoredSession = {
  token: string;
  email: string;
};

export async function readSession(): Promise<StoredSession | null> {
  const rawSession = await SecureStore.getItemAsync(SESSION_KEY);

  if (!rawSession) return null;

  try {
    const session = JSON.parse(rawSession) as StoredSession;
    return session.token && session.email ? session : null;
  } catch {
    await clearSession();
    return null;
  }
}

export async function saveSession(session: StoredSession) {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
