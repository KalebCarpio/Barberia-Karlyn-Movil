// Integracion REST API (fetch simulado): registro con codigo y recuperacion de contrasena.
import { API_URL } from '../../src/core/config';
import { createRepositories } from '../../src/data/repositories';
import { mockFetchResponse, requestOf } from './mockFetch';

const { account } = createRepositories();

function sent(fetchMock: jest.Mock) {
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  return { url, method: init.method, body: JSON.parse(String(init.body)) };
}

describe('Registro', () => {
  it('envia los datos con los nombres de campo del backend y sin token', async () => {
    const fetchMock = mockFetchResponse({ message: 'Código de verificación enviado.' }, 201);
    await account.register({ name: ' Javier Flores ', email: ' javier@correo.com ', phone: '771-242-6663', password: 'secreto1' });
    expect(sent(fetchMock)).toEqual({
      url: `${API_URL}/api/auth/register`,
      method: 'POST',
      body: { nombreCompleto: 'Javier Flores', correoElectronico: 'javier@correo.com', telefono: '7712426663', contrasena: 'secreto1', canal: 'email' },
    });
    expect(requestOf(fetchMock).headers.Authorization).toBeUndefined();
  });

  it('verifica el codigo de registro', async () => {
    const fetchMock = mockFetchResponse({ message: 'Cuenta creada exitosamente.' });
    await account.verifyRegistration('javier@correo.com', ' 123456 ');
    expect(sent(fetchMock)).toMatchObject({ url: `${API_URL}/api/auth/verify-email`, body: { correoElectronico: 'javier@correo.com', code: '123456' } });
  });

  it('propaga el codigo vencido que informa el backend', async () => {
    mockFetchResponse({ message: 'El código de verificación ha expirado' }, 400);
    await expect(account.verifyRegistration('javier@correo.com', '123456')).rejects.toThrow('El código de verificación ha expirado');
  });

  it('propaga el limite de reenvios del backend', async () => {
    mockFetchResponse({ message: 'Demasiados reenvíos. Espera 20 segundos antes de intentar nuevamente' }, 429);
    await expect(account.resendRegistrationCode('javier@correo.com')).rejects.toThrow('Demasiados reenvíos');
  });
});

describe('Recuperacion de contrasena', () => {
  it('solicita el codigo de recuperacion', async () => {
    const fetchMock = mockFetchResponse({ message: 'Código de recuperación enviado.' });
    await account.requestPasswordReset('javier@correo.com');
    expect(sent(fetchMock)).toMatchObject({ url: `${API_URL}/api/auth/forgot-password`, body: { correoElectronico: 'javier@correo.com', canal: 'email' } });
  });

  it('informa cuando no existe la cuenta', async () => {
    mockFetchResponse({ message: 'No existe una cuenta con ese correo' }, 404);
    await expect(account.requestPasswordReset('nadie@correo.com')).rejects.toThrow('No existe una cuenta con ese correo');
  });

  it('verifica el codigo y guarda la nueva contrasena', async () => {
    let fetchMock = mockFetchResponse({ message: 'Código verificado correctamente' });
    await account.verifyRecoveryCode('javier@correo.com', '654321');
    expect(sent(fetchMock)).toMatchObject({ url: `${API_URL}/api/auth/verify-recovery-code`, body: { code: '654321' } });

    fetchMock = mockFetchResponse({ message: 'Contraseña actualizada exitosamente' });
    await account.resetPassword('javier@correo.com', 'nueva123');
    expect(sent(fetchMock)).toMatchObject({ url: `${API_URL}/api/auth/reset-password`, body: { correoElectronico: 'javier@correo.com', newPassword: 'nueva123' } });
  });
});

describe('Inicio de sesion con Google', () => {
  const { auth } = createRepositories();

  it('envia el access token de Google y devuelve la sesion del backend', async () => {
    const fetchMock = mockFetchResponse({
      token: 'jwt-carlyn',
      user: { nombre: 'Javier Flores', email: 'javier@gmail.com', telefono: null },
    });
    const result = await auth.loginWithGoogle('ya29.token-google');
    expect(sent(fetchMock)).toEqual({ url: `${API_URL}/api/auth/google`, method: 'POST', body: { googleToken: 'ya29.token-google' } });
    expect(result).toEqual({ token: 'jwt-carlyn', user: { name: 'Javier Flores', email: 'javier@gmail.com', phone: '' } });
  });

  it('rechaza una respuesta sin token de sesion', async () => {
    mockFetchResponse({ message: 'ok' });
    await expect(auth.loginWithGoogle('ya29.token-google')).rejects.toThrow('El servidor no devolvio una sesion valida.');
  });
});
