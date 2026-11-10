// Caja blanca, ViewModel: aviso, oposicion (switches) y cancelacion de la cuenta.
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { PrivacyRepository } from '../../../src/data/repositories/PrivacyRepository';
import { PrivacySettings } from '../../../src/domain/privacy';
import { usePrivacyViewModel } from '../../../src/presentation/viewmodels/usePrivacyViewModel';

const ACCEPTED: PrivacySettings = { acceptedAt: '2026-11-08T18:00:00.000Z', promotions: false, reminders: true, analytics: true };

function fakePrivacy(overrides: Partial<PrivacyRepository> = {}): PrivacyRepository {
  return {
    get: jest.fn().mockResolvedValue(ACCEPTED),
    acceptNotice: jest.fn().mockResolvedValue(ACCEPTED),
    update: jest.fn().mockImplementation(async (key, enabled) => ({ ...ACCEPTED, [key]: enabled })),
    deleteAccount: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

async function setup(repo = fakePrivacy(), token: string | null = 'jwt') {
  const onDeleted = jest.fn().mockResolvedValue(undefined);
  const { result } = await renderHook(() => usePrivacyViewModel(token, onDeleted, repo));
  if (token) await waitFor(() => expect(result.current.loading).toBe(false));
  return { result, repo, onDeleted };
}

async function call<T>(action: () => Promise<T>) {
  let value: T | undefined;
  await act(async () => { value = await action(); });
  return value;
}

describe('usePrivacyViewModel', () => {
  it('no consulta nada sin sesion', async () => {
    const { result, repo } = await setup(fakePrivacy(), null);
    expect(repo.get).not.toHaveBeenCalled();
    expect(result.current.needsConsent).toBe(false);
  });

  it('pide aceptar el aviso solo cuando el backend confirma que no esta aceptado', async () => {
    const repo = fakePrivacy({ get: jest.fn().mockResolvedValue({ ...ACCEPTED, acceptedAt: null }) });
    const { result } = await setup(repo);
    expect(result.current.needsConsent).toBe(true);
    await call(() => result.current.acceptNotice());
    expect(repo.acceptNotice).toHaveBeenCalled();
    expect(result.current.needsConsent).toBe(false);
  });

  it('no bloquea la app si falla la consulta de privacidad', async () => {
    const { result } = await setup(fakePrivacy({ get: jest.fn().mockRejectedValue(new Error('Network request failed')) }));
    expect(result.current.needsConsent).toBe(false);
    expect(result.current.loadError).toBe('Network request failed');
  });

  it('guarda la oposicion a estadisticas', async () => {
    const { result, repo } = await setup();
    expect(await call(() => result.current.setPreference('analytics', false))).toBeNull();
    expect(repo.update).toHaveBeenCalledWith('analytics', false);
    expect(result.current.settings?.analytics).toBe(false);
  });

  it('regresa el switch a su valor si el servidor no guarda el cambio', async () => {
    const { result } = await setup(fakePrivacy({ update: jest.fn().mockRejectedValue(new Error('Error interno del servidor')) }));
    expect(await call(() => result.current.setPreference('reminders', false))).toMatchObject({ ok: false, message: 'Error interno del servidor' });
    expect(result.current.settings?.reminders).toBe(true);
  });

  it('solo elimina la cuenta cuando se escribe ELIMINAR', async () => {
    const { result, repo, onDeleted } = await setup();
    await act(async () => result.current.setDeleteText('eliminar cuenta'));
    expect(result.current.canDelete).toBe(false);
    expect(await call(() => result.current.deleteAccount())).toMatchObject({ ok: false, title: 'Confirma la eliminacion' });
    expect(repo.deleteAccount).not.toHaveBeenCalled();

    await act(async () => result.current.setDeleteText(' eliminar '));
    expect(result.current.canDelete).toBe(true);
    expect(await call(() => result.current.deleteAccount())).toMatchObject({ ok: true, title: 'Cuenta eliminada' });
    expect(repo.deleteAccount).toHaveBeenCalledWith('ELIMINAR');
    expect(onDeleted).toHaveBeenCalled();
  });

  it('no cierra la sesion si el backend rechaza la eliminacion', async () => {
    const rejected = new Error('Las cuentas de barberos y administradores se dan de baja con el administrador.');
    const { result, onDeleted } = await setup(fakePrivacy({ deleteAccount: jest.fn().mockRejectedValue(rejected) }));
    await act(async () => result.current.setDeleteText('ELIMINAR'));
    expect(await call(() => result.current.deleteAccount())).toMatchObject({ ok: false, title: 'No fue posible eliminar la cuenta' });
    expect(onDeleted).not.toHaveBeenCalled();
  });
});
