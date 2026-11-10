import { ApiClient } from '../../core/http/ApiClient';
import { UserProfile } from '../../domain/models';
import { ApiRecord, pick } from '../factories/apiRecord';
import { ModelFactory } from '../factories/ModelFactory';

const optionalString = (value: unknown) => (value ? String(value) : undefined);

export type LoginResult = { token: string; refreshToken?: string; user: UserProfile };
export type RefreshResult = { token: string; refreshToken: string };

export interface AuthRepository {
  login(email: string, password: string): Promise<LoginResult>;
  loginWithGoogle(googleAccessToken: string): Promise<LoginResult>;
  refresh(refreshToken: string): Promise<RefreshResult>;
  getProfile(token: string, fallbackEmail: string): Promise<UserProfile>;
  updateProfile(name: string, phone: string): Promise<UserProfile>;
}

export class ApiAuthRepository implements AuthRepository {
  private readonly client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  async login(email: string, password: string) {
    const response = await this.client.request<ApiRecord>('/auth/login', {
      method: 'POST',
      body: { correoElectronico: email, contrasena: password },
    });
    const token = String(response.token || '');
    if (!token) throw new Error('El servidor no devolvio una sesion valida.');
    return { token, refreshToken: optionalString(response.refreshToken), user: ModelFactory.createUser((response.user || {}) as ApiRecord, email) };
  }

  // El backend consulta el perfil en Google con el access token y crea la cuenta si no existe.
  async loginWithGoogle(googleAccessToken: string) {
    const response = await this.client.request<ApiRecord>('/auth/google', {
      method: 'POST',
      body: { googleToken: googleAccessToken },
    });
    const token = String(response.token || '');
    if (!token) throw new Error('El servidor no devolvio una sesion valida.');
    const user = (response.user || {}) as ApiRecord;
    return { token, refreshToken: optionalString(response.refreshToken), user: ModelFactory.createUser(user, String(user.email || '')) };
  }

  // Sin token de sesion: el refresh token es la credencial. El backend tambien rota el refresh token.
  async refresh(refreshToken: string) {
    const response = await this.client.request<ApiRecord>('/auth/refresh', { method: 'POST', body: { refreshToken } });
    const token = String(response.token || '');
    const nextRefreshToken = String(response.refreshToken || '');
    if (!token || !nextRefreshToken) throw new Error('El servidor no devolvio una sesion valida.');
    return { token, refreshToken: nextRefreshToken };
  }

  async getProfile(token: string, fallbackEmail: string) {
    const response = await this.client.request<ApiRecord>('/auth/profile', { token });
    return ModelFactory.createUser((response.user || response.data || response) as ApiRecord, fallbackEmail);
  }

  async updateProfile(name: string, phone: string) {
    const response = await this.client.request<ApiRecord>('/auth/profile', {
      method: 'PUT',
      auth: true,
      body: { nombre: name.trim(), telefono: phone.replace(/\D/g, '') },
    });
    const user = (response.user || response.data || {}) as ApiRecord;
    // Si la API no devuelve el usuario actualizado se conservan los datos enviados.
    return ModelFactory.createUser({
      ...user,
      nombre: pick(user, 'nombre', 'full_name', 'name') || name,
      telefono: pick(user, 'telefono', 'phone') || phone,
    });
  }
}
