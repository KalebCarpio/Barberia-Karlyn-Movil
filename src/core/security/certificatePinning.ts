// Certificate Pinning (anti-MitM): la app solo acepta el servidor si su cadena de certificados contiene
// una de estas llaves publicas (hash SHA-256 del SubjectPublicKeyInfo, en base64).
// Se fijan el intermedio y la raiz, no el certificado del sitio: Render lo renueva cada ~90 dias y
// romperia la app. Las raices de respaldo cubren un cambio de proveedor de certificados.
import { API_URL } from '../config';

export const PINNED_PUBLIC_KEYS = [
  'kIdp6NNEd8wsugYyyIYFsi1ylMCED3hZbSR8ZFsa/A4=', // Google Trust Services WE1 (intermedio actual de Render)
  'mEflZT5enoR1FuXLgYYGqnVEoZvmf9c2bVBpiOjYQ0c=', // GTS Root R4 (raiz actual)
  'hxqRlPTu1bMS/0DITB1SSu0vd4u/8l8TjPgfaAp63Gc=', // GTS Root R1 (respaldo)
  'C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M=', // ISRG Root X1, Let's Encrypt (respaldo)
];

// Igual al vencimiento del intermedio WE1; despues de esa fecha hay que actualizar los pines.
export const PINS_EXPIRE_ON = '2029-02-20';

export type PinningStatus = 'enabled' | 'unavailable' | 'not-https';

type PinningModule = typeof import('react-native-ssl-public-key-pinning');

export function pinningConfig(apiUrl = API_URL) {
  const match = /^(https?):\/\/([^/:]+)/i.exec(apiUrl);
  if (!match || match[1].toLowerCase() !== 'https') return null;
  return {
    [match[2].toLowerCase()]: {
      includeSubdomains: false,
      publicKeyHashes: PINNED_PUBLIC_KEYS,
      expirationDate: PINS_EXPIRE_ON,
    },
  };
}

// El modulo es nativo: existe en la development build y en release, no en Expo Go ni en web.
function loadModule(): PinningModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module: PinningModule = require('react-native-ssl-public-key-pinning');
    return module.isSslPinningAvailable() ? module : null;
  } catch {
    return null;
  }
}

export async function enableCertificatePinning(apiUrl = API_URL): Promise<PinningStatus> {
  const config = pinningConfig(apiUrl);
  if (!config) return 'not-https';
  const module = loadModule();
  if (!module) return 'unavailable';
  await module.initializeSslPinning(config);
  return 'enabled';
}

// Avisa cuando el servidor no presenta una llave fijada (posible ataque de intermediario).
export function onPinningError(callback: (serverHostname: string) => void): () => void {
  const module = loadModule();
  if (!module) return () => undefined;
  const subscription = module.addSslPinningErrorListener((error) => callback(error.serverHostname));
  return () => subscription.remove();
}
