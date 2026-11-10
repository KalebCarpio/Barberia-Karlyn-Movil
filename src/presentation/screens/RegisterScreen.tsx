import { Linking, Text, View } from 'react-native';
import { formatCountdown } from '../../domain/account';
import { PRIVACY_NOTICE_URL } from '../../domain/privacy';
import { AuthHeader, AuthLayout, CodeField, ConsentCheckbox, Notice, PasswordField, PrimaryButton, TextField, TextLink } from '../components/forms';
import { useDialog } from '../feedback/DialogProvider';
import { styles } from '../theme/styles';
import { RegisterViewModel } from '../viewmodels/useRegisterViewModel';

type Props = { vm: RegisterViewModel; onBack: () => void; onRegistered: (email: string) => void };

export function RegisterScreen({ vm, onBack, onRegistered }: Props) {
  const dialog = useDialog();
  const { form, errors } = vm;

  const submit = async () => {
    const result = await vm.submit();
    if (result) await dialog.notify(result);
  };

  const verify = async () => {
    const result = await vm.verify();
    if (!result) return;
    await dialog.notify(result);
    if (result.ok) {
      const email = form.email.trim();
      vm.reset();
      onRegistered(email);
    }
  };

  const resend = async () => {
    const result = await vm.resend();
    if (result) await dialog.notify(result);
  };

  if (vm.step === 'code') {
    return (
      <AuthLayout>
        <AuthHeader step={2} totalSteps={2} title="Verifica tu correo" subtitle={`Enviamos un codigo de 6 digitos a ${form.email.trim()}.`} onBack={vm.editData} />
        <CodeField value={form.code} onChangeText={(value) => vm.setField('code', value)} error={errors.code} />
        {vm.codeSecondsLeft > 0
          ? <Notice icon="time-outline" text={`El codigo vence en ${formatCountdown(vm.codeSecondsLeft)}`} />
          : <Notice icon="alert-circle-outline" tone="danger" text="El codigo vencio. Pide uno nuevo." />}
        <Notice icon="mail-unread-outline" text="Si no lo ves, revisa la carpeta de spam o promociones." />
        <PrimaryButton label="Verificar y crear cuenta" loading={vm.loading} onPress={verify} />
        <View style={styles.loginOptions}>
          <TextLink label="Cambiar mis datos" onPress={vm.editData} />
          <TextLink
            label={vm.resendSecondsLeft > 0 ? `Reenviar en ${vm.resendSecondsLeft} s` : 'Reenviar codigo'}
            onPress={resend}
            disabled={vm.resendSecondsLeft > 0 || vm.loading}
          />
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthHeader step={1} totalSteps={2} title="Crea tu cuenta" subtitle="Reserva y administra tus citas en Carlyn." onBack={onBack} />
      <TextField label="Nombre completo" icon="person-outline" value={form.name} onChangeText={(value) => vm.setField('name', value)} error={errors.name} placeholder="Tu nombre y apellidos" autoCapitalize="words" textContentType="name" />
      <TextField label="Correo electronico" icon="mail-outline" value={form.email} onChangeText={(value) => vm.setField('email', value)} error={errors.email} placeholder="nombre@correo.com" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" />
      <TextField label="Telefono" icon="call-outline" value={form.phone} onChangeText={(value) => vm.setField('phone', value.replace(/\D/g, ''))} error={errors.phone} placeholder="10 digitos" keyboardType="phone-pad" maxLength={10} textContentType="telephoneNumber" />
      <PasswordField label="Contrasena" value={form.password} onChangeText={(value) => vm.setField('password', value)} error={errors.password} placeholder="Minimo 6 caracteres" visible={vm.passwordVisible} onToggle={vm.togglePasswordVisible} textContentType="newPassword" />
      <PasswordField label="Confirmar contrasena" value={form.confirmPassword} onChangeText={(value) => vm.setField('confirmPassword', value)} error={errors.confirmPassword} placeholder="Repite tu contrasena" visible={vm.passwordVisible} onToggle={vm.togglePasswordVisible} textContentType="newPassword" />
      <ConsentCheckbox checked={vm.acceptsPrivacy} onToggle={vm.toggleAcceptsPrivacy} error={errors.privacy}>
        He leido y acepto el <Text style={styles.link} onPress={() => void Linking.openURL(PRIVACY_NOTICE_URL)}>Aviso de Privacidad</Text> de Barberia Carlyn.
      </ConsentCheckbox>
      <PrimaryButton label="Continuar" loading={vm.loading} onPress={submit} />
      <Text style={styles.registerText}>¿Ya tienes cuenta? <Text style={styles.link} onPress={onBack}>Inicia sesion</Text></Text>
    </AuthLayout>
  );
}
