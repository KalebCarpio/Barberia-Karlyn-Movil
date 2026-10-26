// Caja blanca, ViewModel. CAT-01 (#53): carga del catalogo, filtro y estados de error.
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { FALLBACK_SERVICES, useCatalogViewModel } from '../../../src/presentation/viewmodels/useCatalogViewModel';
import { fakeCatalog, services } from './fakes';

// El repositorio se crea fuera del hook: los ViewModels esperan dependencias estables entre renders.
describe('useCatalogViewModel', () => {
  it('carga los servicios del repositorio y sus categorias', async () => {
    const catalog = fakeCatalog();
    const { result } = await renderHook(() => useCatalogViewModel(catalog));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(catalog.getServices).toHaveBeenCalledTimes(1);
    expect(result.current.services).toEqual(services);
    expect(result.current.categories).toEqual(['Todos', 'Paquetes', 'Cortes']);
    expect(result.current.message).toBeNull();
  });

  it('filtra al seleccionar una categoria', async () => {
    const catalog = fakeCatalog();
    const { result } = await renderHook(() => useCatalogViewModel(catalog));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => result.current.setSelectedCategory('Cortes'));
    expect(result.current.filteredServices.map((service) => service.id)).toEqual([12]);
  });

  it('muestra servicios de ejemplo y el error si la API falla', async () => {
    const catalog = fakeCatalog({ getServices: jest.fn().mockRejectedValue(new Error('Network request failed')) });
    const { result } = await renderHook(() => useCatalogViewModel(catalog));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.services).toEqual(FALLBACK_SERVICES);
    expect(result.current.message).toBe('Network request failed');
  });

  it('avisa cuando el catalogo llega vacio', async () => {
    const catalog = fakeCatalog({ getServices: jest.fn().mockResolvedValue([]) });
    const { result } = await renderHook(() => useCatalogViewModel(catalog));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.message).toBe('El catalogo no contiene servicios disponibles.');
  });
});
