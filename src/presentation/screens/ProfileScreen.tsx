import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { Header } from '../components/ui';
import { colors, styles } from '../theme/styles';
import { SessionViewModel } from '../viewmodels/useSessionViewModel';

export function ProfileScreen({ vm }: { vm: SessionViewModel }) {
  const save = async () => {
    const result = await vm.saveProfile();
    if (result) Alert.alert(result.title, result.message);
  };

  return (
    <>
      <Header eyebrow="CUENTA" title="Mi perfil" />
      <View style={styles.avatar}><Text style={styles.avatarText}>{vm.name.slice(0, 1).toUpperCase() || 'C'}</Text></View>
      <Text style={styles.profileName}>{vm.name || 'Cliente Carlyn'}</Text>
      <Text style={styles.email}>{vm.email}</Text>
      <Text style={styles.label}>Nombre completo</Text>
      <TextInput value={vm.name} onChangeText={vm.setName} placeholder="Tu nombre" placeholderTextColor={colors.subtle} style={styles.input} />
      <Text style={styles.label}>Telefono</Text>
      <TextInput value={vm.phone} onChangeText={vm.setPhone} keyboardType="phone-pad" placeholder="Tu telefono" placeholderTextColor={colors.subtle} style={styles.input} />
      <Pressable onPress={save} style={styles.goldButton}><Text style={styles.goldButtonText}>Guardar cambios</Text></Pressable>
      <Pressable onPress={() => void vm.signOut()} style={styles.logout}><Text style={styles.cancelText}>Cerrar sesion</Text></Pressable>
    </>
  );
}
