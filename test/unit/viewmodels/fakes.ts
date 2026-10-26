// Dobles de prueba de los Repositories: los ViewModels se prueban sin red gracias a sus interfaces.
import { AppointmentRepository } from '../../../src/data/repositories/AppointmentRepository';
import { AvailabilityRepository } from '../../../src/data/repositories/AvailabilityRepository';
import { CatalogRepository } from '../../../src/data/repositories/CatalogRepository';
import { Barber, Branch, Service, Slot } from '../../../src/domain/models';

export const services: Service[] = [
  { id: 11, name: 'Corte First Class', category: 'Paquetes', description: 'Paquete', price: 250, duration: 60 },
  { id: 12, name: 'Corte clasico', category: 'Cortes', description: 'Corte', price: 180, duration: 45 },
];
export const branches: Branch[] = [{ id: 1, name: 'Barberia Carlyn', detail: 'Centro' }];
export const barbers: Barber[] = [{ id: 34, name: 'Carlos Mendez', specialty: 'Barba' }];
export const slots: Slot[] = [
  { time: '09:40', available: true },
  { time: '10:20', available: false, reason: 'Horario reservado' },
];

export function fakeCatalog(overrides: Partial<CatalogRepository> = {}): CatalogRepository {
  return {
    getServices: jest.fn().mockResolvedValue(services),
    getBranches: jest.fn().mockResolvedValue(branches),
    getBarbersByBranch: jest.fn().mockResolvedValue(barbers),
    ...overrides,
  };
}

export function fakeAvailability(overrides: Partial<AvailabilityRepository> = {}): AvailabilityRepository {
  return {
    getUnavailableDates: jest.fn().mockResolvedValue([]),
    getSlots: jest.fn().mockResolvedValue(slots),
    ...overrides,
  };
}

export function fakeAppointments(overrides: Partial<AppointmentRepository> = {}): AppointmentRepository {
  return {
    list: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue(undefined),
    reschedule: jest.fn().mockResolvedValue(undefined),
    cancel: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}
