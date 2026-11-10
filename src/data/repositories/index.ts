import { ApiClient } from '../../core/http/ApiClient';
import { AccountRepository, ApiAccountRepository } from './AccountRepository';
import { ApiAppointmentRepository, AppointmentRepository } from './AppointmentRepository';
import { ApiAuthRepository, AuthRepository } from './AuthRepository';
import { ApiAvailabilityRepository, AvailabilityRepository } from './AvailabilityRepository';
import { ApiCatalogRepository, CatalogRepository } from './CatalogRepository';

export type Repositories = {
  auth: AuthRepository;
  account: AccountRepository;
  catalog: CatalogRepository;
  availability: AvailabilityRepository;
  appointments: AppointmentRepository;
};

// Unico lugar donde se eligen las implementaciones; en pruebas se reemplazan por dobles.
export function createRepositories(client = ApiClient.getInstance()): Repositories {
  return {
    auth: new ApiAuthRepository(client),
    account: new ApiAccountRepository(client),
    catalog: new ApiCatalogRepository(client),
    availability: new ApiAvailabilityRepository(client),
    appointments: new ApiAppointmentRepository(client),
  };
}

export const repositories = createRepositories();
