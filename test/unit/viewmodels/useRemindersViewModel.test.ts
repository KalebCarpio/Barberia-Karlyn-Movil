// Caja blanca, ViewModel: permiso de notificaciones a demanda y oposicion a recordatorios.
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { PermissionState, ReminderScheduler } from '../../../src/data/notifications/reminderScheduler';
import { Appointment } from '../../../src/domain/models';
import { useRemindersViewModel } from '../../../src/presentation/viewmodels/useRemindersViewModel';

const service = { id: 11, name: 'Corte', category: 'Cortes', description: '', price: 180, duration: 45 };
const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
const date = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;
const appointments: Appointment[] = [{ id: 7, service, date, time: '10:20', barber: 'Carlos', status: 'Pendiente', canManage: true }];

function fakeScheduler(state: PermissionState, grant = true): ReminderScheduler {
  let current = state;
  return {
    permission: jest.fn().mockImplementation(async () => current),
    canAskAgain: jest.fn().mockResolvedValue(true),
    requestPermission: jest.fn().mockImplementation(async () => { current = grant ? 'granted' : 'denied'; return grant; }),
    sync: jest.fn().mockResolvedValue(undefined),
  };
}

describe('useRemindersViewModel', () => {
  it('no pide el permiso al abrir la app, solo lo ofrece', async () => {
    const scheduler = fakeScheduler('undetermined');
    const { result } = await renderHook(() => useRemindersViewModel(appointments, true, scheduler));
    await waitFor(() => expect(scheduler.permission).toHaveBeenCalled());
    expect(scheduler.requestPermission).not.toHaveBeenCalled();
    expect(result.current.shouldOffer).toBe(true);
    expect(scheduler.sync).not.toHaveBeenCalled();
  });

  it('al conceder el permiso programa los recordatorios de las citas', async () => {
    const scheduler = fakeScheduler('undetermined');
    const { result } = await renderHook(() => useRemindersViewModel(appointments, true, scheduler));
    await waitFor(() => expect(result.current.permission).toBe('undetermined'));
    let granted;
    await act(async () => { granted = await result.current.request(); });
    expect(granted).toBe(true);
    await waitFor(() => expect(scheduler.sync).toHaveBeenCalledWith([expect.objectContaining({ id: `cita-7-${date}-10:20` })]));
  });

  it('cancela todos los recordatorios si el usuario se opone en Privacidad', async () => {
    const scheduler = fakeScheduler('granted');
    const { result } = await renderHook(() => useRemindersViewModel(appointments, false, scheduler));
    await waitFor(() => expect(scheduler.sync).toHaveBeenCalledWith([]));
    expect(result.current.shouldOffer).toBe(false);
  });

  it('deja de ofrecerlo en la sesion si el usuario elige "Ahora no"', async () => {
    const scheduler = fakeScheduler('undetermined');
    const { result } = await renderHook(() => useRemindersViewModel(appointments, true, scheduler));
    await waitFor(() => expect(result.current.shouldOffer).toBe(true));
    await act(async () => result.current.decline());
    expect(result.current.shouldOffer).toBe(false);
  });

  it('registra el permiso negado y no programa nada', async () => {
    const scheduler = fakeScheduler('undetermined', false);
    const { result } = await renderHook(() => useRemindersViewModel(appointments, true, scheduler));
    await waitFor(() => expect(result.current.permission).toBe('undetermined'));
    await act(async () => { await result.current.request(); });
    expect(result.current.permission).toBe('denied');
    expect(scheduler.sync).not.toHaveBeenCalled();
  });
});
