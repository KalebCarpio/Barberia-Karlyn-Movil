// AVAIL-01 (#68).
import { ApiClient } from '../../core/http/ApiClient';
import { Slot } from '../../domain/models';
import { ModelFactory } from '../factories/ModelFactory';

export interface AvailabilityRepository {
  getUnavailableDates(barberId: number): Promise<string[]>;
  getSlots(barberId: number, date: string): Promise<Slot[]>;
}

export class ApiAvailabilityRepository implements AvailabilityRepository {
  private readonly client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  async getUnavailableDates(barberId: number) {
    const response = await this.client.request<{ fechasNoDisponibles?: unknown }>(
      `/citas/fechas-disponibles?barberoId=${barberId}`,
      { auth: true },
    );
    return Array.isArray(response.fechasNoDisponibles) ? response.fechasNoDisponibles.map(String) : [];
  }

  // La API devuelve `slots` (todos, con ocupados) y `disponibles` (solo libres); se prefiere la lista completa.
  async getSlots(barberId: number, date: string) {
    const response = await this.client.request<unknown>(
      `/citas/horarios-disponibles?barberoId=${barberId}&fecha=${date}`,
      { auth: true },
    );
    return ModelFactory.createList('slot', response, ['slots', 'disponibles', 'libres', 'data', 'horarios']);
  }
}
