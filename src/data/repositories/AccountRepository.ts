// Registro con codigo de verificacion y recuperacion de contrasena por correo.
import { ApiClient } from '../../core/http/ApiClient';
import { NewAccount } from '../../domain/account';

const CHANNEL = 'email';

export interface AccountRepository {
  register(account: NewAccount): Promise<void>;
  verifyRegistration(email: string, code: string): Promise<void>;
  resendRegistrationCode(email: string): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  verifyRecoveryCode(email: string, code: string): Promise<void>;
  resendRecoveryCode(email: string): Promise<void>;
  resetPassword(email: string, newPassword: string): Promise<void>;
}

export class ApiAccountRepository implements AccountRepository {
  private readonly client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  private post(path: string, body: Record<string, unknown>) {
    return this.client.request(path, { method: 'POST', body: { ...body, canal: CHANNEL } });
  }

  async register({ name, email, phone, password }: NewAccount) {
    await this.post('/auth/register', {
      nombreCompleto: name.trim(),
      correoElectronico: email.trim(),
      telefono: phone.replace(/\D/g, ''),
      contrasena: password,
    });
  }

  async verifyRegistration(email: string, code: string) {
    await this.post('/auth/verify-email', { correoElectronico: email.trim(), code: code.trim() });
  }

  async resendRegistrationCode(email: string) {
    await this.post('/auth/resend-code', { correoElectronico: email.trim() });
  }

  async requestPasswordReset(email: string) {
    await this.post('/auth/forgot-password', { correoElectronico: email.trim() });
  }

  async verifyRecoveryCode(email: string, code: string) {
    await this.post('/auth/verify-recovery-code', { correoElectronico: email.trim(), code: code.trim() });
  }

  async resendRecoveryCode(email: string) {
    await this.post('/auth/resend-recovery-code', { correoElectronico: email.trim() });
  }

  async resetPassword(email: string, newPassword: string) {
    await this.post('/auth/reset-password', { correoElectronico: email.trim(), newPassword });
  }
}
