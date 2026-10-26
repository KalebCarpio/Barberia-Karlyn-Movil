import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { brandLogo } from '../components/ui';
import { useDialog } from '../feedback/DialogProvider';
import { colors, styles } from '../theme/styles';
import { SessionViewModel } from '../viewmodels/useSessionViewModel';

export function LoginScreen({ vm }: { vm: SessionViewModel }) {
  const dialog = useDialog();

  const signIn = async () => {
    const result = await vm.signIn();
    if (result) await dialog.notify(result);
  };

  return (
    <SafeAreaView style={styles.safe}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.login}>
      <Image source={brandLogo} style={styles.loginLogo} resizeMode="contain" />
      <Text style={styles.loginTitle}>Tu corte, a tu manera.</Text>
      <Text style={styles.loginLead}>Accede para reservar, consultar y administrar tus citas.</Text>
      <Text style={styles.label}>Correo electronico</Text>
      <TextInput value={vm.email} onChangeText={vm.setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="nombre@correo.com" placeholderTextColor={colors.subtle} style={styles.input} />
      <Text style={styles.label}>Contrasena</Text>
      <View style={styles.passwordWrap}><TextInput value={vm.password} onChangeText={vm.setPassword} secureTextEntry={!vm.passwordVisible} placeholder="Tu contrasena" placeholderTextColor={colors.subtle} style={styles.passwordInput} /><Pressable onPress={vm.togglePasswordVisible} hitSlop={12} style={styles.passwordToggle} accessibilityRole="button" accessibilityLabel={vm.passwordVisible ? 'Ocultar contrasena' : 'Mostrar contrasena'}><Ionicons name={vm.passwordVisible ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.gold} /></Pressable></View>
      <View style={styles.loginOptions}><Text style={styles.remember}>La sesion se guardara en este dispositivo</Text><Text style={styles.link}>Olvide mi contrasena</Text></View>
      <Pressable disabled={vm.loadingLogin} onPress={signIn} style={[styles.goldButton, vm.loadingLogin && styles.disabled]}>{vm.loadingLogin ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.goldButtonText}>Iniciar sesion</Text>}</Pressable>
      <View style={styles.divider}><View style={styles.dividerLine} /><Text style={styles.dividerText}>o continua con</Text><View style={styles.dividerLine} /></View>
      <Pressable style={styles.googleButton} onPress={() => void dialog.info('Proximamente', 'El acceso con Google se integrara con el cliente OAuth movil del proyecto.')}><Text style={styles.googleText}>Continuar con Google</Text></Pressable>
      <Text style={styles.registerText}>No tienes cuenta? <Text style={styles.link}>Registrate desde el sitio web</Text></Text>
    </ScrollView></SafeAreaView>
  );
}
