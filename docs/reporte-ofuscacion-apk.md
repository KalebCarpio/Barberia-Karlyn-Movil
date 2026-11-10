# Reporte de ofuscación y análisis del APK de release

Responsable: Javier Flores Hernández. Fecha: 8 de noviembre de 2026.

Rúbrica, Actividad 6, criterio 4: *compilación Release optimizada (minifyEnabled true, shrinkResources true) y validación anti-descompilación*.

## APK analizado

| Dato | Valor |
| --- | --- |
| Build de EAS | [`326a7f57-3aa0-4f3c-80fd-e0d7e9721a1b`](https://expo.dev/accounts/javi_10/projects/carlyn-mobile/builds/326a7f57-3aa0-4f3c-80fd-e0d7e9721a1b), perfil `preview` (release, APK) |
| Commit | `6c7ef34` (rama `feature/JAVIER/privacidad-arco`) |
| Paquete | `com.barberiacarlyn.app`, versión 1.0.0 (versionCode 1), nombre visible "Carlyn" |
| SDK | `targetSdkVersion` 36, `compileSdkVersion` 37 |
| Tamaño | 71.8 MB (APK universal con las 4 arquitecturas; el AAB de Google Play entrega solo la del teléfono) |
| Firma | Firmado con la llave de EAS. Certificado SHA-256 `ed5848caa41fe4b583eefc446a426a10aaf90c93c4b2dee9ed0eb5fcbf4a1b3b` |

## Herramientas

Herramientas oficiales del Android SDK (build-tools 35.0.0), sobre el APK descargado de EAS:

| Herramienta | Uso |
| --- | --- |
| `aapt2 dump badging` | Paquete, versión, SDK y permisos finales del manifiesto combinado |
| `apksigner verify --print-certs` | Firma del APK |
| `dexdump` | Clases compiladas de `classes.dex`, para medir la ofuscación |
| Búsqueda en todos los archivos del APK | Secretos filtrados y formato del bundle de JavaScript |

## 1. Código Java/Kotlin: ofuscado con R8

| Medición | Resultado |
| --- | --- |
| Clases en `classes.dex` | 5,479 |
| Clases **renombradas y movidas al paquete raíz** por R8 (`La00;`, `Lzw;`, `Lxw;`, `La51;`...) | **4,275 (78 %)** |
| Métodos de esas clases | Nombres de una letra (`a`, `b`...) |
| Ejemplo: OkHttp | De todo el cliente HTTP solo conserva su nombre `okhttp3.internal.publicsuffix.PublicSuffixDatabase`, que lee un recurso por nombre; el resto quedó ofuscado |
| Clases que conservan su nombre | ~1,200, principalmente `com.facebook.react` (430), `expo.modules` (402) e `io.github` (230). React Native y Expo las buscan **por nombre** desde C++ (JNI) o por reflexión, y sus reglas `-keep` las protegen; ofuscarlas rompería la app |
| Clases propias de la app | Solo `MainActivity` y `MainApplication`, que Android abre por nombre desde el manifiesto |

## 2. Recursos: reducidos con `shrinkResources`

Los archivos de `res/` quedaron con nombres cortos sin significado (`-6.webp`, `-8.xml`, `-B.png`, `-k.xml`...) y se eliminaron los no usados.

## 3. JavaScript: bytecode de Hermes

| Medición | Resultado |
| --- | --- |
| `assets/index.android.bundle` | 1.9 MB |
| Primeros bytes | `c61fbc03c103191f`, la firma del **bytecode de Hermes** |

El código de la app (pantallas, ViewModels, Repositories) **no viaja como texto JavaScript legible**, sino compilado a bytecode y minificado por Metro.

**Limitación, por transparencia:** Hermes conserva en su tabla de cadenas los **nombres de algunas funciones** (por ejemplo `enableCertificatePinning` o `useBookingViewModel`) para los mensajes de error, y también los textos visibles y la URL de la API. No contienen secretos: la URL es pública y los pines del Certificate Pinning son hashes de **llaves públicas**.

## 4. Sin secretos en el APK

Se buscaron en los 674 archivos extraídos del APK:

| Búsqueda | Coincidencias |
| --- | --- |
| Claves de Brevo (`xkeysib`) | 0 |
| `JWT_SECRET`, `SESSION_SECRET` | 0 |
| `EMAIL_PASS`, `DB_PASSWORD` | 0 |
| `MERCADO_PAGO_ACCESS_TOKEN`, `CLOUDINARY_API_SECRET`, `sk_live` | 0 |
| Llaves privadas (`BEGIN PRIVATE KEY`) | 0 |

Los secretos viven solo en el backend (variables de entorno de Render). La app solo tiene la URL de la API y el ID de cliente web de Google, que son públicos.

## 5. Permisos del APK

Manifiesto final obtenido con `aapt2`:

| Permiso | Origen | Decisión |
| --- | --- | --- |
| `INTERNET`, `ACCESS_NETWORK_STATE` | React Native / OkHttp | Necesarios |
| `POST_NOTIFICATIONS` | `expo-notifications` | Necesario; **único permiso que se pide al usuario**, a demanda y con diálogo explicativo |
| `RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK`, `VIBRATE` | `expo-notifications` | Necesarios para recordatorios locales. No requieren aprobación del usuario |
| `BIND_GET_INSTALL_REFERRER_SERVICE`, `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` | Google Play / AndroidX | Internos, no requieren aprobación |
| `USE_BIOMETRIC`, `USE_FINGERPRINT` | `expo-secure-store` | **Bloqueados** para la siguiente build: la app no usa huella |
| `com.google.android.c2dm.permission.RECEIVE` | `expo-notifications` (push) | **Bloqueado**: los recordatorios son locales, no push |
| Permisos de contador en el ícono (Samsung, Huawei, Oppo, HTC, Sony...) | `expo-notifications` | **Bloqueados**: la app no usa contador |
| `READ/WRITE_EXTERNAL_STORAGE`, `SYSTEM_ALERT_WINDOW`, `RECORD_AUDIO` | Plantilla de Expo | Ya **no aparecen**: se bloquearon antes de esta build |

La app **no pide** cámara, ubicación, contactos, micrófono ni almacenamiento.

**Verificación en la build siguiente** ([`3c3babce`](https://expo.dev/accounts/javi_10/projects/carlyn-mobile/builds/3c3babce-3800-45f4-84b5-02532373df12), commit `0ec0181`): el manifiesto pasó de **29 a 8 permisos**:

| Permiso | Motivo |
| --- | --- |
| `INTERNET`, `ACCESS_NETWORK_STATE` | Conexión con la API |
| `POST_NOTIFICATIONS` | Recordatorios de cita (único que se pide al usuario, a demanda) |
| `RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK`, `VIBRATE` | Mostrar los recordatorios y conservarlos al reiniciar |
| `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`, `BIND_GET_INSTALL_REFERRER_SERVICE` | Internos de AndroidX y Google Play; no requieren aprobación |

La firma no cambió (SHA-1 `20:2D:2D:2B:CF:BC:78:D0:AD:86:C2:1E:B8:52:CD:F6:21:2A:B7:ED`), la misma registrada en el cliente Android de Google Cloud.

## Conclusión

La versión release cumple el criterio: R8 ofusca y reduce el código nativo (78 % de las clases renombradas), `shrinkResources` reduce y renombra los recursos, el JavaScript va como bytecode de Hermes y **no hay secretos** en el paquete. Los permisos sobrantes que agregan las librerías quedan bloqueados para la build de producción.
