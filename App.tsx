import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, Text } from 'react-native';
import { Appointment, Service } from './src/domain/models';
import { BottomNav } from './src/presentation/components/BottomNav';
import { AppScreen } from './src/presentation/navigation';
import { AppointmentsScreen } from './src/presentation/screens/AppointmentsScreen';
import { BookingScreen } from './src/presentation/screens/BookingScreen';
import { HomeScreen } from './src/presentation/screens/HomeScreen';
import { LoginScreen } from './src/presentation/screens/LoginScreen';
import { ProfileScreen } from './src/presentation/screens/ProfileScreen';
import { ServicesScreen } from './src/presentation/screens/ServicesScreen';
import { colors, styles } from './src/presentation/theme/styles';
import { useAppointmentsViewModel } from './src/presentation/viewmodels/useAppointmentsViewModel';
import { useBookingViewModel } from './src/presentation/viewmodels/useBookingViewModel';
import { useCatalogViewModel } from './src/presentation/viewmodels/useCatalogViewModel';
import { useSessionViewModel } from './src/presentation/viewmodels/useSessionViewModel';

// Raiz de la app: crea los ViewModels, decide la pantalla y conecta la navegacion entre ellas.
export default function App() {
  const [screen, setScreen] = useState<AppScreen>('home');
  const session = useSessionViewModel();
  const catalog = useCatalogViewModel();
  const appointments = useAppointmentsViewModel(session.token);
  const booking = useBookingViewModel(screen === 'booking', session.token);

  useEffect(() => {
    if (session.status === 'signedIn') setScreen('home');
  }, [session.status]);

  const beginBooking = (service: Service, appointment?: Appointment) => {
    booking.start(service, appointment);
    setScreen('booking');
  };

  const confirmBooking = async () => {
    const result = await booking.confirm();
    if (result.ok) {
      await appointments.reload();
      setScreen('appointments');
    }
    Alert.alert(result.title, result.message);
  };

  if (session.status === 'checking') return <SafeAreaView style={styles.center}><StatusBar style="dark" /><ActivityIndicator color={colors.gold} size="large" /><Text style={styles.loadingText}>Preparando Carlyn</Text></SafeAreaView>;

  if (session.status === 'signedOut') return <LoginScreen vm={session} />;

  let view = <HomeScreen name={session.name} catalog={catalog} appointments={appointments} onShowServices={() => setScreen('services')} onBook={beginBooking} />;
  if (screen === 'services') view = <ServicesScreen vm={catalog} onBook={beginBooking} />;
  if (screen === 'booking') view = <BookingScreen vm={booking} onConfirm={confirmBooking} />;
  if (screen === 'appointments') view = <AppointmentsScreen vm={appointments} onReschedule={(appointment) => beginBooking(appointment.service, appointment)} onBookAnother={() => setScreen('services')} />;
  if (screen === 'profile') view = <ProfileScreen vm={session} />;

  return <SafeAreaView style={styles.safe}><StatusBar style="dark" /><ScrollView contentContainerStyle={styles.page}>{view}</ScrollView><BottomNav current={screen} onNavigate={setScreen} /></SafeAreaView>;
}
