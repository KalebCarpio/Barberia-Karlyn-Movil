// Caja blanca, ViewModel. CAT-02 (#54), AVAIL-01 (#68) y MGMT-01 (#59): flujo de reserva.
// Igual que en la app: se llama start() y despues se activa la pantalla de reserva.
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { dateKey } from '../../../src/domain/availability';
import { Appointment, Service } from '../../../src/domain/models';
import { useBookingViewModel } from '../../../src/presentation/viewmodels/useBookingViewModel';
import { fakeAppointments, fakeAvailability, fakeCatalog, services } from './fakes';

async function openBooking(service: Service, appointment?: Appointment, deps = {}) {
  const repos = { catalog: fakeCatalog(), availability: fakeAvailability(), appointments: fakeAppointments(), ...deps };
  const hook = await renderHook(({ active }: { active: boolean }) => useBookingViewModel(active, 'token', repos), {
    initialProps: { active: false },
  });
  await act(async () => hook.result.current.start(service, appointment));
  await hook.rerender({ active: true });
  return { ...repos, result: hook.result };
}

async function readyBooking(service: Service, appointment?: Appointment, deps = {}) {
  const context = await openBooking(service, appointment, deps);
  await waitFor(() => expect(context.result.current.slots).toHaveLength(2));
  return context;
}

async function confirm(result: { current: ReturnType<typeof useBookingViewModel> }) {
  let outcome;
  await act(async () => { outcome = await result.current.confirm(); });
  return outcome;
}

describe('useBookingViewModel', () => {
  it('no consulta nada mientras la pantalla de reserva no esta activa', async () => {
    const catalog = fakeCatalog();
    await renderHook(() => useBookingViewModel(false, 'token', { catalog }));
    expect(catalog.getBranches).not.toHaveBeenCalled();
  });

  it('encadena sucursal, barbero y horarios seleccionando los primeros disponibles', async () => {
    const { result, catalog, availability } = await readyBooking(services[1]);
    expect(result.current.selectedBranchId).toBe(1);
    expect(catalog.getBarbersByBranch).toHaveBeenCalledWith(1);
    expect(result.current.selectedBarberId).toBe(34);
    expect(availability.getSlots).toHaveBeenCalledWith(34, result.current.selectedDate);
    expect(result.current.message).toBe('Selecciona un horario disponible.');
  });

  it('deshabilita las fechas que el repositorio reporta sin disponibilidad', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const key = dateKey(tomorrow);
    const { result } = await readyBooking(services[1], undefined, {
      availability: fakeAvailability({ getUnavailableDates: jest.fn().mockResolvedValue([key]) }),
    });
    await waitFor(() => expect(result.current.dates.find((date) => date.key === key)?.available).toBe(false));
  });

  it('informa cuando la sucursal no tiene barberos', async () => {
    const { result } = await openBooking(services[1], undefined, {
      catalog: fakeCatalog({ getBarbersByBranch: jest.fn().mockResolvedValue([]) }),
    });
    await waitFor(() => expect(result.current.message).toBe('Esta sucursal aun no tiene barberos disponibles.'));
  });

  it('pide completar la reserva si no hay horario elegido', async () => {
    const { result, appointments } = await readyBooking(services[1]);
    expect(await confirm(result)).toMatchObject({ ok: false, title: 'Completa la reserva' });
    expect(appointments.create).not.toHaveBeenCalled();
  });

  it('crea la cita con los datos seleccionados', async () => {
    const { result, appointments } = await readyBooking(services[1]);
    await act(async () => result.current.setSelectedTime('09:40'));
    expect(await confirm(result)).toMatchObject({ ok: true, title: 'Cita confirmada' });
    expect(appointments.create).toHaveBeenCalledWith({
      barberId: 34, serviceId: 12, branchId: 1, date: result.current.selectedDate, time: '09:40',
    });
  });

  it('reprograma una cita existente en lugar de crear otra', async () => {
    const existing: Appointment = {
      id: 7, service: services[0], date: dateKey(new Date()), time: '10:20', barber: 'Carlos Mendez',
      barberId: 34, branchId: 1, status: 'Pendiente', canManage: true,
    };
    const { result, appointments } = await readyBooking(existing.service, existing);
    expect(result.current.editingAppointment?.id).toBe(7);
    await act(async () => result.current.setSelectedTime('09:40'));
    expect(await confirm(result)).toMatchObject({ ok: true, title: 'Cita reprogramada' });
    expect(appointments.reschedule).toHaveBeenCalledWith(7, existing.date, '09:40');
    expect(appointments.create).not.toHaveBeenCalled();
  });

  it('devuelve el mensaje de la API si no se puede guardar', async () => {
    const { result } = await readyBooking(services[1], undefined, {
      appointments: fakeAppointments({ create: jest.fn().mockRejectedValue(new Error('Horario no disponible')) }),
    });
    await act(async () => result.current.setSelectedTime('09:40'));
    expect(await confirm(result)).toEqual({ ok: false, title: 'No fue posible guardar la cita', message: 'Horario no disponible' });
  });
});
