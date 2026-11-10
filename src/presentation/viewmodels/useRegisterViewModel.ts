// Registro de cuenta: datos personales -> codigo enviado al correo -> cuenta creada.
import { useState } from 'react';
import { repositories } from '../../data/repositories';
import { AccountRepository } from '../../data/repositories/AccountRepository';
import {
  AccountField,
  FieldErrors,
  REGISTRATION_CODE_SECONDS,
  RESEND_COOLDOWN_SECONDS,
  validateCode,
  validateNewAccount,
  validatePrivacyAcceptance,
} from '../../domain/account';
import { ActionResult, errorMessage } from './types';
import { useCountdown } from './useCountdown';

export type RegisterStep = 'form' | 'code';

const EMPTY_FORM: Record<AccountField, string> = { name: '', email: '', phone: '', password: '', confirmPassword: '', code: '' };

export function useRegisterViewModel(account: AccountRepository = repositories.account) {
  const [step, setStep] = useState<RegisterStep>('form');
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [passwordVisible, setPasswordVisible] = useState(false);
  // El aviso de privacidad se acepta de forma explicita: la casilla empieza sin marcar.
  const [acceptsPrivacy, setAcceptsPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const expiry = useCountdown();
  const cooldown = useCountdown();

  const setField = (field: AccountField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const startTimers = () => {
    expiry.start(REGISTRATION_CODE_SECONDS);
    cooldown.start(RESEND_COOLDOWN_SECONDS);
  };

  const submit = async (): Promise<ActionResult | null> => {
    const validation = { ...validateNewAccount(form, form.confirmPassword) };
    const privacyError = validatePrivacyAcceptance(acceptsPrivacy);
    if (privacyError) validation.privacy = privacyError;
    setErrors(validation);
    if (Object.keys(validation).length) return null;

    setLoading(true);
    try {
      await account.register(form);
      setForm((current) => ({ ...current, code: '' }));
      setStep('code');
      startTimers();
      return null;
    } catch (error) {
      return { ok: false, title: 'No fue posible crear la cuenta', message: errorMessage(error, 'Intenta nuevamente en unos minutos.') };
    } finally {
      setLoading(false);
    }
  };

  const verify = async (): Promise<ActionResult | null> => {
    const codeError = validateCode(form.code);
    setErrors({ code: codeError });
    if (codeError) return null;
    if (!expiry.running) {
      return { ok: false, title: 'El codigo vencio', message: 'Pide un codigo nuevo con "Reenviar codigo".' };
    }

    setLoading(true);
    try {
      await account.verifyRegistration(form.email, form.code, acceptsPrivacy);
      expiry.stop();
      return { ok: true, title: '¡Cuenta creada!', message: 'Ya puedes iniciar sesion con tu correo y contrasena.' };
    } catch (error) {
      return { ok: false, title: 'No pudimos verificar el codigo', message: errorMessage(error, 'Revisa el codigo e intenta de nuevo.') };
    } finally {
      setLoading(false);
    }
  };

  const resend = async (): Promise<ActionResult | null> => {
    if (cooldown.running) return null;
    setLoading(true);
    try {
      await account.resendRegistrationCode(form.email);
      setForm((current) => ({ ...current, code: '' }));
      startTimers();
      return { ok: true, title: 'Codigo reenviado', message: `Revisa la bandeja de entrada de ${form.email.trim()}.` };
    } catch (error) {
      return { ok: false, title: 'No fue posible reenviar el codigo', message: errorMessage(error, 'Intenta nuevamente.') };
    } finally {
      setLoading(false);
    }
  };

  const editData = () => {
    expiry.stop();
    setStep('form');
  };

  const reset = () => {
    setForm(EMPTY_FORM);
    setAcceptsPrivacy(false);
    setErrors({});
    setStep('form');
    expiry.stop();
    cooldown.stop();
  };

  return {
    step,
    form,
    errors,
    setField,
    passwordVisible,
    togglePasswordVisible: () => setPasswordVisible((current) => !current),
    acceptsPrivacy,
    toggleAcceptsPrivacy: () => {
      setAcceptsPrivacy((current) => !current);
      setErrors((current) => ({ ...current, privacy: undefined }));
    },
    loading,
    codeSecondsLeft: expiry.remaining,
    resendSecondsLeft: cooldown.remaining,
    submit,
    verify,
    resend,
    editData,
    reset,
  };
}

export type RegisterViewModel = ReturnType<typeof useRegisterViewModel>;
