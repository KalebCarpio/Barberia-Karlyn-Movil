// Caja blanca, ViewModel: registro con validacion, codigo, vencimiento y reenvio.
import { act, renderHook } from '@testing-library/react-native';
import { AccountField } from '../../../src/domain/account';
import { useRegisterViewModel } from '../../../src/presentation/viewmodels/useRegisterViewModel';
import { fakeAccount } from './fakes';

type Hook = { current: ReturnType<typeof useRegisterViewModel> };

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

const VALID = { name: 'Javier Flores', email: 'javier@correo.com', phone: '7712426663', password: 'secreto1', confirmPassword: 'secreto1' };

async function inCodeStep(account = fakeAccount()) {
  const { result } = await renderHook(() => useRegisterViewModel(account));
  await fill(result, VALID);
  await call(() => result.current.submit());
  return { result, account };
}

describe('useRegisterViewModel', () => {
  afterEach(() => jest.useRealTimers());

  it('muestra los errores de cada campo y no llama a la API', async () => {
    const account = fakeAccount();
    const { result } = await renderHook(() => useRegisterViewModel(account));
    await fill(result, { name: 'Jo', email: 'mal', phone: '12', password: '123', confirmPassword: '321' });
    expect(await call(() => result.current.submit())).toBeNull();
    expect(Object.keys(result.current.errors).sort()).toEqual(['confirmPassword', 'email', 'name', 'password', 'phone']);
    expect(account.register).not.toHaveBeenCalled();
  });

  it('limpia el error de un campo al corregirlo', async () => {
    const { result } = await renderHook(() => useRegisterViewModel(fakeAccount()));
    await call(() => result.current.submit());
    expect(result.current.errors.email).toBeDefined();
    await fill(result, { email: 'javier@correo.com' });
    expect(result.current.errors.email).toBeUndefined();
  });

  it('registra y pasa al paso del codigo con su cuenta regresiva', async () => {
    const { result, account } = await inCodeStep();
    expect(account.register).toHaveBeenCalledWith(expect.objectContaining({ email: 'javier@correo.com', phone: '7712426663' }));
    expect(result.current.step).toBe('code');
    expect(result.current.codeSecondsLeft).toBe(240);
    expect(result.current.resendSecondsLeft).toBe(30);
  });

  it('informa el error del backend si no se puede registrar', async () => {
    const account = fakeAccount({ register: jest.fn().mockRejectedValue(new Error('Error al registrarse')) });
    const { result } = await renderHook(() => useRegisterViewModel(account));
    await fill(result, VALID);
    expect(await call(() => result.current.submit())).toEqual({ ok: false, title: 'No fue posible crear la cuenta', message: 'Error al registrarse' });
    expect(result.current.step).toBe('form');
  });

  it('crea la cuenta con un codigo valido', async () => {
    const { result, account } = await inCodeStep();
    await fill(result, { code: '123456' });
    expect(await call(() => result.current.verify())).toMatchObject({ ok: true, title: '¡Cuenta creada!' });
    expect(account.verifyRegistration).toHaveBeenCalledWith('javier@correo.com', '123456');
  });

  it('rechaza un codigo incompleto sin llamar a la API', async () => {
    const { result, account } = await inCodeStep();
    await fill(result, { code: '123' });
    expect(await call(() => result.current.verify())).toBeNull();
    expect(result.current.errors.code).toBe('Escribe el codigo de 6 digitos.');
    expect(account.verifyRegistration).not.toHaveBeenCalled();
  });

  it('no permite reenviar hasta que termine la espera', async () => {
    const { result, account } = await inCodeStep();
    expect(await call(() => result.current.resend())).toBeNull();
    expect(account.resendRegistrationCode).not.toHaveBeenCalled();
  });

  it('avisa que el codigo vencio cuando se acaba el tiempo', async () => {
    jest.useFakeTimers();
    const { result, account } = await inCodeStep();
    await act(async () => { jest.advanceTimersByTime(241 * 1000); });
    expect(result.current.codeSecondsLeft).toBe(0);
    await fill(result, { code: '123456' });
    expect(await call(() => result.current.verify())).toMatchObject({ ok: false, title: 'El codigo vencio' });
    expect(account.verifyRegistration).not.toHaveBeenCalled();

    expect(await call(() => result.current.resend())).toMatchObject({ ok: true, title: 'Codigo reenviado' });
    expect(account.resendRegistrationCode).toHaveBeenCalledWith('javier@correo.com');
    expect(result.current.codeSecondsLeft).toBe(240);
  });
});
