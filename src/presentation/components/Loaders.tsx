import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/styles';
import { brandLogo } from './ui';

function useLoop(duration: number) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(value, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [value, duration]);
  return value;
}

// Pantalla de arranque mientras se revisa la sesion guardada.
export function SplashLoader() {
  const pulse = useLoop(1600);
  const progress = useLoop(1200);
  const scale = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.96, 1.03, 0.96] });
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-60, 160] });

  return (
    <View style={loaders.splash}>
      <Animated.Image source={brandLogo} resizeMode="contain" style={[loaders.splashLogo, { transform: [{ scale }] }]} />
      <View style={loaders.track}>
        <Animated.View style={[loaders.bar, { transform: [{ translateX }] }]} />
      </View>
      <Text style={loaders.splashText}>Preparando tu experiencia</Text>
    </View>
  );
}

// Tarjeta gris con brillo intermitente mientras llega la informacion de la API.
export function SkeletonCard({ variant = 'service' }: { variant?: 'service' | 'appointment' }) {
  const pulse = useLoop(1100);
  const opacity = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.45, 1, 0.45] });

  if (variant === 'appointment') {
    return (
      <Animated.View style={[loaders.card, loaders.appointmentCard, { opacity }]}>
        <View style={[loaders.line, { width: '30%' }]} />
        <View style={[loaders.line, loaders.lineLarge, { width: '75%' }]} />
        <View style={[loaders.line, { width: '45%' }]} />
        <View style={loaders.rule} />
        <View style={[loaders.line, { width: '100%' }]} />
        <View style={[loaders.line, { width: '100%' }]} />
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[loaders.card, loaders.serviceCard, { opacity }]}>
      <View style={loaders.thumb} />
      <View style={loaders.serviceInfo}>
        <View style={[loaders.line, loaders.lineLarge, { width: '80%' }]} />
        <View style={[loaders.line, { width: '95%' }]} />
        <View style={[loaders.line, { width: '35%' }]} />
      </View>
    </Animated.View>
  );
}

export function SkeletonList({ count = 3, variant }: { count?: number; variant?: 'service' | 'appointment' }) {
  return <View accessibilityLabel="Cargando" accessibilityRole="progressbar">{Array.from({ length: count }, (_, index) => <SkeletonCard key={index} variant={variant} />)}</View>;
}

const loaders = StyleSheet.create({
  splash: { flex: 1, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center', padding: 32 },
  splashLogo: { width: 240, height: 110 },
  track: { width: 160, height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden', marginTop: 28 },
  bar: { width: 60, height: 4, borderRadius: 2, backgroundColor: colors.gold },
  splashText: { color: colors.muted, fontSize: 13, fontWeight: '700', letterSpacing: 0.4, marginTop: 16 },
  card: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border, borderRadius: 15, marginBottom: 10 },
  serviceCard: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  appointmentCard: { padding: 18, gap: 10, marginBottom: 14 },
  thumb: { width: 72, height: 72, borderRadius: 13, backgroundColor: colors.busy, marginRight: 12 },
  serviceInfo: { flex: 1, gap: 9 },
  line: { height: 11, borderRadius: 6, backgroundColor: colors.busy },
  lineLarge: { height: 16 },
  rule: { height: 1, backgroundColor: colors.border, marginVertical: 2 },
});
