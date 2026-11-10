// Caja blanca, dominio: reglas de registro y recuperacion iguales a las del backend.
import {
  formatCountdown,
  validateCode,
  validateEmail,
  validateNewAccount,
  validatePhone,
} from '../../../src/domain/account';

const valid = { name: 'Javier Flores', email: 'javier@correo.com', phone: '7712426663', password: 'secreto1' };

describe('Reglas de cuenta', () => {
  it('acepta una cuenta completa y valida', () => {
    expect(validateNewAccount(valid, 'secreto1')).toEqual({});
  });

  it('reporta cada campo invalido con su mensaje', () => {
    expect(validateNewAccount({ name: 'Jo', email: 'correo-sin-arroba', phone: '123', password: '123' }, 'otra')).toEqual({
      name: 'Escribe tu nombre completo (minimo 3 letras).',
      email: 'Revisa el formato del correo.',
      phone: 'El telefono debe tener 10 digitos.',
      password: 'La contrasena debe tener al menos 6 caracteres.',
      confirmPassword: 'Las contrasenas no coinciden.',
    });
  });

  it('pide el correo cuando viene vacio', () => {
    expect(validateEmail('   ')).toBe('Escribe tu correo electronico.');
  });

  it('ignora espacios y guiones al validar el telefono', () => {
    expect(validatePhone('771 242-6663')).toBeUndefined();
  });

  it('exige un codigo de exactamente 6 digitos', () => {
    expect(validateCode('123456')).toBeUndefined();
    expect(validateCode('12345')).toBe('Escribe el codigo de 6 digitos.');
    expect(validateCode('12a456')).toBe('Escribe el codigo de 6 digitos.');
  });

  it('formatea la cuenta regresiva en minutos y segundos', () => {
    expect(formatCountdown(240)).toBe('4:00');
    expect(formatCountdown(65)).toBe('1:05');
    expect(formatCountdown(-3)).toBe('0:00');
  });
});
