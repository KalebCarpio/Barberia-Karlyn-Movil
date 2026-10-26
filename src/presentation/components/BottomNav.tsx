import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { AppScreen } from '../navigation';
import { colors, styles } from '../theme/styles';

const items = [
  { target: 'home', label: 'Inicio', activeIcon: 'home', inactiveIcon: 'home-outline' },
  { target: 'services', label: 'Servicios', activeIcon: 'construct', inactiveIcon: 'construct-outline' },
  { target: 'appointments', label: 'Mis citas', activeIcon: 'calendar', inactiveIcon: 'calendar-outline' },
  { target: 'profile', label: 'Perfil', activeIcon: 'person', inactiveIcon: 'person-outline' },
] as const;

export function BottomNav({ current, onNavigate }: { current: AppScreen; onNavigate: (screen: AppScreen) => void }) {
  return (
    <View style={styles.nav}>
      {items.map(({ target, label, activeIcon, inactiveIcon }) => {
        const active = current === target;

        return (
          <Pressable
            key={target}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: active }}
            onPress={() => onNavigate(target)}
            style={({ pressed }) => [
              styles.navItem,
              active && styles.navItemSelected,
              pressed && styles.navItemPressed,
            ]}
          >
            <View style={[styles.navIcon, active && styles.navIconSelected]}>
              <Ionicons
                name={(active ? activeIcon : inactiveIcon) as keyof typeof Ionicons.glyphMap}
                size={22}
                color={active ? colors.gold : colors.subtle}
              />
            </View>
            <Text style={[styles.navText, active && styles.navTextSelected]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
