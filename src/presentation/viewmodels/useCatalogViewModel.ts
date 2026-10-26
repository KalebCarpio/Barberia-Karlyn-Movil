// CAT-01 (#53): catalogo de servicios con filtro por categoria.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { repositories } from '../../data/repositories';
import { CatalogRepository } from '../../data/repositories/CatalogRepository';
import { ALL_CATEGORIES, filterByCategory, serviceCategories } from '../../domain/catalog';
import { Service } from '../../domain/models';
import { errorMessage } from './types';

// Se muestran si la API no responde, junto con un aviso, para que la pantalla no quede vacia.
export const FALLBACK_SERVICES: Service[] = [
  { id: 1, name: 'Corte clasico', category: 'Cortes', description: 'Corte personalizado y acabado profesional.', price: 180, duration: 45 },
  { id: 2, name: 'Corte y barba', category: 'Cortes', description: 'Servicio completo para una imagen impecable.', price: 300, duration: 75 },
  { id: 3, name: 'Barba premium', category: 'Barba', description: 'Perfilado con toalla caliente y productos premium.', price: 140, duration: 30 },
];

export function useCatalogViewModel(catalog: CatalogRepository = repositories.catalog) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const loaded = await catalog.getServices();
      if (!loaded.length) throw new Error('El catalogo no contiene servicios disponibles.');
      setServices(loaded);
      setMessage(null);
    } catch (error) {
      setServices(FALLBACK_SERVICES);
      setMessage(errorMessage(error, 'No fue posible cargar los servicios.'));
    } finally {
      setLoading(false);
    }
  }, [catalog]);

  useEffect(() => { void load(); }, [load]);

  const categories = useMemo(() => serviceCategories(services), [services]);
  const filteredServices = useMemo(() => filterByCategory(services, selectedCategory), [services, selectedCategory]);

  return { services, loading, message, categories, selectedCategory, setSelectedCategory, filteredServices, reload: load };
}

export type CatalogViewModel = ReturnType<typeof useCatalogViewModel>;
