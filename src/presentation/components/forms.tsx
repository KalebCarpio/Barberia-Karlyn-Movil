import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CODE_LENGTH } from '../../domain/account';
import { colors, styles } from '../theme/styles';
import { brandLogo } from './ui';

// Contenedor de las pantallas sin sesion: margenes seguros, desplazamiento y teclado.
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={forms.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={forms.page}>{children}</ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type AuthHeaderProps = { title: string; subtitle: string; onBack: () => void; step?: number; totalSteps?: number };

export function AuthHeader({ title, subtitle, onBack, step, totalSteps }: AuthHeaderProps) {
  return (
    <View style={forms.header}>
      <View style={forms.headerTop}>
        <Pressable onPress={onBack} hitSlop={12} style={forms.back} accessibilityRole="button" accessibilityLabel="Regresar">
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <Image source={brandLogo} style={forms.logo} resizeMode="contain" />
      </View>
      {step && totalSteps ? (
        <View style={forms.steps} accessibilityLabel={`Paso ${step} de ${totalSteps}`}>
          {Array.from({ length: totalSteps }, (_, index) => <View key={index} style={[forms.stepBar, index < step && forms.stepBarActive]} />)}
        </View>
      ) : null}
      <Text style={forms.title}>{title}</Text>
      <Text style={forms.subtitle}>{subtitle}</Text>
    </View>
  );
}

type TextFieldProps = TextInputProps & { label: string; error?: string; icon?: keyof typeof Ionicons.glyphMap };

export function TextField({ label, error, icon, style, ...inputProps }: TextFieldProps) {
  return (
    <View style={forms.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[forms.inputWrap, error && forms.inputError]}>
        {icon ? <Ionicons name={icon} size={19} color={colors.subtle} style={forms.inputIcon} /> : null}
        <TextInput placeholderTextColor={colors.subtle} style={[forms.input, style]} {...inputProps} />
      </View>
      {error ? <FieldError message={error} /> : null}
    </View>
  );
}

type PasswordFieldProps = TextInputProps & { label: string; error?: string; visible: boolean; onToggle: () => void };

export function PasswordField({ label, error, visible, onToggle, ...inputProps }: PasswordFieldProps) {
  return (
    <View style={forms.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[forms.inputWrap, error && forms.inputError]}>
        <Ionicons name="lock-closed-outline" size={19} color={colors.subtle} style={forms.inputIcon} />
        <TextInput secureTextEntry={!visible} autoCapitalize="none" placeholderTextColor={colors.subtle} style={forms.input} {...inputProps} />
        <Pressable onPress={onToggle} hitSlop={12} style={styles.passwordToggle} accessibilityRole="button" accessibilityLabel={visible ? 'Ocultar contrasena' : 'Mostrar contrasena'}>
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={21} color={colors.gold} />
        </Pressable>
      </View>
      {error ? <FieldError message={error} /> : null}
    </View>
  );
}

// Campo grande para el codigo de 6 digitos; el sistema puede sugerirlo desde el correo o SMS.
export function CodeField({ value, onChangeText, error }: { value: string; onChangeText: (value: string) => void; error?: string }) {
  return (
    <View style={forms.field}>
      <TextInput
        value={value}
        onChangeText={(text) => onChangeText(text.replace(/\D/g, '').slice(0, CODE_LENGTH))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={CODE_LENGTH}
        placeholder={'0'.repeat(CODE_LENGTH)}
        placeholderTextColor={colors.border}
        style={[forms.code, error && forms.inputError]}
        accessibilityLabel={`Codigo de ${CODE_LENGTH} digitos`}
      />
      {error ? <FieldError message={error} /> : null}
    </View>
  );
}

function FieldError({ message }: { message: string }) {
  return (
    <View style={forms.errorRow}>
      <Ionicons name="alert-circle" size={15} color={colors.red} />
      <Text style={forms.errorText}>{message}</Text>
    </View>
  );
}

export function PrimaryButton({ label, loading, onPress }: { label: string; loading?: boolean; onPress: () => void }) {
  return (
    <Pressable disabled={loading} onPress={onPress} style={({ pressed }) => [styles.goldButton, (loading || pressed) && styles.disabled]} accessibilityRole="button">
      {loading ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.goldButtonText}>{label}</Text>}
    </Pressable>
  );
}

export function TextLink({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={8} accessibilityRole="button">
      <Text style={[styles.link, disabled && forms.linkDisabled]}>{label}</Text>
    </Pressable>
  );
}

// Aviso con icono: vigencia del codigo o recomendaciones.
export function Notice({ icon, text, tone = 'muted' }: { icon: keyof typeof Ionicons.glyphMap; text: string; tone?: 'muted' | 'danger' }) {
  const color = tone === 'danger' ? colors.red : colors.muted;
  return (
    <View style={forms.notice}>
      <Ionicons name={icon} size={17} color={color} />
      <Text style={[forms.noticeText, { color }]}>{text}</Text>
    </View>
  );
}

const forms = StyleSheet.create({
  flex: { flex: 1 },
  page: { flexGrow: 1, padding: 24, paddingBottom: 40 },
  header: { marginBottom: 8 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  back: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 130, height: 44 },
  steps: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  stepBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  stepBarActive: { backgroundColor: colors.gold },
  title: { color: colors.ink, fontSize: 30, lineHeight: 36, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 8 },
  field: { marginTop: 4 },
  inputWrap: { height: 52, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.paper, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  inputError: { borderColor: colors.red, backgroundColor: '#FFF7F8' },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: '100%', color: colors.ink, fontSize: 15 },
  code: {
    height: 68,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.gold,
    backgroundColor: colors.paper,
    textAlign: 'center',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 12,
    color: colors.ink,
    marginTop: 22,
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  errorText: { color: colors.red, fontSize: 12, fontWeight: '700', flex: 1 },
  linkDisabled: { color: colors.subtle },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 14 },
  noticeText: { fontSize: 13, fontWeight: '600', flex: 1 },
});
