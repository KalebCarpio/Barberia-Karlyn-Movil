// Caja blanca, dominio. CAT-01 (#53): reglas del catalogo sin red.
import servicios from '../../fixtures/servicios-activos.json';
import { ModelFactory } from '../../../src/data/factories/ModelFactory';
import { ALL_CATEGORIES, filterByCategory, serviceCategories } from '../../../src/domain/catalog';

const services = ModelFactory.createList('service', servicios, ['servicios']);

describe('CAT-01 reglas del catalogo', () => {
  it('genera categorias unicas con la opcion Todos al inicio', () => {
    expect(serviceCategories(services)).toEqual([ALL_CATEGORIES, 'Paquetes', 'Cortes', 'Barba']);
  });

  it('filtra por categoria y devuelve todo con Todos', () => {
    expect(filterByCategory(services, 'Cortes').map((service) => service.id)).toEqual([12]);
    expect(filterByCategory(services, ALL_CATEGORIES)).toHaveLength(3);
    expect(filterByCategory(services, 'Inexistente')).toEqual([]);
  });

  it('devuelve solo Todos cuando no hay servicios', () => {
    expect(serviceCategories([])).toEqual([ALL_CATEGORIES]);
  });
});
