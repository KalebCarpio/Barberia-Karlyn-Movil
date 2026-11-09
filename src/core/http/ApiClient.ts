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

// Pide un token de acceso nuevo con el refresh token guardado; devuelve null si la sesion ya no se puede renovar.
export type TokenRefresher = () => Promise<string | null>;

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

  private refresher: TokenRefresher | null = null;

  // Renovacion en curso: si varias peticiones reciben 401 al mismo tiempo, todas esperan la misma.
  private refreshing: Promise<string | null> | null = null;

  private constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  static getInstance() {
    if (!ApiClient.instance) ApiClient.instance = new ApiClient(API_URL);
    return ApiClient.instance;
  }

  setTokenRefresher(refresher: TokenRefresher | null) {
    this.refresher = refresher;
  }

  private refreshToken() {
    if (!this.refresher) return Promise.resolve(null);
    if (!this.refreshing) {
      this.refreshing = this.refresher().finally(() => {
        this.refreshing = null;
      });
    }
    return this.refreshing;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    try {
      return await this.send<T>(path, options);
    } catch (error) {
      // Interceptor de 401: solo para peticiones con la sesion activa (no para login ni tokens explicitos).
      const usesSession = options.auth && options.token === undefined && Boolean(sessionStore.getState().token);
      if (!(error instanceof ApiError) || error.status !== 401 || !usesSession || !this.refresher) throw error;

      const newToken = await this.refreshToken();
      if (!newToken) throw new ApiError('Tu sesion expiro. Inicia sesion de nuevo.', 401);
      return this.send<T>(path, { ...options, token: newToken });
    }
  }

  private async send<T>(path: string, { method = 'GET', body, auth = false, token }: RequestOptions): Promise<T> {
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
