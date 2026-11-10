// Caja blanca, ViewModel: recuperar contrasena en tres pasos (correo, codigo, nueva contrasena).
import { act, renderHook } from '@testing-library/react-native';
import { AccountField } from '../../../src/domain/account';
import { useRecoveryViewModel } from '../../../src/presentation/viewmodels/useRecoveryViewModel';
import { fakeAccount } from './fakes';

type Hook = { current: ReturnType<typeof useRecoveryViewModel> };

async function fill(result: Hook, values: Partial<Record<AccountField, string>>) {
  for (const [field, value] of Object.entries(values)) {
    await act(async () => result.current.setField(field as AccountField, value));
  }
}

async function call<T>(action: () => Promise<T>) {
  let value: T | undefined;
  await act(async () => { value = await action(); });
  return value;
}

describe('useRecoveryViewModel', () => {
  it('empieza con el correo que se escribio en el login', async () => {
    const { result } = await renderHook(() => useRecoveryViewModel(fakeAccount()));
    await act(async () => result.current.start('javier@correo.com'));
    expect(result.current.form.email).toBe('javier@correo.com');
    expect(result.current.step).toBe('email');
  });

  it('valida el correo antes de pedir el codigo', async () => {
    const account = fakeAccount();
    const { result } = await renderHook(() => useRecoveryViewModel(account));
    await fill(result, { email: 'sin-formato' });
    expect(await call(() => result.current.requestCode())).toBeNull();
    expect(result.current.errors.email).toBe('Revisa el formato del correo.');
    expect(account.requestPasswordReset).not.toHaveBeenCalled();
  });

  it('completa los tres pasos y actualiza la contrasena', async () => {
    const account = fakeAccount();
    const { result } = await renderHook(() => useRecoveryViewModel(account));
    await fill(result, { email: 'javier@correo.com' });
    await call(() => result.current.requestCode());
    expect(result.current.step).toBe('code');
    expect(result.current.codeSecondsLeft).toBe(600);

    await fill(result, { code: '654321' });
    await call(() => result.current.verifyCode());
    expect(account.verifyRecoveryCode).toHaveBeenCalledWith('javier@correo.com', '654321');
    expect(result.current.step).toBe('password');

    await fill(result, { password: 'nueva123', confirmPassword: 'nueva123' });
    expect(await call(() => result.current.savePassword())).toMatchObject({ ok: true, title: '¡Contrasena actualizada!' });
    expect(account.resetPassword).toHaveBeenCalledWith('javier@correo.com', 'nueva123');
  });

  it('no avanza si el backend rechaza el codigo', async () => {
    const account = fakeAccount({ verifyRecoveryCode: jest.fn().mockRejectedValue(new Error('Código incorrecto')) });
    const { result } = await renderHook(() => useRecoveryViewModel(account));
    await fill(result, { email: 'javier@correo.com' });
    await call(() => result.current.requestCode());
    await fill(result, { code: '000000' });
    expect(await call(() => result.current.verifyCode())).toEqual({ ok: false, title: 'No pudimos verificar el codigo', message: 'Código incorrecto' });
    expect(result.current.step).toBe('code');
  });

  it('exige que las contrasenas coincidan', async () => {
    const account = fakeAccount();
    const { result } = await renderHook(() => useRecoveryViewModel(account));
    await fill(result, { password: 'nueva123', confirmPassword: 'otra123' });
    expect(await call(() => result.current.savePassword())).toBeNull();
    expect(result.current.errors.confirmPassword).toBe('Las contrasenas no coinciden.');
    expect(account.resetPassword).not.toHaveBeenCalled();
  });

  it('informa cuando no existe una cuenta con ese correo', async () => {
    const account = fakeAccount({ requestPasswordReset: jest.fn().mockRejectedValue(new Error('No existe una cuenta con ese correo')) });
    const { result } = await renderHook(() => useRecoveryViewModel(account));
    await fill(result, { email: 'nadie@correo.com' });
    expect(await call(() => result.current.requestCode())).toMatchObject({ ok: false, message: 'No existe una cuenta con ese correo' });
    expect(result.current.step).toBe('email');
  });
});
