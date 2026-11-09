// Derechos ARCO: aceptar el aviso, oposicion (opt-out) y cancelacion (eliminar cuenta).
import { ApiClient } from '../../core/http/ApiClient';
import { PrivacyPreference, PrivacySettings } from '../../domain/privacy';
import { ApiRecord } from '../factories/apiRecord';

const API_FIELDS: Record<PrivacyPreference, string> = {
  promotions: 'permitePromociones',
  reminders: 'permiteRecordatorios',
  analytics: 'permiteAnalitica',
};

function toSettings(payload: ApiRecord): PrivacySettings {
  const privacy = (payload?.privacy || {}) as ApiRecord;
  return {
    acceptedAt: privacy.aceptoPrivacidadAt ? String(privacy.aceptoPrivacidadAt) : null,
    promotions: privacy.permitePromociones === true,
    reminders: privacy.permiteRecordatorios !== false,
    analytics: privacy.permiteAnalitica !== false,
  };
}

export interface PrivacyRepository {
  get(): Promise<PrivacySettings>;
  acceptNotice(): Promise<PrivacySettings>;
  update(preference: PrivacyPreference, enabled: boolean): Promise<PrivacySettings>;
  deleteAccount(confirmation: string): Promise<void>;
}

export class ApiPrivacyRepository implements PrivacyRepository {
  private readonly client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  async get() {
    return toSettings(await this.client.request<ApiRecord>('/auth/privacy', { auth: true }));
  }

  async acceptNotice() {
    return toSettings(await this.client.request<ApiRecord>('/auth/privacy/consent', { method: 'POST', auth: true }));
  }

  async update(preference: PrivacyPreference, enabled: boolean) {
    return toSettings(await this.client.request<ApiRecord>('/auth/privacy', {
      method: 'PUT',
      auth: true,
      body: { [API_FIELDS[preference]]: enabled },
    }));
  }

  async deleteAccount(confirmation: string) {
    await this.client.request('/auth/account', { method: 'DELETE', auth: true, body: { confirmacion: confirmation } });
  }
}
