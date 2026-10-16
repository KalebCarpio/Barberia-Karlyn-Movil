const configuredUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export const API_URL = configuredUrl.replace(/\/$/, '');

type RequestOptions = Omit<RequestInit, 'headers' | 'body'> & {
  token?: string | null;
  body?: unknown;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, body, ...requestOptions } = options;
  const response = await fetch(`${API_URL}/api${path}`, {
    ...requestOptions,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || payload.error || 'No fue posible comunicarse con el servidor.');
  }

  return payload as T;
}
