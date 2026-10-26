import { Pressable, Text, View } from 'react-native';
import { Service } from '../../domain/models';
import { ServiceCard } from '../components/ServiceCard';
import { Header, Loading, Stat } from '../components/ui';
import { styles } from '../theme/styles';
import { AppointmentsViewModel } from '../viewmodels/useAppointmentsViewModel';
import { CatalogViewModel } from '../viewmodels/useCatalogViewModel';

type Props = {
  name: string;
  catalog: CatalogViewModel;
  appointments: AppointmentsViewModel;
  onShowServices: () => void;
  onBook: (service: Service) => void;
};

export function HomeScreen({ name, catalog, appointments, onShowServices, onBook }: Props) {
  return (
    <>
      <Header eyebrow="ESTILO QUE HABLA POR TI" title={`Hola${name ? `, ${name.split(' ')[0]}` : ''}`} />
      <View style={styles.hero}>
        <Text style={styles.heroKicker}>RESERVA EN LINEA</Text>
        <Text style={styles.heroTitle}>Tu mejor version comienza aqui.</Text>
        <Text style={styles.heroCopy}>Reserva con barberos profesionales sin llamadas ni esperas.</Text>
        <Pressable style={styles.goldButtonSmall} onPress={onShowServices}><Text style={styles.goldButtonText}>Ver servicios</Text></Pressable>
      </View>
      <View style={styles.stats}>
        <Stat label="Servicios" value={catalog.loading ? '...' : `${catalog.services.length}+`} />
        <Stat label="Tus citas" value={appointments.loading ? '...' : String(appointments.activeCount)} />
      </View>
      <View style={styles.sectionLine}><Text style={styles.sectionTitle}>Mas solicitados</Text><Pressable onPress={onShowServices}><Text style={styles.link}>Ver todos</Text></Pressable></View>
      {catalog.loading ? <Loading label="Cargando servicios..." /> : catalog.services.slice(0, 3).map((service) => <ServiceCard key={service.id} service={service} onPress={() => onBook(service)} />)}
      {catalog.message ? <Text style={styles.warning}>Mostrando servicios de ejemplo: {catalog.message}</Text> : null}
    </>
  );
}
