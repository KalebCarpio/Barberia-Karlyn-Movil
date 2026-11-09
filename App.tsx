import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { BackHandler, ScrollView } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { enableCertificatePinning, onPinningError } from './src/core/security/certificatePinning';
import { Appointment, Service } from './src/domain/models';
import { BottomNav } from './src/presentation/components/BottomNav';
import { LoadingOverlay } from './src/presentation/components/FeedbackDialog';
import { SplashLoader } from './src/presentation/components/Loaders';
import { askReminderPermission } from './src/presentation/feedback/askReminderPermission';
import { DialogProvider, useDialog } from './src/presentation/feedback/DialogProvider';
import { AppScreen, AuthScreen } from './src/presentation/navigation';
import { AppointmentsScreen } from './src/presentation/screens/AppointmentsScreen';
import { BookingScreen } from './src/presentation/screens/BookingScreen';
import { HomeScreen } from './src/presentation/screens/HomeScreen';
import { LoginScreen } from './src/presentation/screens/LoginScreen';
import { ConsentScreen } from './src/presentation/screens/ConsentScreen';
import { PrivacyScreen } from './src/presentation/screens/PrivacyScreen';
import { ProfileScreen } from './src/presentation/screens/ProfileScreen';
import { RecoveryScreen } from './src/presentation/screens/RecoveryScreen';
import { RegisterScreen } from './src/presentation/screens/RegisterScreen';
import { ServicesScreen } from './src/presentation/screens/ServicesScreen';
import { styles } from './src/presentation/theme/styles';
import { useAppointmentsViewModel } from './src/presentation/viewmodels/useAppointmentsViewModel';
import { useBookingViewModel } from './src/presentation/viewmodels/useBookingViewModel';
import { useCatalogViewModel } from './src/presentation/viewmodels/useCatalogViewModel';
import { usePrivacyViewModel } from './src/presentation/viewmodels/usePrivacyViewModel';
import { useRecoveryViewModel } from './src/presentation/viewmodels/useRecoveryViewModel';
import { useRegisterViewModel } from './src/presentation/viewmodels/useRegisterViewModel';
import { useRemindersViewModel } from './src/presentation/viewmodels/useRemindersViewModel';
import { useSessionViewModel } from './src/presentation/viewmodels/useSessionViewModel';

export default function App() {
  // El Certificate Pinning se activa antes de montar la app, para que ninguna peticion salga sin el.
  const [secured, setSecured] = useState(false);

  useEffect(() => {
    enableCertificatePinning()
      .catch((error) => console.warn('No fue posible activar el Certificate Pinning:', error))
      .finally(() => setSecured(true));
  }, []);

  return (
    <SafeAreaProvider>
      <DialogProvider>
        <StatusBar style="dark" />
        {secured ? <CarlynApp /> : <SplashLoader />}
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
  const privacy = usePrivacyViewModel(session.token, session.signOut);
  const reminders = useRemindersViewModel(appointments.appointments, privacy.settings?.reminders ?? false);

  // Si el servidor no presenta una llave fijada, la conexion se bloquea y se avisa al usuario.
  useEffect(() => onPinningError(() => {
    void dialog.notify({ ok: false, title: 'Conexion no segura', message: 'No pudimos verificar la identidad del servidor de Carlyn. Revisa tu red Wi-Fi e intenta de nuevo.' });
  }), [dialog]);

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
    if (result.ok && reminders.shouldOffer) await askReminderPermission(reminders, dialog);
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

  // Cuentas que aun no aceptan el aviso de privacidad (creadas antes de este cambio).
  if (privacy.needsConsent) return <ConsentScreen vm={privacy} onSignOut={() => void session.signOut()} />;

  let view = <HomeScreen name={session.name} catalog={catalog} appointments={appointments} onShowServices={() => setScreen('services')} onBook={beginBooking} />;
  if (screen === 'services') view = <ServicesScreen vm={catalog} onBook={beginBooking} />;
  if (screen === 'booking') view = <BookingScreen vm={booking} onConfirm={confirmBooking} />;
  if (screen === 'appointments') view = <AppointmentsScreen vm={appointments} onReschedule={(appointment) => beginBooking(appointment.service, appointment)} onBookAnother={() => setScreen('services')} />;
  if (screen === 'profile') view = <ProfileScreen vm={session} onOpenPrivacy={() => setScreen('privacy')} />;
  if (screen === 'privacy') view = <PrivacyScreen vm={privacy} onRemindersEnabled={() => askReminderPermission(reminders, dialog)} profile={{ name: session.name, email: session.email, phone: session.phone }} appointmentCount={appointments.appointments.length} onEditProfile={() => setScreen('profile')} onBack={() => setScreen('profile')} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.page}>{view}</ScrollView>
      <BottomNav current={screen === 'privacy' ? 'profile' : screen} onNavigate={setScreen} />
      <LoadingOverlay visible={booking.saving} label={booking.editingAppointment ? 'Guardando el nuevo horario...' : 'Reservando tu cita...'} />
    </SafeAreaView>
  );
}
