import { Appointment, Barber, Branch, Service, Slot, UserProfile } from '../../domain/models';
import { ApiRecord, pick, records, toNumber } from './apiRecord';

type ModelMap = {
  service: Service;
  branch: Branch;
  barber: Barber;
  slot: Slot;
  appointment: Appointment;
};

export type ModelKind = keyof ModelMap;

function createService(item: ApiRecord): Service {
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

function createBranch(item: ApiRecord): Branch {
  return {
    id: toNumber(pick(item, 'id', 'local_id', 'sucursal_id')),
    name: String(pick(item, 'nombre', 'name', 'nombre_local') || 'Sucursal'),
    detail: String(pick(item, 'direccion', 'address', 'ubicacion') || 'Ubicacion disponible'),
  };
}

function createBarber(item: ApiRecord): Barber {
  return {
    id: toNumber(pick(item, 'id', 'barbero_id', 'barber_id')),
    name: String(pick(item, 'nombre', 'name', 'nombre_completo') || 'Barbero'),
    specialty: String(pick(item, 'especialidad', 'specialty') || 'Especialista Carlyn'),
  };
}

function createSlot(item: ApiRecord): Slot {
  return {
    time: String(pick(item, 'hora', 'time', 'hora_inicio') || '').slice(0, 5),
    available: pick(item, 'disponible', 'available') !== false && pick(item, 'ocupado', 'busy') !== true,
    reason: pick(item, 'motivo', 'reason') ? String(pick(item, 'motivo', 'reason')) : undefined,
  };
}

function createAppointment(item: ApiRecord): Appointment {
  const service = createService({
    id: pick(item, 'servicio_id', 'service_id'),
    nombre: pick(item, 'servicio_nombre', 'service_name', 'nombre_servicio'),
    categoria: pick(item, 'servicio_categoria', 'categoria_servicio', 'category'),
    precio: pick(item, 'servicio_precio', 'precio_servicio', 'price'),
    duracion: pick(item, 'servicio_duracion', 'duracion_minutos', 'duration'),
    imagen_url: pick(item, 'servicio_imagen_url', 'imagen_url', 'image_url'),
  });
  const status = String(pick(item, 'estado_nombre', 'status_name', 'estado', 'status') || 'Confirmada');

  return {
    id: toNumber(pick(item, 'id', 'cita_id', 'appointment_id')),
    service,
    date: String(pick(item, 'fecha', 'appointment_date', 'date') || ''),
    time: String(pick(item, 'hora_inicio', 'start_time', 'hora') || '').slice(0, 5),
    barber: String(pick(item, 'barbero_nombre', 'barber_name', 'nombre_barbero') || 'Barbero asignado'),
    barberId: toNumber(pick(item, 'barbero_id', 'barber_id')) || undefined,
    branchId: toNumber(pick(item, 'local_id', 'branch_id', 'sucursal_id')) || undefined,
    status,
    canManage: !/(cancel|complet|finaliz|no.?show|ausen)/.test(status.toLowerCase()),
  };
}

const creators: { [K in ModelKind]: (item: ApiRecord) => ModelMap[K] } = {
  service: createService,
  branch: createBranch,
  barber: createBarber,
  slot: createSlot,
  appointment: createAppointment,
};

// Un modelo es valido si tiene identificador (o hora, en el caso de los horarios).
const validators: { [K in ModelKind]: (model: ModelMap[K]) => boolean } = {
  service: (model) => Boolean(model.id),
  branch: (model) => Boolean(model.id),
  barber: (model) => Boolean(model.id),
  slot: (model) => Boolean(model.time),
  appointment: (model) => Boolean(model.id),
};

// Patron Factory: centraliza la creacion de modelos de dominio a partir de respuestas de la API.
// Los Repositories piden el tipo de modelo y no conocen los nombres de campo del backend.
export const ModelFactory = {
  create<K extends ModelKind>(kind: K, item: ApiRecord): ModelMap[K] {
    return creators[kind](item);
  },

  createList<K extends ModelKind>(kind: K, payload: unknown, keys: string[]): ModelMap[K][] {
    return records(payload, keys)
      .map((item) => creators[kind](item))
      .filter((model) => validators[kind](model));
  },

  createUser(item: ApiRecord, fallbackEmail = ''): UserProfile {
    return {
      name: String(pick(item, 'nombre', 'full_name', 'name') || 'Cliente Carlyn'),
      email: String(pick(item, 'correo_electronico', 'email') || fallbackEmail),
      phone: String(pick(item, 'telefono', 'phone') || ''),
    };
  },
};
