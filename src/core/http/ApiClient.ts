import { API_URL } from '../config';
import { sessionStore } from '../state/sessionStore';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  // auth: envia el token de la sesion activa. token: envia un token especifico (por ejemplo al restaurar la sesion).
  auth?: boolean;
  token?: string | null;
};

// Patron Singleton: una sola instancia comparte la URL base y la forma de autenticar en toda la app.
export class ApiClient {
  private static instance: ApiClient | null = null;

  readonly baseUrl: string;

  private constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  static getInstance() {
    if (!ApiClient.instance) ApiClient.instance = new ApiClient(API_URL);
    return ApiClient.instance;
  }

  async request<T>(path: string, { method = 'GET', body, auth = false, token }: RequestOptions = {}): Promise<T> {
    const bearer = token ?? (auth ? sessionStore.getState().token : null);
    const response = await fetch(`${this.baseUrl}/api${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new ApiError(payload.message || payload.error || 'No fue posible comunicarse con el servidor.', response.status);
    }

    return payload as T;
  }
}
