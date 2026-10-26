import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { apiRequest } from './src/api';
import {
  bookingDates,
  dateKey,
  displayDate,
  fetchSlots,
  fetchUnavailableDates,
  hasAvailableSlot,
  Slot,
} from './src/availability';
import {
  Barber,
  Branch,
  fetchBarbersByBranch,
  fetchBranches,
  fetchServices,
  filterByCategory,
  mapService,
  Service,
  serviceCategories,
} from './src/catalog';
import { ApiRecord, pick, records, toNumber } from './src/records';
import { clearSession, readSession, saveSession } from './src/session';

type Screen = 'loading' | 'login' | 'home' | 'services' | 'booking' | 'appointments' | 'profile';
type Appointment = {
  id: number;
  service: Service;
  date: string;
  time: string;
  barber: string;
  barberId?: number;
  branchId?: number;
  status: string;
  canManage: boolean;
};

const colors = {
  ink: '#181818',
  inkSoft: '#242424',
  canvas: '#F8F6F1',
  paper: '#FFFFFF',
  gold: '#C68F00',
  goldPale: '#FFF1C6',
  red: '#B82435',
  green: '#167447',
  muted: '#657080',
  subtle: '#8B847A',
  border: '#E4DED4',
  busy: '#EEEAE3',
} as const;

const brandLogo = require('./assets/logo-carlyn.png');

const demoServices: Service[] = [
  { id: 1, name: 'Corte clasico', category: 'Cortes', description: 'Corte personalizado y acabado profesional.', price: 180, duration: 45 },
  { id: 2, name: 'Corte y barba', category: 'Cortes', description: 'Servicio completo para una imagen impecable.', price: 300, duration: 75 },
  { id: 3, name: 'Barba premium', category: 'Barba', description: 'Perfilado con toalla caliente y productos premium.', price: 140, duration: 30 },
];


function mapAppointment(item: ApiRecord): Appointment {
  const service = mapService({
    id: pick(item, 'servicio_id', 'service_id'),
    nombre: pick(item, 'servicio_nombre', 'service_name', 'nombre_servicio'),
    categoria: pick(item, 'servicio_categoria', 'categoria_servicio', 'category'),
    precio: pick(item, 'servicio_precio', 'precio_servicio', 'price'),
    duracion: pick(item, 'servicio_duracion', 'duracion_minutos', 'duration'),
    imagen_url: pick(item, 'servicio_imagen_url', 'imagen_url', 'image_url'),
  });
  const status = String(pick(item, 'estado_nombre', 'status_name', 'estado', 'status') || 'Confirmada');
  const normalized = status.toLowerCase();

  return {
    id: toNumber(pick(item, 'id', 'cita_id', 'appointment_id')),
    service,
    date: String(pick(item, 'fecha', 'appointment_date', 'date') || ''),
    time: String(pick(item, 'hora_inicio', 'start_time', 'hora') || '').slice(0, 5),
    barber: String(pick(item, 'barbero_nombre', 'barber_name', 'nombre_barbero') || 'Barbero asignado'),
    barberId: toNumber(pick(item, 'barbero_id', 'barber_id')) || undefined,
    branchId: toNumber(pick(item, 'local_id', 'branch_id', 'sucursal_id')) || undefined,
    status,
    canManage: !/(cancel|complet|finaliz|no.?show|ausen)/.test(normalized),
  };
}


