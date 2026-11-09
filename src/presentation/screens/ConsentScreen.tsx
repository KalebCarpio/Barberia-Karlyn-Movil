import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Linking, StyleSheet, Text, View } from 'react-native';
import { PRIVACY_NOTICE_URL } from '../../domain/privacy';
import { AuthLayout, ConsentCheckbox, PrimaryButton, TextLink } from '../components/forms';
import { brandLogo } from '../components/ui';
import { useDialog } from '../feedback/DialogProvider';
import { colors, styles } from '../theme/styles';
import { PrivacyViewModel } from '../viewmodels/usePrivacyViewModel';

// Se muestra despues de iniciar sesion a quien todavia no acepta el aviso (cuentas creadas antes de este cambio).
export function ConsentScreen({ vm, onSignOut }: { vm: PrivacyViewModel; onSignOut: () => void }) {
  const dialog = useDialog();
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string>();

  const accept = async () => {
    if (!checked) {
      setError('Marca la casilla para continuar.');
      return;
    }
    const result = await vm.acceptNotice();
    if (result) await dialog.notify(result);
  };

  return (
    <AuthLayout>
      <Image source={brandLogo} style={styles.loginLogo} resizeMode="contain" />
      <View style={consent.icon}><Ionicons name="shield-checkmark-outline" size={30} color={colors.gold} /></View>
      <Text style={styles.loginTitle}>Tu privacidad importa</Text>
      <Text style={styles.loginLead}>Actualizamos nuestro Aviso de Privacidad. Para seguir usando Carlyn, revisalo y aceptalo.</Text>
      <View style={consent.points}>
        <Point text="Usamos tus datos para tu cuenta, tus citas y tus pagos." />
        <Point text="Puedes desactivar recordatorios, estadisticas y promociones." />
        <Point text="Puedes ver, corregir o eliminar tus datos desde tu perfil." />
      </View>
      <ConsentCheckbox checked={checked} onToggle={() => { setChecked((current) => !current); setError(undefined); }} error={error}>
        He leido y acepto el <Text style={styles.link} onPress={() => void Linking.openURL(PRIVACY_NOTICE_URL)}>Aviso de Privacidad</Text>.
      </ConsentCheckbox>
      <PrimaryButton label="Aceptar y continuar" loading={vm.accepting} onPress={accept} />
      <View style={consent.signOut}><TextLink label="Cerrar sesion" onPress={onSignOut} /></View>
    </AuthLayout>
  );
}

function Point({ text }: { text: string }) {
  return (
    <View style={consent.point}>
      <Ionicons name="checkmark-circle" size={18} color={colors.green} />
      <Text style={consent.pointText}>{text}</Text>
    </View>
  );
}

const consent = StyleSheet.create({
  icon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.goldPale, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  points: { gap: 10, marginTop: 4 },
  point: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  pointText: { flex: 1, color: colors.ink, fontSize: 14, lineHeight: 20 },
  signOut: { alignItems: 'center', marginTop: 18 },
});
