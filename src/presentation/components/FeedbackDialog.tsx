import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/styles';
import { ResultDetail } from '../viewmodels/types';

export type DialogVariant = 'success' | 'error' | 'confirm' | 'info';

const variants: Record<DialogVariant, { icon: keyof typeof Ionicons.glyphMap; color: string; background: string }> = {
  success: { icon: 'checkmark', color: colors.green, background: '#E3F3EA' },
  error: { icon: 'close', color: colors.red, background: '#FBE7EA' },
  confirm: { icon: 'help', color: colors.gold, background: colors.goldPale },
  info: { icon: 'sparkles', color: colors.gold, background: colors.goldPale },
};

type Props = {
  visible: boolean;
  variant: DialogVariant;
  title: string;
  message: string;
  details?: ResultDetail[];
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

// Dialogo con la identidad visual de Carlyn: reemplaza las alertas del sistema.
export function FeedbackDialog({ visible, variant, title, message, details, confirmLabel, cancelLabel, destructive, onConfirm, onCancel }: Props) {
  const scale = useRef(new Animated.Value(0.9)).current;
  const { icon, color, background } = variants[variant];

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0.9);
    Animated.spring(scale, { toValue: 1, friction: 7, tension: 90, useNativeDriver: true }).start();
  }, [visible, scale]);

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <View style={dialog.backdrop}>
        <Animated.View style={[dialog.card, { transform: [{ scale }] }]} accessibilityRole="alert">
          <View style={[dialog.iconRing, { backgroundColor: background }]}>
            <View style={[dialog.iconCircle, { backgroundColor: color }]}>
              <Ionicons name={icon} size={30} color={colors.paper} />
            </View>
          </View>
          <Text style={dialog.title}>{title}</Text>
          <Text style={dialog.message}>{message}</Text>
          {details?.length ? (
            <View style={dialog.details}>
              {details.map((detail) => (
                <View key={detail.label} style={dialog.detailRow}>
                  <Text style={dialog.detailLabel}>{detail.label}</Text>
                  <Text style={dialog.detailValue} numberOfLines={1}>{detail.value}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <Pressable onPress={onConfirm} style={({ pressed }) => [dialog.primary, destructive && dialog.primaryDestructive, pressed && dialog.pressed]} accessibilityRole="button">
            <Text style={[dialog.primaryText, destructive && dialog.primaryTextDestructive]}>{confirmLabel}</Text>
          </Pressable>
          {cancelLabel ? (
            <Pressable onPress={onCancel} style={({ pressed }) => [dialog.secondary, pressed && dialog.pressed]} accessibilityRole="button">
              <Text style={dialog.secondaryText}>{cancelLabel}</Text>
            </Pressable>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

// Capa que bloquea la pantalla mientras se guarda algo en el servidor.
export function LoadingOverlay({ visible, label }: { visible: boolean; label: string }) {
  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={dialog.backdrop}>
        <View style={dialog.loadingCard}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={dialog.loadingText}>{label}</Text>
        </View>
      </View>
    </Modal>
  );
}

const dialog = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(24, 24, 24, 0.62)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.paper,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  iconRing: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  iconCircle: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.ink, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  message: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 8 },
  details: { alignSelf: 'stretch', backgroundColor: colors.canvas, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 6, marginTop: 18 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  detailLabel: { color: colors.muted, fontSize: 13 },
  detailValue: { flex: 1, textAlign: 'right', color: colors.ink, fontSize: 13, fontWeight: '800' },
  primary: { alignSelf: 'stretch', height: 52, borderRadius: 12, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  primaryDestructive: { backgroundColor: colors.red },
  primaryText: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  primaryTextDestructive: { color: colors.paper },
  secondary: { alignSelf: 'stretch', height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  secondaryText: { color: colors.muted, fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.75 },
  loadingCard: { backgroundColor: colors.paper, borderRadius: 20, paddingVertical: 26, paddingHorizontal: 34, alignItems: 'center', gap: 14, elevation: 12 },
  loadingText: { color: colors.ink, fontSize: 15, fontWeight: '800' },
});
