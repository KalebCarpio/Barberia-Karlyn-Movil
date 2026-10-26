// Pruebas unitarias de CAT-01 (#53) y CAT-02 (#54): transformacion de datos del catalogo sin red.
import servicios from '../fixtures/servicios-activos.json';
import locales from '../fixtures/locales.json';
import barberos from '../fixtures/barberos-local-1.json';
import {
  ALL_CATEGORIES,
  filterByCategory,
  mapBarber,
  mapBranch,
  mapService,
  serviceCategories,
} from '../../src/catalog';

describe('CAT-01 servicios', () => {
  const services = servicios.servicios.map(mapService).filter((service) => service.id);

  it('convierte precio en texto a numero y conserva duracion e imagen', () => {
    expect(services[0]).toEqual({
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
    const barba = services.find((service) => service.id === 13);
    expect(barba?.description).toBe('Servicio profesional de Barberia Carlyn.');
    expect(barba?.duration).toBe(30);
    expect(barba?.imageUrl).toBeUndefined();
  });

  it('descarta registros sin id', () => {
    expect(services.map((service) => service.id)).toEqual([11, 12, 13]);
  });

  it('genera categorias unicas con la opcion Todos al inicio', () => {
    expect(serviceCategories(services)).toEqual([ALL_CATEGORIES, 'Paquetes', 'Cortes', 'Barba']);
  });

  it('filtra por categoria y devuelve todo con Todos', () => {
    expect(filterByCategory(services, 'Cortes').map((service) => service.id)).toEqual([12]);
    expect(filterByCategory(services, ALL_CATEGORIES)).toHaveLength(3);
    expect(filterByCategory(services, 'Inexistente')).toEqual([]);
  });
});

describe('CAT-01 sucursales', () => {
  it('mapea nombre y direccion, con texto por defecto si no hay direccion', () => {
    expect(locales.data.map(mapBranch)).toEqual([
      { id: 1, name: 'Barberia Carlyn', detail: 'Adolfo Lopez Mateos 33, Aviacion Civil' },
      { id: 2, name: 'Barberia Carlyn Sucursal 2', detail: 'Ubicacion disponible' },
    ]);
  });
});

describe('CAT-02 barberos', () => {
  it('usa barbero_id como id y especialidad por defecto si viene nula', () => {
    expect(barberos.data.map(mapBarber)).toEqual([
      { id: 34, name: 'Carlos Mendez', specialty: 'Corte clasico y barba' },
      { id: 35, name: 'Luis Hernandez', specialty: 'Degradados y diseno' },
      { id: 36, name: 'Diego Martinez', specialty: 'Especialista Carlyn' },
    ]);
  });
});
