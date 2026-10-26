import { Pressable, ScrollView, Text } from 'react-native';
import { Service } from '../../domain/models';
import { ServiceCard } from '../components/ServiceCard';
import { Empty, Header, Loading } from '../components/ui';
import { styles } from '../theme/styles';
import { CatalogViewModel } from '../viewmodels/useCatalogViewModel';

export function ServicesScreen({ vm, onBook }: { vm: CatalogViewModel; onBook: (service: Service) => void }) {
  return (
    <>
      <Header eyebrow="CATALOGO" title="Encuentra tu estilo" />
      <Text style={styles.subtitle}>Elige el servicio ideal para tu proxima visita.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {vm.categories.map((category) => <Pressable key={category} onPress={() => vm.setSelectedCategory(category)} style={[styles.chip, vm.selectedCategory === category && styles.chipSelected]}><Text style={[styles.chipText, vm.selectedCategory === category && styles.chipTextSelected]}>{category}</Text></Pressable>)}
      </ScrollView>
      {vm.loading ? <Loading label="Cargando catalogo..." /> : vm.filteredServices.map((service) => <ServiceCard key={service.id} service={service} onPress={() => onBook(service)} />)}
      {!vm.loading && vm.filteredServices.length === 0 ? <Empty label="No hay servicios para esta categoria." /> : null}
    </>
  );
}
