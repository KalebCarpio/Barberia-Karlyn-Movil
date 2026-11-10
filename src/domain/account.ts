// Reglas de registro y recuperacion de cuenta: las mismas que valida el backend, para avisar antes de enviar.

export const CODE_LENGTH = 6;
export const MIN_PASSWORD_LENGTH = 6;
// Vigencia de los codigos segun el backend: 4 minutos para registro y 10 para recuperacion.
export const REGISTRATION_CODE_SECONDS = 4 * 60;
export const RECOVERY_CODE_SECONDS = 10 * 60;
// Espera minima entre reenvios de codigo que aplica el backend.
export const RESEND_COOLDOWN_SECONDS = 30;

export type NewAccount = { name: string; email: string; phone: string; password: string };

export type AccountField = 'name' | 'email' | 'phone' | 'password' | 'confirmPassword' | 'code';
export type FieldErrors = Partial<Record<AccountField | 'privacy', string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateName(name: string) {
  return name.trim().length >= 3 ? undefined : 'Escribe tu nombre completo (minimo 3 letras).';
}

export function validateEmail(email: string) {
  if (!email.trim()) return 'Escribe tu correo electronico.';
  return EMAIL_PATTERN.test(email.trim()) ? undefined : 'Revisa el formato del correo.';
}

export function validatePhone(phone: string) {
  return /^[0-9]{10}$/.test(phone.replace(/\D/g, '')) ? undefined : 'El telefono debe tener 10 digitos.';
}

export function validatePassword(password: string) {
  return password.length >= MIN_PASSWORD_LENGTH ? undefined : `La contrasena debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
}

export function validateConfirmation(password: string, confirmation: string) {
  return password === confirmation ? undefined : 'Las contrasenas no coinciden.';
}

export function validateCode(code: string) {
  return new RegExp(`^[0-9]{${CODE_LENGTH}}$`).test(code.trim()) ? undefined : `Escribe el codigo de ${CODE_LENGTH} digitos.`;
}

// Quita los campos sin error para saber si el formulario es valido.
export function compactErrors(errors: FieldErrors): FieldErrors {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => Boolean(message))) as FieldErrors;
}

export function validateNewAccount(account: NewAccount, confirmation: string): FieldErrors {
  return compactErrors({
    name: validateName(account.name),
    email: validateEmail(account.email),
    phone: validatePhone(account.phone),
    password: validatePassword(account.password),
    confirmPassword: validateConfirmation(account.password, confirmation),
  });
}

export function validatePrivacyAcceptance(accepted: boolean) {
  return accepted ? undefined : 'Para crear tu cuenta debes aceptar el Aviso de Privacidad.';
}

export function formatCountdown(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}
