// MGMT-01 (#59) y HIST-01 (#60).
import { ApiClient } from '../../core/http/ApiClient';
import { Appointment, NewAppointment } from '../../domain/models';
import { ModelFactory } from '../factories/ModelFactory';

const PENDING_STATUS_ID = Number(process.env.EXPO_PUBLIC_PENDING_APPOINTMENT_STATUS_ID || '1');

export interface AppointmentRepository {
  list(): Promise<Appointment[]>;
  create(appointment: NewAppointment): Promise<void>;
  reschedule(id: number, date: string, time: string): Promise<void>;
  cancel(id: number): Promise<void>;
}

export class ApiAppointmentRepository implements AppointmentRepository {
  private readonly client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  async list() {
    const response = await this.client.request<unknown>('/citas', { auth: true });
    return ModelFactory.createList('appointment', response, ['data', 'citas', 'appointments']);
  }

  async create({ barberId, serviceId, branchId, date, time }: NewAppointment) {
    await this.client.request('/citas', {
      method: 'POST',
      auth: true,
      body: {
        barberoId: barberId,
        servicioId: serviceId,
        localId: branchId,
        fecha: date,
        horaInicio: time,
        estadoId: PENDING_STATUS_ID,
        notas: '',
      },
    });
  }

  async reschedule(id: number, date: string, time: string) {
    await this.client.request(`/citas/${id}`, {
      method: 'PUT',
      auth: true,
      body: { fecha: date, horaInicio: time, notas: '' },
    });
  }

  async cancel(id: number) {
    await this.client.request(`/citas/${id}`, { method: 'DELETE', auth: true });
  }
}
