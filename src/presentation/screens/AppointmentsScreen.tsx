import { Alert, Pressable, Text, View } from 'react-native';
import { displayDate } from '../../domain/availability';
import { Appointment } from '../../domain/models';
import { Empty, Header, Loading, money, Summary } from '../components/ui';
import { styles } from '../theme/styles';
import { AppointmentsViewModel } from '../viewmodels/useAppointmentsViewModel';

type Props = {
  vm: AppointmentsViewModel;
  onReschedule: (appointment: Appointment) => void;
  onBookAnother: () => void;
};

export function AppointmentsScreen({ vm, onReschedule, onBookAnother }: Props) {
  const confirmCancel = (appointment: Appointment) => {
    Alert.alert('Cancelar cita', `Deseas cancelar ${appointment.service.name}?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Si, cancelar', style: 'destructive', onPress: async () => {
          const result = await vm.cancel(appointment);
          Alert.alert(result.title, result.message);
        },
      },
    ]);
  };

  return (
    <>
      <Header eyebrow="MI AGENDA" title="Mis citas" />
      {vm.loading ? <Loading label="Cargando tus citas..." /> : vm.appointments.length === 0 ? <Empty label="Aun no tienes citas registradas." /> : vm.appointments.map((appointment) => <View key={appointment.id} style={styles.appointmentCard}>
        <View style={styles.appointmentHead}><Text style={[styles.status, !appointment.canManage && styles.statusMuted]}>{appointment.status.toUpperCase()}</Text><Text style={styles.price}>{money(appointment.service.price)}</Text></View>
        <Text style={styles.appointmentName}>{appointment.service.name}</Text>
        <Text style={styles.helperText}>Con {appointment.barber}</Text>
        <View style={styles.rule} />
        <Summary label="Fecha" value={displayDate(appointment.date)} />
        <Summary label="Hora" value={`${appointment.time} · ${appointment.service.duration} min`} />
        {appointment.canManage ? <View style={styles.buttonRow}><Pressable style={styles.rebookButton} onPress={() => onReschedule(appointment)}><Text style={styles.rebookText}>Reagendar</Text></Pressable><Pressable style={styles.cancelButton} onPress={() => confirmCancel(appointment)}><Text style={styles.cancelText}>Cancelar</Text></Pressable></View> : null}
      </View>)}
      <Pressable style={styles.addVisit} onPress={onBookAnother}><Text style={styles.addVisitText}>Reservar otra visita</Text><Text style={styles.plus}>＋</Text></Pressable>
    </>
  );
}
