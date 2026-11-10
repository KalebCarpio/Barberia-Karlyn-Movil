import { View } from 'react-native';
import { formatCountdown } from '../../domain/account';
import { AuthHeader, AuthLayout, CodeField, Notice, PasswordField, PrimaryButton, TextField, TextLink } from '../components/forms';
import { useDialog } from '../feedback/DialogProvider';
import { styles } from '../theme/styles';
import { RecoveryViewModel } from '../viewmodels/useRecoveryViewModel';

type Props = { vm: RecoveryViewModel; onBack: () => void; onRecovered: (email: string) => void };

export function RecoveryScreen({ vm, onBack, onRecovered }: Props) {
  const dialog = useDialog();
  const { form, errors } = vm;

  const show = async (result: Awaited<ReturnType<typeof vm.resend>>) => {
    if (result) await dialog.notify(result);
  };

  const savePassword = async () => {
    const result = await vm.savePassword();
    if (!result) return;
    await dialog.notify(result);
    if (result.ok) onRecovered(form.email.trim());
  };

  if (vm.step === 'password') {
    return (
      <AuthLayout>
        <AuthHeader step={3} totalSteps={3} title="Nueva contrasena" subtitle="Elige una contrasena que no hayas usado antes." onBack={vm.editEmail} />
        <PasswordField label="Nueva contrasena" value={form.password} onChangeText={(value) => vm.setField('password', value)} error={errors.password} placeholder="Minimo 6 caracteres" visible={vm.passwordVisible} onToggle={vm.togglePasswordVisible} textContentType="newPassword" />
        <PasswordField label="Confirmar contrasena" value={form.confirmPassword} onChangeText={(value) => vm.setField('confirmPassword', value)} error={errors.confirmPassword} placeholder="Repite tu contrasena" visible={vm.passwordVisible} onToggle={vm.togglePasswordVisible} textContentType="newPassword" />
        <PrimaryButton label="Guardar contrasena" loading={vm.loading} onPress={savePassword} />
      </AuthLayout>
    );
  }

  if (vm.step === 'code') {
    return (
      <AuthLayout>
        <AuthHeader step={2} totalSteps={3} title="Revisa tu correo" subtitle={`Enviamos un codigo de 6 digitos a ${form.email.trim()}.`} onBack={vm.editEmail} />
        <CodeField value={form.code} onChangeText={(value) => vm.setField('code', value)} error={errors.code} />
        {vm.codeSecondsLeft > 0
          ? <Notice icon="time-outline" text={`El codigo vence en ${formatCountdown(vm.codeSecondsLeft)}`} />
          : <Notice icon="alert-circle-outline" tone="danger" text="El codigo vencio. Pide uno nuevo." />}
        <Notice icon="mail-unread-outline" text="Si no lo ves, revisa la carpeta de spam o promociones." />
        <PrimaryButton label="Verificar codigo" loading={vm.loading} onPress={async () => show(await vm.verifyCode())} />
        <View style={styles.loginOptions}>
          <TextLink label="Cambiar correo" onPress={vm.editEmail} />
          <TextLink
            label={vm.resendSecondsLeft > 0 ? `Reenviar en ${vm.resendSecondsLeft} s` : 'Reenviar codigo'}
            onPress={async () => show(await vm.resend())}
            disabled={vm.resendSecondsLeft > 0 || vm.loading}
          />
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthHeader step={1} totalSteps={3} title="Recupera tu acceso" subtitle="Escribe el correo de tu cuenta y te enviaremos un codigo." onBack={onBack} />
      <TextField label="Correo electronico" icon="mail-outline" value={form.email} onChangeText={(value) => vm.setField('email', value)} error={errors.email} placeholder="nombre@correo.com" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" />
      <PrimaryButton label="Enviar codigo" loading={vm.loading} onPress={async () => show(await vm.requestCode())} />
    </AuthLayout>
  );
}
