import { Pressable, Text, View } from 'react-native';
import { displayDate } from '../../domain/availability';
import { Appointment } from '../../domain/models';
import { SkeletonList } from '../components/Loaders';
import { Empty, Header, money, Summary } from '../components/ui';
import { useDialog } from '../feedback/DialogProvider';
import { styles } from '../theme/styles';
import { AppointmentsViewModel } from '../viewmodels/useAppointmentsViewModel';

type Props = {
  vm: AppointmentsViewModel;
  onReschedule: (appointment: Appointment) => void;
  onBookAnother: () => void;
};

export function AppointmentsScreen({ vm, onReschedule, onBookAnother }: Props) {
  const dialog = useDialog();

  const confirmCancel = async (appointment: Appointment) => {
    const accepted = await dialog.confirm({
      title: '¿Cancelar esta cita?',
      message: 'Se liberara el horario y no podras recuperarla.',
      details: [
        { label: 'Servicio', value: appointment.service.name },
        { label: 'Fecha', value: displayDate(appointment.date) },
        { label: 'Hora', value: appointment.time },
      ],
      confirmLabel: 'Si, cancelar cita',
      cancelLabel: 'No, conservarla',
      destructive: true,
    });
    if (!accepted) return;
    await dialog.notify(await vm.cancel(appointment));
  };

  return (
    <>
      <Header eyebrow="MI AGENDA" title="Mis citas" />
      {vm.loading ? <SkeletonList count={2} variant="appointment" /> : vm.appointments.length === 0 ? <Empty label="Aun no tienes citas registradas." /> : vm.appointments.map((appointment) => <View key={appointment.id} style={styles.appointmentCard}>
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
