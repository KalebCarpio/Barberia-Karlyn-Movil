// Caja blanca, patron Factory: creacion de modelos de dominio desde respuestas de la API.
import barberos from '../../fixtures/barberos-local-1.json';
import horarios from '../../fixtures/horarios-disponibles.json';
import locales from '../../fixtures/locales.json';
import servicios from '../../fixtures/servicios-activos.json';
import { ModelFactory } from '../../../src/data/factories/ModelFactory';

describe('ModelFactory.create', () => {
  it('crea un servicio convirtiendo el precio en texto a numero', () => {
    expect(ModelFactory.create('service', servicios.servicios[0])).toEqual({
      id: 11,
      name: 'Paquete 1 - Corte First Class',
      category: 'Paquetes',
      description: 'Corte personalizado, lavado, masaje, peinado premium, locion',
      price: 250,
      duration: 60,
      imageUrl: 'https://example.com/servicios/first-class.jpg',
    });
  });

  it('aplica valores por defecto cuando faltan descripcion, duracion o imagen', () => {
    const barba = ModelFactory.create('service', servicios.servicios[2]);
    expect(barba.description).toBe('Servicio profesional de Barberia Carlyn.');
    expect(barba.duration).toBe(30);
    expect(barba.imageUrl).toBeUndefined();
  });

  it('crea una cita y marca como no gestionables las canceladas o completadas', () => {
    const base = { id: 7, servicio_nombre: 'Corte', fecha: '2026-10-27', hora_inicio: '10:20:00', barbero_nombre: 'Carlos' };
    const pending = ModelFactory.create('appointment', { ...base, estado_nombre: 'Pendiente' });
    expect(pending).toMatchObject({ id: 7, time: '10:20', barber: 'Carlos', canManage: true });
    expect(ModelFactory.create('appointment', { ...base, estado_nombre: 'Cancelada' }).canManage).toBe(false);
    expect(ModelFactory.create('appointment', { ...base, estado_nombre: 'Completada' }).canManage).toBe(false);
  });
});

describe('ModelFactory.createList', () => {
  it('descarta servicios sin id', () => {
    expect(ModelFactory.createList('service', servicios, ['servicios']).map((service) => service.id)).toEqual([11, 12, 13]);
  });

  it('crea sucursales con direccion por defecto', () => {
    expect(ModelFactory.createList('branch', locales, ['data'])).toEqual([
      { id: 1, name: 'Barberia Carlyn', detail: 'Adolfo Lopez Mateos 33, Aviacion Civil' },
      { id: 2, name: 'Barberia Carlyn Sucursal 2', detail: 'Ubicacion disponible' },
    ]);
  });

  it('crea barberos usando barbero_id y especialidad por defecto', () => {
    expect(ModelFactory.createList('barber', barberos, ['data'])).toEqual([
      { id: 34, name: 'Carlos Mendez', specialty: 'Corte clasico y barba' },
      { id: 35, name: 'Luis Hernandez', specialty: 'Degradados y diseno' },
      { id: 36, name: 'Diego Martinez', specialty: 'Especialista Carlyn' },
    ]);
  });

  it('usa la primera lista disponible segun el orden de llaves', () => {
    expect(ModelFactory.createList('slot', horarios, ['slots', 'disponibles'])).toEqual([
      { time: '09:00', available: false, reason: 'Horario pasado' },
      { time: '09:40', available: true, reason: undefined },
      { time: '10:20', available: false, reason: 'Horario reservado' },
      { time: '11:00', available: true, reason: undefined },
    ]);
    expect(ModelFactory.createList('slot', { disponibles: horarios.disponibles }, ['slots', 'disponibles'])).toHaveLength(2);
  });

  it('recorta horas con segundos y descarta horarios sin hora', () => {
    expect(ModelFactory.createList('slot', [{ hora_inicio: '13:20:00' }, { motivo: 'sin hora' }], [])).toEqual([
      { time: '13:20', available: true, reason: undefined },
    ]);
  });

  it('devuelve lista vacia si la respuesta no trae la lista esperada', () => {
    expect(ModelFactory.createList('service', { mensaje: 'sin datos' }, ['servicios'])).toEqual([]);
  });
});

describe('ModelFactory.createUser', () => {
  it('usa el correo de respaldo y nombre por defecto cuando la API no los envia', () => {
    expect(ModelFactory.createUser({ telefono: '7711234567' }, 'admin@carlyn.mx')).toEqual({
      name: 'Cliente Carlyn',
      email: 'admin@carlyn.mx',
      phone: '7711234567',
    });
  });
});
