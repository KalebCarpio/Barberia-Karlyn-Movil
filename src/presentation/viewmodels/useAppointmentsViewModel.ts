import { useCallback, useEffect, useState } from 'react';
import { repositories } from '../../data/repositories';
import { AppointmentRepository } from '../../data/repositories/AppointmentRepository';
import { Appointment } from '../../domain/models';
import { ActionResult, errorMessage } from './types';

// Citas del usuario: se cargan al iniciar sesion y se limpian al cerrarla.
export function useAppointmentsViewModel(token: string | null, appointmentsRepo: AppointmentRepository = repositories.appointments) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setAppointments(await appointmentsRepo.list());
    } catch (error) {
      console.warn('No fue posible cargar las citas:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [appointmentsRepo]);

  useEffect(() => {
    if (token) void reload();
    else setAppointments([]);
  }, [token, reload]);

  const cancel = async (appointment: Appointment): Promise<ActionResult> => {
    try {
      await appointmentsRepo.cancel(appointment.id);
      await reload();
      return { ok: true, title: 'Cita cancelada', message: 'La cita se actualizo correctamente.' };
    } catch (error) {
      return { ok: false, title: 'No fue posible cancelar', message: errorMessage(error, 'Intenta nuevamente.') };
    }
  };

  const activeCount = appointments.filter((appointment) => appointment.canManage).length;

  return { appointments, loading, activeCount, reload, cancel };
}

export type AppointmentsViewModel = ReturnType<typeof useAppointmentsViewModel>;
