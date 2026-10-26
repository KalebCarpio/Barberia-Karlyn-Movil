// CAT-01 (#53): reglas del catalogo, sin dependencias de red ni de interfaz.
import { Service } from './models';

export const ALL_CATEGORIES = 'Todos';

export function serviceCategories(services: Service[]) {
  return [ALL_CATEGORIES, ...Array.from(new Set(services.map((service) => service.category)))];
}

export function filterByCategory(services: Service[], category: string) {
  return category === ALL_CATEGORIES ? services : services.filter((service) => service.category === category);
}
