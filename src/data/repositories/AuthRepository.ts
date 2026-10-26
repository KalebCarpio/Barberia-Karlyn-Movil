import { ApiClient } from '../../core/http/ApiClient';
import { UserProfile } from '../../domain/models';
import { ApiRecord, pick } from '../factories/apiRecord';
import { ModelFactory } from '../factories/ModelFactory';

export type LoginResult = { token: string; user: UserProfile };

export interface AuthRepository {
  login(email: string, password: string): Promise<LoginResult>;
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
    return { token, user: ModelFactory.createUser((response.user || {}) as ApiRecord, email) };
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
