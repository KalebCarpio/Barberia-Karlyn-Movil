import { ActivityIndicator, Image, Text, View } from 'react-native';
import { colors, styles } from '../theme/styles';

export const brandLogo = require('../../../assets/logo-carlyn.png');

export function money(value: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value || 0);
}

export function Header({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View style={styles.header}>
      <View style={styles.brandLine}>
        <Image source={brandLogo} style={styles.headerLogo} resizeMode="contain" />
        <Text style={styles.bell}>⌁</Text>
      </View>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.heading}>{title}</Text>
    </View>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return <View style={styles.stat}><Text style={styles.statLabel}>{label}</Text><Text style={styles.statValue}>{value}</Text></View>;
}

export function Summary({ label, value }: { label: string; value: string }) {
  return <View style={styles.summaryRow}><Text style={styles.summaryLabel}>{label}</Text><Text numberOfLines={1} style={styles.summaryValue}>{value}</Text></View>;
}

export function Loading({ label }: { label: string }) {
  return <View style={styles.state}><ActivityIndicator color={colors.gold} /><Text style={styles.helperText}>{label}</Text></View>;
}

export function Empty({ label }: { label: string }) {
  return <View style={styles.state}><Text style={styles.helperText}>{label}</Text></View>;
}
