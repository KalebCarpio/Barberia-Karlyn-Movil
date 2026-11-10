import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { DELETE_CONFIRMATION, PRIVACY_NOTICE_URL, PRIVACY_PREFERENCES } from '../../domain/privacy';
import { Header, Loading, Summary } from '../components/ui';
import { useDialog } from '../feedback/DialogProvider';
import { colors, styles } from '../theme/styles';
import { PrivacyViewModel } from '../viewmodels/usePrivacyViewModel';

type Props = {
  vm: PrivacyViewModel;
  profile: { name: string; email: string; phone: string };
  appointmentCount: number;
  onEditProfile: () => void;
  onBack: () => void;
  // Al activar recordatorios se pide (a demanda) el permiso de notificaciones del telefono.
  onRemindersEnabled: () => Promise<boolean>;
};

function formatAcceptedAt(value: string) {
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
}

function Section({ icon, title, subtitle, children }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <View style={privacy.section}>
      <View style={privacy.sectionHead}>
        <View style={privacy.sectionIcon}><Ionicons name={icon} size={18} color={colors.gold} /></View>
        <View style={privacy.flex}>
          <Text style={privacy.sectionTitle}>{title}</Text>
          <Text style={privacy.sectionSubtitle}>{subtitle}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

// Derechos ARCO: Acceso (mis datos), Rectificacion (editar perfil), Oposicion (switches) y Cancelacion (eliminar cuenta).
export function PrivacyScreen({ vm, profile, appointmentCount, onEditProfile, onBack, onRemindersEnabled }: Props) {
  const dialog = useDialog();

  const toggle = async (key: (typeof PRIVACY_PREFERENCES)[number]['key'], enabled: boolean) => {
    const result = await vm.setPreference(key, enabled);
    if (result) await dialog.notify(result);
    else if (key === 'reminders' && enabled) await onRemindersEnabled();
  };

  const deleteAccount = async () => {
    const accepted = await dialog.confirm({
      title: '¿Eliminar tu cuenta?',
      message: 'Esta accion no se puede deshacer. Borraremos tus datos personales y cancelaremos tus citas futuras.',
      confirmLabel: 'Si, eliminar mi cuenta',
      cancelLabel: 'No, conservarla',
      destructive: true,
    });
    if (!accepted) return;
    const result = await vm.deleteAccount();
    if (result) await dialog.notify(result);
  };

  return (
    <>
      <Pressable onPress={onBack} style={privacy.back} accessibilityRole="button" accessibilityLabel="Regresar al perfil">
        <Ionicons name="chevron-back" size={18} color={colors.ink} />
        <Text style={privacy.backText}>Perfil</Text>
      </Pressable>
      <Header eyebrow="TUS DERECHOS ARCO" title="Privacidad y datos" />

      <Section icon="document-text-outline" title="Aviso de privacidad" subtitle="Como usamos y protegemos tus datos.">
        <Text style={styles.helperText}>
          {vm.settings?.acceptedAt ? `Lo aceptaste el ${formatAcceptedAt(vm.settings.acceptedAt)}.` : 'Aun no has aceptado el aviso.'}
        </Text>
        <Pressable onPress={() => void Linking.openURL(PRIVACY_NOTICE_URL)} style={privacy.linkRow} accessibilityRole="link">
          <Text style={styles.link}>Leer el aviso completo</Text>
          <Ionicons name="open-outline" size={15} color={colors.gold} />
        </Pressable>
      </Section>

      <Section icon="person-circle-outline" title="Mis datos" subtitle="Acceso: lo que guardamos de ti.">
        <Summary label="Nombre" value={profile.name || '—'} />
        <Summary label="Correo" value={profile.email || '—'} />
        <Summary label="Telefono" value={profile.phone || 'Sin registrar'} />
        <Summary label="Citas registradas" value={String(appointmentCount)} />
        <Pressable onPress={onEditProfile} style={privacy.linkRow} accessibilityRole="button">
          <Text style={styles.link}>Corregir mis datos</Text>
          <Ionicons name="create-outline" size={15} color={colors.gold} />
        </Pressable>
      </Section>

      <Section icon="options-outline" title="Usos opcionales" subtitle="Oposicion: desactiva lo que no quieras.">
        {vm.loading && !vm.settings ? <Loading label="Consultando tus preferencias..." /> : null}
        {vm.loadError && !vm.settings ? (
          <View>
            <Text style={styles.warning}>{vm.loadError}</Text>
            <Pressable onPress={() => void vm.reload()} style={privacy.linkRow}><Text style={styles.link}>Reintentar</Text></Pressable>
          </View>
        ) : null}
        {vm.settings ? PRIVACY_PREFERENCES.map(({ key, title, description }) => (
          <View key={key} style={privacy.switchRow}>
            <View style={privacy.flex}>
              <Text style={privacy.switchTitle}>{title}</Text>
              <Text style={privacy.switchDescription}>{description}</Text>
            </View>
            {vm.saving === key ? <ActivityIndicator color={colors.gold} /> : null}
            <Switch
              value={vm.settings![key]}
              onValueChange={(enabled) => void toggle(key, enabled)}
              disabled={vm.saving !== null}
              trackColor={{ true: colors.gold, false: colors.border }}
              thumbColor={colors.paper}
              accessibilityLabel={title}
            />
          </View>
        )) : null}
      </Section>

      <View style={[privacy.section, privacy.danger]}>
        <View style={privacy.sectionHead}>
          <View style={[privacy.sectionIcon, privacy.dangerIcon]}><Ionicons name="trash-outline" size={18} color={colors.red} /></View>
          <View style={privacy.flex}>
            <Text style={privacy.sectionTitle}>Eliminar mi cuenta</Text>
            <Text style={privacy.sectionSubtitle}>Cancelacion: borra tus datos personales.</Text>
          </View>
        </View>
        <Text style={styles.helperText}>Se cancelaran tus citas futuras. El registro anonimo de citas pasadas se conserva para la contabilidad de la barberia.</Text>
        <Text style={styles.label}>Escribe {DELETE_CONFIRMATION} para confirmar</Text>
        <TextInput
          value={vm.deleteText}
          onChangeText={vm.setDeleteText}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder={DELETE_CONFIRMATION}
          placeholderTextColor={colors.subtle}
          style={styles.input}
          accessibilityLabel={`Escribe ${DELETE_CONFIRMATION} para confirmar`}
        />
        <Pressable
          disabled={!vm.canDelete || vm.deleting}
          onPress={deleteAccount}
          style={[privacy.deleteButton, (!vm.canDelete || vm.deleting) && styles.disabled]}
          accessibilityRole="button"
        >
          {vm.deleting ? <ActivityIndicator color={colors.paper} /> : <Text style={privacy.deleteText}>Eliminar mi cuenta</Text>}
        </Pressable>
      </View>
    </>
  );
}

const privacy = StyleSheet.create({
  flex: { flex: 1 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingVertical: 6, marginBottom: 4 },
  backText: { color: colors.ink, fontWeight: '800', fontSize: 14 },
  section: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, marginBottom: 14 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  sectionIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.goldPale, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  sectionSubtitle: { color: colors.muted, fontSize: 12, marginTop: 2 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, marginTop: 6 },
  switchTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  switchDescription: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  danger: { borderColor: '#E5B4BA' },
  dangerIcon: { backgroundColor: '#FBE7EA' },
  deleteButton: { height: 50, borderRadius: 10, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  deleteText: { color: colors.paper, fontSize: 15, fontWeight: '900' },
});
