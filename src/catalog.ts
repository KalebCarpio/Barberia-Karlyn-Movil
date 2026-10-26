// CAT-01 (#53) sucursales y servicios, CAT-02 (#54) barberos por sucursal.
import { apiRequest } from './api';
import { ApiRecord, pick, records, toNumber } from './records';

export type Service = {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  duration: number;
  imageUrl?: string;
};

export type Branch = { id: number; name: string; detail: string };
export type Barber = { id: number; name: string; specialty: string };

export const ALL_CATEGORIES = 'Todos';

export function mapService(item: ApiRecord): Service {
  return {
    id: toNumber(pick(item, 'id', 'servicio_id', 'service_id')),
    name: String(pick(item, 'nombre', 'name', 'nombre_servicio') || 'Servicio'),
    category: String(pick(item, 'categoria', 'category', 'categoria_servicio') || 'Servicios'),
    description: String(pick(item, 'descripcion', 'description') || 'Servicio profesional de Barberia Carlyn.'),
    price: toNumber(pick(item, 'precio', 'price', 'precio_servicio')),
    duration: toNumber(pick(item, 'duracion', 'duration', 'duracion_minutos'), 30),
    imageUrl: String(pick(item, 'imagen_url', 'image_url', 'imageUrl') || '') || undefined,
  };
}

export function mapBranch(item: ApiRecord): Branch {
  return {
    id: toNumber(pick(item, 'id', 'local_id', 'sucursal_id')),
    name: String(pick(item, 'nombre', 'name', 'nombre_local') || 'Sucursal'),
    detail: String(pick(item, 'direccion', 'address', 'ubicacion') || 'Ubicacion disponible'),
  };
}

export function mapBarber(item: ApiRecord): Barber {
  return {
    id: toNumber(pick(item, 'id', 'barbero_id', 'barber_id')),
    name: String(pick(item, 'nombre', 'name', 'nombre_completo') || 'Barbero'),
    specialty: String(pick(item, 'especialidad', 'specialty') || 'Especialista Carlyn'),
  };
}

export function serviceCategories(services: Service[]) {
  return [ALL_CATEGORIES, ...Array.from(new Set(services.map((service) => service.category)))];
}

export function filterByCategory(services: Service[], category: string) {
  return category === ALL_CATEGORIES ? services : services.filter((service) => service.category === category);
}

export async function fetchServices() {
  const response = await apiRequest<unknown>('/servicios/activos');
  return records(response, ['servicios', 'data', 'items']).map(mapService).filter((service) => service.id);
}

export async function fetchBranches() {
  const response = await apiRequest<unknown>('/locales');
  return records(response, ['locales', 'data', 'sucursales']).map(mapBranch).filter((branch) => branch.id);
}

export async function fetchBarbersByBranch(branchId: number) {
  const response = await apiRequest<unknown>(`/barbero/local/${branchId}`);
  return records(response, ['barberos', 'data', 'items']).map(mapBarber).filter((barber) => barber.id);
}
