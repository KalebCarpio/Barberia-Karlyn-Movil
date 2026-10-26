// CAT-01 (#53) y CAT-02 (#54).
import { ApiClient } from '../../core/http/ApiClient';
import { Barber, Branch, Service } from '../../domain/models';
import { ModelFactory } from '../factories/ModelFactory';

// Patron Repository: los ViewModels dependen de esta interfaz, no de la REST API.
export interface CatalogRepository {
  getServices(): Promise<Service[]>;
  getBranches(): Promise<Branch[]>;
  getBarbersByBranch(branchId: number): Promise<Barber[]>;
}

export class ApiCatalogRepository implements CatalogRepository {
  private readonly client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  async getServices() {
    const response = await this.client.request<unknown>('/servicios/activos');
    return ModelFactory.createList('service', response, ['servicios', 'data', 'items']);
  }

  async getBranches() {
    const response = await this.client.request<unknown>('/locales');
    return ModelFactory.createList('branch', response, ['locales', 'data', 'sucursales']);
  }

  async getBarbersByBranch(branchId: number) {
    const response = await this.client.request<unknown>(`/barbero/local/${branchId}`);
    return ModelFactory.createList('barber', response, ['barberos', 'data', 'items']);
  }
}
