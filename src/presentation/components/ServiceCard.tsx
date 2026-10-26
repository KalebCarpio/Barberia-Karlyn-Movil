import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Service } from '../../domain/models';
import { colors, styles } from '../theme/styles';
import { money } from './ui';

export function ServiceCard({ service, onPress }: { service: Service; onPress: () => void }) {
  const [imageFailed, setImageFailed] = useState(false);

  return <Pressable onPress={onPress} style={styles.serviceCard}>
    {service.imageUrl && !imageFailed ? <Image source={{ uri: service.imageUrl }} style={styles.serviceImage} resizeMode="cover" onError={() => setImageFailed(true)} accessibilityLabel={`Imagen de ${service.name}`} /> : <View style={styles.serviceIcon}><Ionicons name="cut-outline" size={27} color={colors.gold} /></View>}
    <View style={styles.serviceInfo}><Text style={styles.serviceName}>{service.name}</Text><Text style={styles.serviceDescription} numberOfLines={2}>{service.description}</Text><Text style={styles.serviceDuration}>{service.duration} min</Text></View><Text style={styles.price}>{money(service.price)}</Text>
  </Pressable>;
}