export default function App() {
  const [screen, setScreen] = useState<Screen>('loading');
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [catalogMessage, setCatalogMessage] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedService, setSelectedService] = useState<Service>(demoServices[0]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [selectedBarberId, setSelectedBarberId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date()));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [bookingMessage, setBookingMessage] = useState('Elige sucursal, barbero, fecha y horario.');
  const [loadingBookingData, setLoadingBookingData] = useState(false);
  const [savingBooking, setSavingBooking] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const categories = useMemo(() => serviceCategories(services), [services]);
  const filteredServices = useMemo(() => filterByCategory(services, selectedCategory), [services, selectedCategory]);
  const dates = useMemo(() => bookingDates(unavailableDates), [unavailableDates]);
  const currentBranch = branches.find((branch) => branch.id === selectedBranchId);
  const currentBarber = barbers.find((barber) => barber.id === selectedBarberId);

  const loadCatalog = async () => {
    setLoadingCatalog(true);
    try {
      const loaded = await fetchServices();
      if (!loaded.length) throw new Error('El catalogo no contiene servicios disponibles.');
      setServices(loaded);
      setSelectedService((current) => loaded.find((service) => service.id === current.id) || loaded[0]);
      setCatalogMessage(null);
    } catch (error) {
      setServices(demoServices);
      setCatalogMessage(error instanceof Error ? error.message : 'No fue posible cargar los servicios.');
    } finally {
      setLoadingCatalog(false);
    }
  };

  const loadAppointments = async (authToken: string) => {
    setLoadingAppointments(true);
    try {
      const response = await apiRequest<unknown>('/citas', { token: authToken });
      setAppointments(records(response, ['data', 'citas', 'appointments']).map(mapAppointment).filter((appointment) => appointment.id));
    } catch (error) {
      console.warn('No fue posible cargar las citas:', error);
      setAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  };

  useEffect(() => { void loadCatalog(); }, []);

  useEffect(() => {
    const restoreSession = async () => {
      const session = await readSession();
      if (!session) {
        setScreen('login');
        return;
      }
      try {
        const response = await apiRequest<ApiRecord>('/auth/profile', { token: session.token });
        const user = (response.user || response.data || response) as ApiRecord;
        setToken(session.token);
        setEmail(String(pick(user, 'correo_electronico', 'email') || session.email));
        setName(String(pick(user, 'nombre', 'full_name', 'name') || 'Cliente Carlyn'));
        setPhone(String(pick(user, 'telefono', 'phone') || ''));
        await loadAppointments(session.token);
        setScreen('home');
      } catch {
        await clearSession();
        setScreen('login');
      }
    };
    void restoreSession();
  }, []);

  useEffect(() => {
    if (screen !== 'booking') return;
    const loadBranches = async () => {
      try {
        const loaded = await fetchBranches();
        setBranches(loaded);
        setSelectedBranchId((current) => current && loaded.some((branch) => branch.id === current) ? current : loaded[0]?.id || null);
        if (!loaded.length) setBookingMessage('No hay sucursales disponibles para reservar.');
      } catch (error) {
        setBookingMessage(error instanceof Error ? error.message : 'No fue posible cargar las sucursales.');
      }
    };
    void loadBranches();
  }, [screen]);

  useEffect(() => {
    if (screen !== 'booking' || !selectedBranchId) return;
    const loadBarbers = async () => {
      setLoadingBookingData(true);
      try {
        const loaded = await fetchBarbersByBranch(selectedBranchId);
        setBarbers(loaded);
        setSelectedBarberId((current) => current && loaded.some((barber) => barber.id === current) ? current : loaded[0]?.id || null);
        if (!loaded.length) setBookingMessage('Esta sucursal aun no tiene barberos disponibles.');
      } catch (error) {
        setBarbers([]);
        setBookingMessage(error instanceof Error ? error.message : 'No fue posible cargar los barberos.');
      } finally {
        setLoadingBookingData(false);
      }
    };
    void loadBarbers();
  }, [screen, selectedBranchId]);

  useEffect(() => {
    if (screen !== 'booking' || !selectedBarberId || !selectedDate) return;
    const loadSlots = async () => {
      setLoadingBookingData(true);
      setSelectedTime(null);
      try {
        const loaded = await fetchSlots(selectedBarberId, selectedDate, token);
        setSlots(loaded);
        setBookingMessage(hasAvailableSlot(loaded) ? 'Selecciona un horario disponible.' : 'No hay horarios libres para este dia.');
      } catch (error) {
        setSlots([]);
        setBookingMessage(error instanceof Error ? error.message : 'No fue posible consultar los horarios.');
      } finally {
        setLoadingBookingData(false);
      }
    };
    void loadSlots();
  }, [screen, selectedBarberId, selectedDate, token]);

  useEffect(() => {
    if (screen !== 'booking' || !selectedBarberId) return;
    // Si falla la consulta de fechas se dejan todas habilitadas y la API valida al consultar horarios.
    fetchUnavailableDates(selectedBarberId, token)
      .then(setUnavailableDates)
      .catch(() => setUnavailableDates([]));
  }, [screen, selectedBarberId, token]);

  const signIn = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Faltan datos', 'Escribe tu correo y contrasena para continuar.');
      return;
    }
    setLoadingLogin(true);
    try {
      const response = await apiRequest<ApiRecord>('/auth/login', {
        method: 'POST',
        body: { correoElectronico: email.trim(), contrasena: password },
      });
      const newToken = String(response.token || '');
      if (!newToken) throw new Error('El servidor no devolvio una sesion valida.');
      const user = (response.user || {}) as ApiRecord;
      setToken(newToken);
      setName(String(pick(user, 'nombre', 'full_name', 'name') || 'Cliente Carlyn'));
      setPhone(String(pick(user, 'telefono', 'phone') || ''));
      await saveSession({ token: newToken, email: email.trim() });
      await loadAppointments(newToken);
      setPassword('');
      setScreen('home');
    } catch (error) {
      Alert.alert('No fue posible iniciar sesion', error instanceof Error ? error.message : 'Verifica tus datos e intenta de nuevo.');
    } finally {
      setLoadingLogin(false);
    }
  };

  const beginBooking = (service: Service, appointment?: Appointment) => {
    setSelectedService(service);
    setSelectedBranchId(appointment?.branchId || null);
    setSelectedBarberId(appointment?.barberId || null);
    setSelectedDate(appointment?.date || dateKey(new Date()));
    setSelectedTime(null);
    setEditingAppointment(appointment || null);
    setSlots([]);
    setScreen('booking');
  };

  const confirmBooking = async () => {
    if (!token) {
      setScreen('login');
      return;
    }
    if (!selectedBranchId || !selectedBarberId || !selectedTime) {
      Alert.alert('Completa la reserva', 'Elige sucursal, barbero y un horario disponible.');
      return;
    }
    setSavingBooking(true);
    try {
      if (editingAppointment) {
        await apiRequest(`/citas/${editingAppointment.id}`, {
          method: 'PUT', token,
          body: { fecha: selectedDate, horaInicio: selectedTime, notas: '' },
        });
      } else {
        await apiRequest('/citas', {
          method: 'POST', token,
          body: {
            barberoId: selectedBarberId,
            servicioId: selectedService.id,
            localId: selectedBranchId,
            fecha: selectedDate,
            horaInicio: selectedTime,
            estadoId: Number(process.env.EXPO_PUBLIC_PENDING_APPOINTMENT_STATUS_ID || '1'),
            notas: '',
          },
        });
      }
      await loadAppointments(token);
      Alert.alert(editingAppointment ? 'Cita reprogramada' : 'Cita confirmada', 'Tu cita fue guardada en el sistema de Carlyn.');
      setScreen('appointments');
      setEditingAppointment(null);
    } catch (error) {
      Alert.alert('No fue posible guardar la cita', error instanceof Error ? error.message : 'Intenta nuevamente.');
    } finally {
      setSavingBooking(false);
    }
  };

  const cancelAppointment = (appointment: Appointment) => {
    Alert.alert('Cancelar cita', `Deseas cancelar ${appointment.service.name}?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Si, cancelar', style: 'destructive', onPress: async () => {
          if (!token) return;
          try {
            await apiRequest(`/citas/${appointment.id}`, { method: 'DELETE', token });
            await loadAppointments(token);
            Alert.alert('Cita cancelada', 'La cita se actualizo correctamente.');
          } catch (error) {
            Alert.alert('No fue posible cancelar', error instanceof Error ? error.message : 'Intenta nuevamente.');
          }
        },
      },
    ]);
  };

  const saveProfile = async () => {
    if (!token) return;
    try {
      const response = await apiRequest<ApiRecord>('/auth/profile', {
        method: 'PUT', token,
        body: { nombre: name.trim(), telefono: phone.replace(/\D/g, '') },
      });
      const user = (response.user || response.data || {}) as ApiRecord;
      setName(String(pick(user, 'nombre', 'full_name', 'name') || name));
      setPhone(String(pick(user, 'telefono', 'phone') || phone));
      Alert.alert('Perfil actualizado', 'Tus datos se guardaron correctamente.');
    } catch (error) {
      Alert.alert('No fue posible actualizar', error instanceof Error ? error.message : 'Intenta nuevamente.');
    }
  };

  const signOut = async () => {
    await clearSession();
    setToken(null);
    setAppointments([]);
    setPassword('');
    setScreen('login');
  };

  const header = (eyebrow: string, title: string) => (
    <View style={styles.header}>
      <View style={styles.brandLine}>
        <Image source={brandLogo} style={styles.headerLogo} resizeMode="contain" />
        <Text style={styles.bell}>⌁</Text>
      </View>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.heading}>{title}</Text>
    </View>
  );

  const nav = () => {
    const items = [
      { target: 'home', label: 'Inicio', activeIcon: 'home', inactiveIcon: 'home-outline' },
      { target: 'services', label: 'Servicios', activeIcon: 'construct', inactiveIcon: 'construct-outline' },
      { target: 'appointments', label: 'Mis citas', activeIcon: 'calendar', inactiveIcon: 'calendar-outline' },
      { target: 'profile', label: 'Perfil', activeIcon: 'person', inactiveIcon: 'person-outline' },
    ] as const;

    return (
      <View style={styles.nav}>
        {items.map(({ target, label, activeIcon, inactiveIcon }) => {
          const active = screen === target;

          return (
            <Pressable
              key={target}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: active }}
              onPress={() => setScreen(target)}
              style={({ pressed }) => [
                styles.navItem,
                active && styles.navItemSelected,
                pressed && styles.navItemPressed,
              ]}
            >
              <View style={[styles.navIcon, active && styles.navIconSelected]}>
                <Ionicons
                  name={(active ? activeIcon : inactiveIcon) as keyof typeof Ionicons.glyphMap}
                  size={22}
                  color={active ? colors.gold : colors.subtle}
                />
              </View>
              <Text style={[styles.navText, active && styles.navTextSelected]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const renderHome = () => (
    <>
      {header('ESTILO QUE HABLA POR TI', `Hola${name ? `, ${name.split(' ')[0]}` : ''}`)}
      <View style={styles.hero}>
        <Text style={styles.heroKicker}>RESERVA EN LINEA</Text>
        <Text style={styles.heroTitle}>Tu mejor version comienza aqui.</Text>
        <Text style={styles.heroCopy}>Reserva con barberos profesionales sin llamadas ni esperas.</Text>
        <Pressable style={styles.goldButtonSmall} onPress={() => setScreen('services')}><Text style={styles.goldButtonText}>Ver servicios</Text></Pressable>
      </View>
      <View style={styles.stats}>
        <Stat label="Servicios" value={loadingCatalog ? '...' : `${services.length}+`} />
        <Stat label="Tus citas" value={loadingAppointments ? '...' : String(appointments.filter((item) => item.canManage).length)} />
      </View>
      <View style={styles.sectionLine}><Text style={styles.sectionTitle}>Mas solicitados</Text><Pressable onPress={() => setScreen('services')}><Text style={styles.link}>Ver todos</Text></Pressable></View>
      {loadingCatalog ? <Loading label="Cargando servicios..." /> : services.slice(0, 3).map((service) => <ServiceCard key={service.id} service={service} onPress={() => beginBooking(service)} />)}
      {catalogMessage ? <Text style={styles.warning}>Mostrando servicios de ejemplo: {catalogMessage}</Text> : null}
    </>
  );

  const renderServices = () => (
    <>
      {header('CATALOGO', 'Encuentra tu estilo')}
      <Text style={styles.subtitle}>Elige el servicio ideal para tu proxima visita.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {categories.map((category) => <Pressable key={category} onPress={() => setSelectedCategory(category)} style={[styles.chip, selectedCategory === category && styles.chipSelected]}><Text style={[styles.chipText, selectedCategory === category && styles.chipTextSelected]}>{category}</Text></Pressable>)}
      </ScrollView>
      {loadingCatalog ? <Loading label="Cargando catalogo..." /> : filteredServices.map((service) => <ServiceCard key={service.id} service={service} onPress={() => beginBooking(service)} />)}
      {!loadingCatalog && filteredServices.length === 0 ? <Empty label="No hay servicios para esta categoria." /> : null}
    </>
  );

  const renderBooking = () => (
    <>
      {header(editingAppointment ? 'REPROGRAMAR CITA' : 'RESERVAR CITA', selectedService.name)}
      <Text style={styles.subtitle}>{selectedService.duration} min · {money(selectedService.price)}</Text>
      <Text style={styles.step}>1. SUCURSAL</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {branches.map((branch) => <Pressable key={branch.id} onPress={() => setSelectedBranchId(branch.id)} style={[styles.optionChip, selectedBranchId === branch.id && styles.optionChipSelected]}><Text style={[styles.optionMain, selectedBranchId === branch.id && styles.optionMainSelected]}>{branch.name}</Text><Text style={[styles.optionSub, selectedBranchId === branch.id && styles.optionSubSelected]} numberOfLines={1}>{branch.detail}</Text></Pressable>)}
      </ScrollView>
      <Text style={styles.step}>2. BARBERO</Text>
      {loadingBookingData && !barbers.length ? <Loading label="Consultando barberos..." /> : <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {barbers.map((barber) => <Pressable key={barber.id} onPress={() => setSelectedBarberId(barber.id)} style={[styles.optionChip, selectedBarberId === barber.id && styles.optionChipSelected]}><Text style={[styles.optionMain, selectedBarberId === barber.id && styles.optionMainSelected]}>{barber.name}</Text><Text style={[styles.optionSub, selectedBarberId === barber.id && styles.optionSubSelected]}>{barber.specialty}</Text></Pressable>)}
      </ScrollView>}
      <Text style={styles.step}>3. ELIGE EL DIA</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateStrip}>
        {dates.map((date) => <Pressable key={date.key} disabled={!date.available} onPress={() => setSelectedDate(date.key)} style={[styles.dateCard, !date.available && styles.dateCardBusy, selectedDate === date.key && styles.dateCardSelected]}><Text style={[styles.dateText, !date.available && styles.slotBusyText, selectedDate === date.key && styles.dateTextSelected]}>{date.label}</Text></Pressable>)}
      </ScrollView>
      <Text style={styles.step}>4. HORARIO DISPONIBLE</Text>
      {loadingBookingData && !slots.length ? <Loading label="Consultando disponibilidad..." /> : <View style={styles.slotGrid}>
        {slots.map((slot) => <Pressable key={slot.time} disabled={!slot.available} onPress={() => setSelectedTime(slot.time)} style={[styles.slot, !slot.available && styles.slotBusy, selectedTime === slot.time && styles.slotSelected]}><Text style={[styles.slotText, !slot.available && styles.slotBusyText, selectedTime === slot.time && styles.slotTextSelected]}>{slot.available ? slot.time : 'Ocupado'}</Text></Pressable>)}
      </View>}
      {!slots.length && !loadingBookingData ? <Empty label={bookingMessage} /> : <Text style={styles.helperText}>{bookingMessage}</Text>}
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Resumen</Text>
        <Summary label="Servicio" value={selectedService.name} />
        <Summary label="Sucursal" value={currentBranch?.name || 'Sin seleccionar'} />
        <Summary label="Barbero" value={currentBarber?.name || 'Sin seleccionar'} />
        <Summary label="Fecha" value={displayDate(selectedDate)} />
        <Summary label="Horario" value={selectedTime || 'Sin seleccionar'} />
      </View>
      <Pressable disabled={savingBooking} onPress={confirmBooking} style={[styles.goldButton, savingBooking && styles.disabled]}>{savingBooking ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.goldButtonText}>{editingAppointment ? 'Guardar nuevo horario' : 'Confirmar cita'}</Text>}</Pressable>
    </>
  );

  const renderAppointments = () => (
    <>
      {header('MI AGENDA', 'Mis citas')}
      {loadingAppointments ? <Loading label="Cargando tus citas..." /> : appointments.length === 0 ? <Empty label="Aun no tienes citas registradas." /> : appointments.map((appointment) => <View key={appointment.id} style={styles.appointmentCard}>
        <View style={styles.appointmentHead}><Text style={[styles.status, !appointment.canManage && styles.statusMuted]}>{appointment.status.toUpperCase()}</Text><Text style={styles.price}>{money(appointment.service.price)}</Text></View>
        <Text style={styles.appointmentName}>{appointment.service.name}</Text>
        <Text style={styles.helperText}>Con {appointment.barber}</Text>
        <View style={styles.rule} />
        <Summary label="Fecha" value={displayDate(appointment.date)} />
        <Summary label="Hora" value={`${appointment.time} · ${appointment.service.duration} min`} />
        {appointment.canManage ? <View style={styles.buttonRow}><Pressable style={styles.rebookButton} onPress={() => beginBooking(appointment.service, appointment)}><Text style={styles.rebookText}>Reagendar</Text></Pressable><Pressable style={styles.cancelButton} onPress={() => cancelAppointment(appointment)}><Text style={styles.cancelText}>Cancelar</Text></Pressable></View> : null}
      </View>)}
      <Pressable style={styles.addVisit} onPress={() => setScreen('services')}><Text style={styles.addVisitText}>Reservar otra visita</Text><Text style={styles.plus}>＋</Text></Pressable>
    </>
  );

  const renderProfile = () => (
    <>
      {header('CUENTA', 'Mi perfil')}
      <View style={styles.avatar}><Text style={styles.avatarText}>{name.slice(0, 1).toUpperCase() || 'C'}</Text></View>
      <Text style={styles.profileName}>{name || 'Cliente Carlyn'}</Text>
      <Text style={styles.email}>{email}</Text>
      <Text style={styles.label}>Nombre completo</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Tu nombre" placeholderTextColor={colors.subtle} style={styles.input} />
      <Text style={styles.label}>Telefono</Text>
      <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Tu telefono" placeholderTextColor={colors.subtle} style={styles.input} />
      <Pressable onPress={saveProfile} style={styles.goldButton}><Text style={styles.goldButtonText}>Guardar cambios</Text></Pressable>
      <Pressable onPress={signOut} style={styles.logout}><Text style={styles.cancelText}>Cerrar sesion</Text></Pressable>
    </>
  );

  if (screen === 'loading') return <SafeAreaView style={styles.center}><StatusBar style="dark" /><ActivityIndicator color={colors.gold} size="large" /><Text style={styles.loadingText}>Preparando Carlyn</Text></SafeAreaView>;

  if (screen === 'login') return (
    <SafeAreaView style={styles.safe}><StatusBar style="dark" /><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.login}>
      <Image source={brandLogo} style={styles.loginLogo} resizeMode="contain" />
      <Text style={styles.loginTitle}>Tu corte, a tu manera.</Text>
      <Text style={styles.loginLead}>Accede para reservar, consultar y administrar tus citas.</Text>
      <Text style={styles.label}>Correo electronico</Text>
      <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="nombre@correo.com" placeholderTextColor={colors.subtle} style={styles.input} />
      <Text style={styles.label}>Contrasena</Text>
      <View style={styles.passwordWrap}><TextInput value={password} onChangeText={setPassword} secureTextEntry={!passwordVisible} placeholder="Tu contrasena" placeholderTextColor={colors.subtle} style={styles.passwordInput} /><Pressable onPress={() => setPasswordVisible((current) => !current)} hitSlop={12} style={styles.passwordToggle} accessibilityRole="button" accessibilityLabel={passwordVisible ? 'Ocultar contrasena' : 'Mostrar contrasena'}><Ionicons name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.gold} /></Pressable></View>
      <View style={styles.loginOptions}><Text style={styles.remember}>La sesion se guardara en este dispositivo</Text><Text style={styles.link}>Olvide mi contrasena</Text></View>
      <Pressable disabled={loadingLogin} onPress={signIn} style={[styles.goldButton, loadingLogin && styles.disabled]}>{loadingLogin ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.goldButtonText}>Iniciar sesion</Text>}</Pressable>
      <View style={styles.divider}><View style={styles.dividerLine} /><Text style={styles.dividerText}>o continua con</Text><View style={styles.dividerLine} /></View>
      <Pressable style={styles.googleButton} onPress={() => Alert.alert('Proximamente', 'El acceso con Google se integrara con el cliente OAuth movil del proyecto.')}><Text style={styles.googleText}>Continuar con Google</Text></Pressable>
      <Text style={styles.registerText}>No tienes cuenta? <Text style={styles.link}>Registrate desde el sitio web</Text></Text>
    </ScrollView></SafeAreaView>
  );

  let view = renderHome();
  if (screen === 'services') view = renderServices();
  if (screen === 'booking') view = renderBooking();
  if (screen === 'appointments') view = renderAppointments();
  if (screen === 'profile') view = renderProfile();

  return <SafeAreaView style={styles.safe}><StatusBar style="dark" /><ScrollView contentContainerStyle={styles.page}>{view}</ScrollView>{nav()}</SafeAreaView>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <View style={styles.stat}><Text style={styles.statLabel}>{label}</Text><Text style={styles.statValue}>{value}</Text></View>;
}

function ServiceCard({ service, onPress }: { service: Service; onPress: () => void }) {
  const [imageFailed, setImageFailed] = useState(false);

  return <Pressable onPress={onPress} style={styles.serviceCard}>
    {service.imageUrl && !imageFailed ? <Image source={{ uri: service.imageUrl }} style={styles.serviceImage} resizeMode="cover" onError={() => setImageFailed(true)} accessibilityLabel={`Imagen de ${service.name}`} /> : <View style={styles.serviceIcon}><Ionicons name="cut-outline" size={27} color={colors.gold} /></View>}
    <View style={styles.serviceInfo}><Text style={styles.serviceName}>{service.name}</Text><Text style={styles.serviceDescription} numberOfLines={2}>{service.description}</Text><Text style={styles.serviceDuration}>{service.duration} min</Text></View><Text style={styles.price}>{money(service.price)}</Text>
  </Pressable>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return <View style={styles.summaryRow}><Text style={styles.summaryLabel}>{label}</Text><Text numberOfLines={1} style={styles.summaryValue}>{value}</Text></View>;
}

function Loading({ label }: { label: string }) {
  return <View style={styles.state}><ActivityIndicator color={colors.gold} /><Text style={styles.helperText}>{label}</Text></View>;
}

function Empty({ label }: { label: string }) {
  return <View style={styles.state}><Text style={styles.helperText}>{label}</Text></View>;
}

function money(value: number) { return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value || 0); }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas },
  loadingText: { marginTop: 12, color: colors.ink, fontWeight: '700' },
  page: { padding: 20, paddingBottom: 112 },
  login: { flexGrow: 1, padding: 28, justifyContent: 'center', backgroundColor: colors.canvas },
  header: { marginBottom: 20 },
  brandLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  headerLogo: { width: 154, height: 48, marginRight: 'auto' },
  brandMark: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.ink, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  brandMarkText: { color: colors.gold, fontSize: 22, fontWeight: '900' },
  brandText: { color: colors.ink, fontSize: 15, fontWeight: '900', letterSpacing: 2 },
  bell: { marginLeft: 'auto', color: colors.ink, fontSize: 26 },
  eyebrow: { color: colors.gold, fontSize: 11, letterSpacing: 1.8, fontWeight: '900', marginBottom: 8 },
  heading: { color: colors.ink, fontSize: 32, lineHeight: 39, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginBottom: 8 },
  hero: { backgroundColor: colors.ink, minHeight: 256, borderRadius: 20, padding: 24, justifyContent: 'center' },
  heroKicker: { color: colors.gold, fontSize: 11, letterSpacing: 1.5, fontWeight: '900', marginBottom: 13 },
  heroTitle: { color: colors.paper, fontSize: 31, lineHeight: 38, fontWeight: '900', maxWidth: 300 },
  heroCopy: { color: '#D8D5CF', fontSize: 15, lineHeight: 22, marginTop: 12, maxWidth: 285 },
  goldButton: { height: 54, borderRadius: 10, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  goldButtonSmall: { alignSelf: 'flex-start', backgroundColor: colors.gold, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 13, marginTop: 20 },
  goldButtonText: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  disabled: { opacity: 0.55 },
  stats: { flexDirection: 'row', gap: 12, marginTop: 14 },
  stat: { flex: 1, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 16 },
  statLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  statValue: { color: colors.ink, fontSize: 27, fontWeight: '900', marginTop: 5 },
  sectionLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 12 },
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: '900' },
  link: { color: colors.gold, fontSize: 13, fontWeight: '900' },
  serviceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border, borderRadius: 15, padding: 12, marginBottom: 10 },
  serviceImage: { width: 72, height: 72, borderRadius: 13, marginRight: 12, backgroundColor: colors.goldPale },
  serviceIcon: { width: 72, height: 72, borderRadius: 13, backgroundColor: colors.goldPale, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  serviceIconText: { color: colors.gold, fontSize: 21, fontWeight: '900' },
  serviceInfo: { flex: 1, paddingRight: 6 },
  serviceName: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  serviceDescription: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  serviceDuration: { color: colors.subtle, fontSize: 12, fontWeight: '700', marginTop: 5 },
  price: { color: colors.green, fontSize: 15, fontWeight: '900' },
  warning: { color: colors.red, fontSize: 12, lineHeight: 18, marginTop: 12 },
  chips: { gap: 8, paddingVertical: 10, paddingRight: 20 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.paper },
  chipSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { color: colors.muted, fontSize: 13, fontWeight: '800' },
  chipTextSelected: { color: colors.goldPale },
  optionChip: { width: 175, minHeight: 72, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.paper, padding: 12 },
  optionChipSelected: { borderColor: colors.gold, borderWidth: 2, backgroundColor: colors.goldPale },
  optionMain: { color: colors.ink, fontWeight: '900', fontSize: 14 },
  optionMainSelected: { color: colors.ink },
  optionSub: { color: colors.muted, fontSize: 11, marginTop: 5 },
  optionSubSelected: { color: colors.ink },
  step: { color: colors.gold, fontSize: 11, letterSpacing: 1.5, fontWeight: '900', marginTop: 18, marginBottom: 3 },
  dateStrip: { gap: 8, paddingVertical: 10, paddingRight: 20 },
  dateCard: { width: 90, minHeight: 56, borderRadius: 12, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  dateCardBusy: { backgroundColor: colors.busy, borderColor: colors.busy },
  dateCardSelected: { backgroundColor: colors.gold, borderColor: colors.gold },
  dateText: { color: colors.ink, fontSize: 12, textAlign: 'center', fontWeight: '800' },
  dateTextSelected: { color: colors.ink },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingTop: 10 },
  slot: { width: '31%', minHeight: 48, borderRadius: 10, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', padding: 4 },
  slotBusy: { backgroundColor: colors.busy, borderColor: colors.busy },
  slotSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  slotText: { color: colors.ink, fontSize: 12, fontWeight: '900' },
  slotBusyText: { color: colors.subtle },
  slotTextSelected: { color: colors.goldPale },
  helperText: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 10 },
  state: { minHeight: 86, alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.paper, gap: 9, marginTop: 10 },
  summary: { borderRadius: 15, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border, padding: 17, marginTop: 18 },
  summaryTitle: { color: colors.ink, fontSize: 17, fontWeight: '900', marginBottom: 6 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 14, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  summaryLabel: { color: colors.muted, fontSize: 13 },
  summaryValue: { flex: 1, textAlign: 'right', color: colors.ink, fontSize: 13, fontWeight: '800' },
  appointmentCard: { backgroundColor: colors.paper, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 18, marginBottom: 14 },
  appointmentHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  status: { color: colors.green, fontSize: 11, letterSpacing: 1, fontWeight: '900' },
  statusMuted: { color: colors.subtle },
  appointmentName: { color: colors.ink, fontSize: 21, fontWeight: '900', marginTop: 10 },
  rule: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  rebookButton: { flex: 1, height: 44, borderRadius: 9, borderWidth: 1, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  rebookText: { color: colors.gold, fontWeight: '900', fontSize: 13 },
  cancelButton: { flex: 1, height: 44, borderRadius: 9, borderWidth: 1, borderColor: '#E5B4BA', alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: colors.red, fontWeight: '900', fontSize: 13 },
  addVisit: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.paper, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 18, marginTop: 4 },
  addVisitText: { color: colors.ink, fontWeight: '900', fontSize: 15 },
  plus: { color: colors.gold, fontSize: 26 },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.ink, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  avatarText: { color: colors.gold, fontSize: 36, fontWeight: '900' },
  profileName: { color: colors.ink, fontSize: 22, fontWeight: '900', textAlign: 'center', marginTop: 12 },
  email: { color: colors.muted, textAlign: 'center', marginTop: 4, marginBottom: 8 },
  label: { color: colors.ink, fontSize: 13, fontWeight: '800', marginTop: 15, marginBottom: 7 },
  input: { height: 52, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.paper, paddingHorizontal: 14, color: colors.ink, fontSize: 15 },
  logout: { alignSelf: 'center', padding: 16, marginTop: 10 },
  loginLogo: { width: 220, height: 92, alignSelf: 'flex-start', marginBottom: 12 },
  loginMark: { width: 58, height: 58, borderRadius: 18, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  loginMarkText: { color: colors.gold, fontSize: 30, fontWeight: '900' },
  loginTitle: { color: colors.ink, fontSize: 34, lineHeight: 41, fontWeight: '900', marginTop: 16 },
  loginLead: { color: colors.muted, fontSize: 16, lineHeight: 23, marginTop: 10, marginBottom: 16 },
  passwordWrap: { height: 52, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.paper, paddingLeft: 14, paddingRight: 13, flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, height: '100%', color: colors.ink, fontSize: 15 },
  passwordToggle: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  loginOptions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 13 },
  remember: { color: colors.muted, fontSize: 11, flex: 1, lineHeight: 16 },
  divider: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 23 },
  dividerLine: { height: 1, flex: 1, backgroundColor: colors.border },
  dividerText: { color: colors.subtle, fontSize: 12 },
  googleButton: { height: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.paper, marginTop: 16 },
  googleText: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  registerText: { textAlign: 'center', color: colors.muted, fontSize: 13, marginTop: 23 },
  nav: {
    minHeight: 80,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paper,
    shadowColor: '#151515',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 10,
    elevation: 10,
  },
  navItem: {
    flex: 1,
    minHeight: 62,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 14,
  },
  navItemSelected: { backgroundColor: '#fbf0d6' },
  navItemPressed: { opacity: 0.72 },
  navIcon: {
    width: 34,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  navIconSelected: { backgroundColor: '#f6e2af' },
  navText: { color: colors.subtle, fontSize: 11, fontWeight: '800' },
  navTextSelected: { color: colors.ink },
});
