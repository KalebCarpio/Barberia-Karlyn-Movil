// CAT-01 (#53), CAT-02 (#54), AVAIL-01 (#68) y MGMT-01 (#59): reservar o reprogramar una cita.
import { useEffect, useMemo, useState } from 'react';
import { repositories } from '../../data/repositories';
import { AppointmentRepository } from '../../data/repositories/AppointmentRepository';
import { AvailabilityRepository } from '../../data/repositories/AvailabilityRepository';
import { CatalogRepository } from '../../data/repositories/CatalogRepository';
import { bookingDates, dateKey, displayDate, hasAvailableSlot } from '../../domain/availability';
import { Appointment, Barber, Branch, Service, Slot } from '../../domain/models';
import { FALLBACK_SERVICES } from './useCatalogViewModel';
import { ActionResult, errorMessage } from './types';

type BookingDeps = {
  catalog?: CatalogRepository;
  availability?: AvailabilityRepository;
  appointments?: AppointmentRepository;
};

export function useBookingViewModel(
  active: boolean,
  token: string | null,
  {
    catalog = repositories.catalog,
    availability = repositories.availability,
    appointments = repositories.appointments,
  }: BookingDeps = {},
) {
  const [service, setService] = useState<Service>(FALLBACK_SERVICES[0]);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [selectedBarberId, setSelectedBarberId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date()));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [message, setMessage] = useState('Elige sucursal, barbero, fecha y horario.');
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);

  const dates = useMemo(() => bookingDates(unavailableDates), [unavailableDates]);
  const currentBranch = branches.find((branch) => branch.id === selectedBranchId);
  const currentBarber = barbers.find((barber) => barber.id === selectedBarberId);

  useEffect(() => {
    if (!active) return;
    const loadBranches = async () => {
      try {
        const loaded = await catalog.getBranches();
        setBranches(loaded);
        setSelectedBranchId((current) => current && loaded.some((branch) => branch.id === current) ? current : loaded[0]?.id || null);
        if (!loaded.length) setMessage('No hay sucursales disponibles para reservar.');
      } catch (error) {
        setMessage(errorMessage(error, 'No fue posible cargar las sucursales.'));
      }
    };
    void loadBranches();
  }, [active, catalog]);

  useEffect(() => {
    if (!active || !selectedBranchId) return;
    const loadBarbers = async () => {
      setLoadingData(true);
      try {
        const loaded = await catalog.getBarbersByBranch(selectedBranchId);
        setBarbers(loaded);
        setSelectedBarberId((current) => current && loaded.some((barber) => barber.id === current) ? current : loaded[0]?.id || null);
        if (!loaded.length) setMessage('Esta sucursal aun no tiene barberos disponibles.');
      } catch (error) {
        setBarbers([]);
        setMessage(errorMessage(error, 'No fue posible cargar los barberos.'));
      } finally {
        setLoadingData(false);
      }
    };
    void loadBarbers();
  }, [active, selectedBranchId, catalog]);

  useEffect(() => {
    if (!active || !selectedBarberId || !selectedDate) return;
    const loadSlots = async () => {
      setLoadingData(true);
      setSelectedTime(null);
      try {
        const loaded = await availability.getSlots(selectedBarberId, selectedDate);
        setSlots(loaded);
        setMessage(hasAvailableSlot(loaded) ? 'Selecciona un horario disponible.' : 'No hay horarios libres para este dia.');
      } catch (error) {
        setSlots([]);
        setMessage(errorMessage(error, 'No fue posible consultar los horarios.'));
      } finally {
        setLoadingData(false);
      }
    };
    void loadSlots();
  }, [active, selectedBarberId, selectedDate, token, availability]);

  useEffect(() => {
    if (!active || !selectedBarberId) return;
    // Si falla la consulta de fechas se dejan todas habilitadas y la API valida al consultar horarios.
    availability.getUnavailableDates(selectedBarberId)
      .then(setUnavailableDates)
      .catch(() => setUnavailableDates([]));
  }, [active, selectedBarberId, token, availability]);

  const start = (nextService: Service, appointment?: Appointment) => {
    setService(nextService);
    setSelectedBranchId(appointment?.branchId || null);
    setSelectedBarberId(appointment?.barberId || null);
    setSelectedDate(appointment?.date || dateKey(new Date()));
    setSelectedTime(null);
    setEditingAppointment(appointment || null);
    setSlots([]);
  };

  const confirm = async (): Promise<ActionResult> => {
    if (!selectedBranchId || !selectedBarberId || !selectedTime) {
      return { ok: false, title: 'Completa la reserva', message: 'Elige sucursal, barbero y un horario disponible.' };
    }
    setSaving(true);
    try {
      if (editingAppointment) {
        await appointments.reschedule(editingAppointment.id, selectedDate, selectedTime);
      } else {
        await appointments.create({
          barberId: selectedBarberId,
          serviceId: service.id,
          branchId: selectedBranchId,
          date: selectedDate,
          time: selectedTime,
        });
      }
      const result: ActionResult = {
        ok: true,
        title: editingAppointment ? '¡Cita reprogramada!' : '¡Cita confirmada!',
        message: editingAppointment ? 'Actualizamos tu cita con el nuevo horario.' : 'Te esperamos en Carlyn. Llega 5 minutos antes.',
        details: [
          { label: 'Servicio', value: service.name },
          { label: 'Fecha', value: displayDate(selectedDate) },
          { label: 'Hora', value: selectedTime },
          { label: 'Barbero', value: currentBarber?.name || 'Asignado' },
          { label: 'Sucursal', value: currentBranch?.name || 'Carlyn' },
        ],
      };
      setEditingAppointment(null);
      return result;
    } catch (error) {
      return { ok: false, title: 'No fue posible guardar la cita', message: errorMessage(error, 'Intenta nuevamente.') };
    } finally {
      setSaving(false);
    }
  };

  return {
    service,
    editingAppointment,
    branches,
    barbers,
    dates,
    slots,
    selectedBranchId,
    setSelectedBranchId,
    selectedBarberId,
    setSelectedBarberId,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    currentBranch,
    currentBarber,
    message,
    loadingData,
    saving,
    start,
    confirm,
  };
}

export type BookingViewModel = ReturnType<typeof useBookingViewModel>;
