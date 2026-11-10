// Caja blanca: configuracion de Certificate Pinning (hash SHA-256 de llaves publicas).
import { enableCertificatePinning, PINNED_PUBLIC_KEYS, pinningConfig } from '../../../src/core/security/certificatePinning';

describe('Certificate Pinning', () => {
  it('fija las llaves para el host de la API y no para subdominios', () => {
    expect(pinningConfig('https://barberia-carlyn-backend.onrender.com')).toEqual({
      'barberia-carlyn-backend.onrender.com': {
        includeSubdomains: false,
        publicKeyHashes: PINNED_PUBLIC_KEYS,
        expirationDate: '2029-02-20',
      },
    });
  });

  it('usa al menos dos llaves (principal y respaldo) en formato SHA-256 base64', () => {
    expect(PINNED_PUBLIC_KEYS.length).toBeGreaterThanOrEqual(2);
    expect(new Set(PINNED_PUBLIC_KEYS).size).toBe(PINNED_PUBLIC_KEYS.length);
    for (const pin of PINNED_PUBLIC_KEYS) expect(pin).toMatch(/^[A-Za-z0-9+/]{43}=$/);
  });

  it('no aplica pinning a un backend local por HTTP', () => {
    expect(pinningConfig('http://192.168.3.10:4000')).toBeNull();
  });

  it('ignora mayusculas, puerto y ruta al obtener el host', () => {
    expect(Object.keys(pinningConfig('HTTPS://Barberia-Carlyn-Backend.onrender.com:443/api') ?? {})).toEqual(['barberia-carlyn-backend.onrender.com']);
  });

  it('no falla donde el modulo nativo no existe (Expo Go, web o pruebas)', async () => {
    await expect(enableCertificatePinning('https://barberia-carlyn-backend.onrender.com')).resolves.toBe('unavailable');
    await expect(enableCertificatePinning('http://localhost:4000')).resolves.toBe('not-https');
  });
});
