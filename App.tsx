import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { BackHandler, ScrollView } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Appointment, Service } from './src/domain/models';
import { BottomNav } from './src/presentation/components/BottomNav';
import { LoadingOverlay } from './src/presentation/components/FeedbackDialog';
import { SplashLoader } from './src/presentation/components/Loaders';
import { DialogProvider, useDialog } from './src/presentation/feedback/DialogProvider';
import { AppScreen, AuthScreen } from './src/presentation/navigation';
import { AppointmentsScreen } from './src/presentation/screens/AppointmentsScreen';
import { BookingScreen } from './src/presentation/screens/BookingScreen';
import { HomeScreen } from './src/presentation/screens/HomeScreen';
import { LoginScreen } from './src/presentation/screens/LoginScreen';
import { ProfileScreen } from './src/presentation/screens/ProfileScreen';
import { RecoveryScreen } from './src/presentation/screens/RecoveryScreen';
import { RegisterScreen } from './src/presentation/screens/RegisterScreen';
import { ServicesScreen } from './src/presentation/screens/ServicesScreen';
import { styles } from './src/presentation/theme/styles';
import { useAppointmentsViewModel } from './src/presentation/viewmodels/useAppointmentsViewModel';
import { useBookingViewModel } from './src/presentation/viewmodels/useBookingViewModel';
import { useCatalogViewModel } from './src/presentation/viewmodels/useCatalogViewModel';
import { useRecoveryViewModel } from './src/presentation/viewmodels/useRecoveryViewModel';
import { useRegisterViewModel } from './src/presentation/viewmodels/useRegisterViewModel';
import { useSessionViewModel } from './src/presentation/viewmodels/useSessionViewModel';

export default function App() {
  return (
    <SafeAreaProvider>
      <DialogProvider>
        <StatusBar style="dark" />
        <CarlynApp />
      </DialogProvider>
    </SafeAreaProvider>
  );
}

// Crea los ViewModels, decide la pantalla y conecta la navegacion entre ellas.
function CarlynApp() {
  const [screen, setScreen] = useState<AppScreen>('home');
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  const dialog = useDialog();
  const session = useSessionViewModel();
  const catalog = useCatalogViewModel();
  const appointments = useAppointmentsViewModel(session.token);
  const booking = useBookingViewModel(screen === 'booking', session.token);
  const register = useRegisterViewModel();
  const recovery = useRecoveryViewModel();

  useEffect(() => {
    if (session.status === 'signedIn') setScreen('home');
    if (session.status === 'signedOut') setAuthScreen('login');
  }, [session.status]);

  // El boton atras de Android regresa al login desde registro o recuperacion.
  useEffect(() => {
    if (session.status !== 'signedOut' || authScreen === 'login') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setAuthScreen('login');
      return true;
    });
    return () => subscription.remove();
  }, [session.status, authScreen]);

  const returnToLogin = (email: string) => {
    session.setEmail(email);
    session.setPassword('');
    setAuthScreen('login');
  };

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
    await dialog.notify(result);
  };

  if (session.status === 'checking') return <SplashLoader />;

  if (session.status === 'signedOut') {
    if (authScreen === 'register') return <RegisterScreen vm={register} onBack={() => setAuthScreen('login')} onRegistered={returnToLogin} />;
    if (authScreen === 'recovery') return <RecoveryScreen vm={recovery} onBack={() => setAuthScreen('login')} onRecovered={returnToLogin} />;
    return (
      <LoginScreen
        vm={session}
        onCreateAccount={() => setAuthScreen('register')}
        onForgotPassword={() => {
          recovery.start(session.email.trim());
          setAuthScreen('recovery');
        }}
      />
    );
  }

  let view = <HomeScreen name={session.name} catalog={catalog} appointments={appointments} onShowServices={() => setScreen('services')} onBook={beginBooking} />;
  if (screen === 'services') view = <ServicesScreen vm={catalog} onBook={beginBooking} />;
  if (screen === 'booking') view = <BookingScreen vm={booking} onConfirm={confirmBooking} />;
  if (screen === 'appointments') view = <AppointmentsScreen vm={appointments} onReschedule={(appointment) => beginBooking(appointment.service, appointment)} onBookAnother={() => setScreen('services')} />;
  if (screen === 'profile') view = <ProfileScreen vm={session} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.page}>{view}</ScrollView>
      <BottomNav current={screen} onNavigate={setScreen} />
      <LoadingOverlay visible={booking.saving} label={booking.editingAppointment ? 'Guardando el nuevo horario...' : 'Reservando tu cita...'} />
    </SafeAreaView>
  );
}
