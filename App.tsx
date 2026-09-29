import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Barbería Carlyn</Text>

      <Text style={styles.subtitle}>
        Aplicación móvil administrativa
      </Text>

      <Text style={styles.message}>
        Proyecto base configurado; funciones de citas en desarrollo
      </Text>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },

  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },

  message: {
    fontSize: 16,
    textAlign: 'center',
  },
});