// Privacidad y derechos ARCO: aviso, oposicion (opt-out) y cancelacion de la cuenta.
import { API_URL } from '../core/config';

// Aviso de Privacidad Integral publico que sirve el backend; es la misma URL que se registra en Google Play.
export const PRIVACY_NOTICE_URL = `${API_URL}/privacidad`;

// Texto que el usuario escribe para confirmar que quiere eliminar su cuenta.
export const DELETE_CONFIRMATION = 'ELIMINAR';

export type PrivacyPreference = 'promotions' | 'reminders' | 'analytics';

export type PrivacySettings = {
  acceptedAt: string | null;
  promotions: boolean;
  reminders: boolean;
  analytics: boolean;
};

// Descripcion de cada switch de oposicion, en el orden en que se muestran.
export const PRIVACY_PREFERENCES: { key: PrivacyPreference; title: string; description: string }[] = [
  { key: 'reminders', title: 'Recordatorios de citas', description: 'Avisos por correo o SMS antes de tu cita.' },
  { key: 'analytics', title: 'Estadisticas y predicciones', description: 'Usar tu historial de citas para mejorar horarios y servicios.' },
  { key: 'promotions', title: 'Promociones', description: 'Ofertas y novedades de Carlyn por correo.' },
];

export function isDeleteConfirmed(text: string) {
  return text.trim().toUpperCase() === DELETE_CONFIRMATION;
}
