// Recuperar contrasena: correo -> codigo enviado -> nueva contrasena.
import { useState } from 'react';
import { repositories } from '../../data/repositories';
import { AccountRepository } from '../../data/repositories/AccountRepository';
import {
  AccountField,
  compactErrors,
  FieldErrors,
  RECOVERY_CODE_SECONDS,
  RESEND_COOLDOWN_SECONDS,
  validateCode,
  validateConfirmation,
  validateEmail,
  validatePassword,
} from '../../domain/account';
import { ActionResult, errorMessage } from './types';
import { useCountdown } from './useCountdown';

export type RecoveryStep = 'email' | 'code' | 'password';

const EMPTY_FORM: Record<AccountField, string> = { name: '', email: '', phone: '', password: '', confirmPassword: '', code: '' };

export function useRecoveryViewModel(account: AccountRepository = repositories.account) {
  const [step, setStep] = useState<RecoveryStep>('email');
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const expiry = useCountdown();
  const cooldown = useCountdown();

  const setField = (field: AccountField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const startTimers = () => {
    expiry.start(RECOVERY_CODE_SECONDS);
    cooldown.start(RESEND_COOLDOWN_SECONDS);
  };

  const run = async (action: () => Promise<ActionResult | null>, failTitle: string): Promise<ActionResult | null> => {
    setLoading(true);
    try {
      return await action();
    } catch (error) {
      return { ok: false, title: failTitle, message: errorMessage(error, 'Intenta nuevamente.') };
    } finally {
      setLoading(false);
    }
  };

  const start = (email = '') => {
    setForm({ ...EMPTY_FORM, email });
    setErrors({});
    setStep('email');
    expiry.stop();
  };

  const requestCode = async () => {
    const emailError = validateEmail(form.email);
    setErrors({ email: emailError });
    if (emailError) return null;
    return run(async () => {
      await account.requestPasswordReset(form.email);
      setForm((current) => ({ ...current, code: '' }));
      setStep('code');
      startTimers();
      return null;
    }, 'No fue posible enviar el codigo');
  };

  const verifyCode = async () => {
    const codeError = validateCode(form.code);
    setErrors({ code: codeError });
    if (codeError) return null;
    if (!expiry.running) {
      return { ok: false, title: 'El codigo vencio', message: 'Pide un codigo nuevo con "Reenviar codigo".' };
    }
    return run(async () => {
      await account.verifyRecoveryCode(form.email, form.code);
      setStep('password');
      return null;
    }, 'No pudimos verificar el codigo');
  };

  const savePassword = async () => {
    const validation = compactErrors({
      password: validatePassword(form.password),
      confirmPassword: validateConfirmation(form.password, form.confirmPassword),
    });
    setErrors(validation);
    if (Object.keys(validation).length) return null;
    return run(async () => {
      await account.resetPassword(form.email, form.password);
      expiry.stop();
      return { ok: true, title: '¡Contrasena actualizada!', message: 'Ya puedes iniciar sesion con tu nueva contrasena.' };
    }, 'No fue posible cambiar la contrasena');
  };

  const resend = async () => {
    if (cooldown.running) return null;
    return run(async () => {
      await account.resendRecoveryCode(form.email);
      setForm((current) => ({ ...current, code: '' }));
      startTimers();
      return { ok: true, title: 'Codigo reenviado', message: `Revisa la bandeja de entrada de ${form.email.trim()}.` };
    }, 'No fue posible reenviar el codigo');
  };

  const editEmail = () => {
    expiry.stop();
    setStep('email');
  };

  return {
    step,
    form,
    errors,
    setField,
    passwordVisible,
    togglePasswordVisible: () => setPasswordVisible((current) => !current),
    loading,
    codeSecondsLeft: expiry.remaining,
    resendSecondsLeft: cooldown.remaining,
    start,
    requestCode,
    verifyCode,
    savePassword,
    resend,
    editEmail,
  };
}

export type RecoveryViewModel = ReturnType<typeof useRecoveryViewModel>;
