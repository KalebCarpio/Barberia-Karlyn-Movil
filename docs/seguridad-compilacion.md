# Seguridad de la compilación: Certificate Pinning, R8/ProGuard y permisos

Responsable: Javier Flores Hernández. Fecha: 8 de noviembre de 2026.

Rúbrica, Actividad 6 (criterios 2 y 4) y Actividad 7 (permisos justificados).

## 1. Certificate Pinning (anti-MitM)

La app solo se conecta a `barberia-carlyn-backend.onrender.com` si la cadena de certificados contiene una de estas llaves públicas (hash **SHA-256** del *SubjectPublicKeyInfo*, en base64). Implementación: `src/core/security/certificatePinning.ts`, con `react-native-ssl-public-key-pinning`, que configura el `CertificatePinner` de OkHttp en Android.

| Llave fijada | Certificado | Papel |
| --- | --- | --- |
| `kIdp6NNEd8wsugYyyIYFsi1ylMCED3hZbSR8ZFsa/A4=` | Google Trust Services **WE1** | Intermedio actual de Render |
| `mEflZT5enoR1FuXLgYYGqnVEoZvmf9c2bVBpiOjYQ0c=` | **GTS Root R4** | Raíz actual |
| `hxqRlPTu1bMS/0DITB1SSu0vd4u/8l8TjPgfaAp63Gc=` | GTS Root R1 | Respaldo |
| `C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M=` | ISRG Root X1 (Let's Encrypt) | Respaldo si Render cambia de proveedor |

**Cómo se obtuvieron:** cadena real del servidor con `openssl s_client -connect barberia-carlyn-backend.onrender.com:443 -showcerts`; para cada certificado:

```bash
openssl x509 -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64
```

Los respaldos se calcularon igual desde los certificados raíz del almacén de confianza.

**Decisiones:**
- No se fija el certificado del sitio (`onrender.com`), porque Render lo renueva cada ~90 días (el actual vence el 20/12/2026) y la app dejaría de conectarse.
- Los pines vencen el **20/02/2029**, junto con el intermedio WE1. Antes de esa fecha hay que recalcularlos y publicar una actualización.
- El pinning se activa **antes** de montar la app, para que ninguna petición salga sin él. Si el servidor no presenta una llave fijada, la conexión se bloquea y se muestra "Conexión no segura".
- No aplica en Expo Go, web ni para un backend local por `http://`.

**Prueba negativa sugerida (caja negra):** abrir la app con un proxy de interceptación (por ejemplo HTTP Toolkit o mitmproxy con su certificado instalado en el teléfono). Sin pinning las peticiones se verían en el proxy; con pinning deben fallar y mostrar "Conexión no segura".

## 2. Ofuscación y reducción (R8/ProGuard)

Configuración en `app.json` con `expo-build-properties`; EAS la aplica al generar el proyecto Android:

| Opción | Valor | Efecto en `android/` |
| --- | --- | --- |
| `enableMinifyInReleaseBuilds` | `true` | `android.enableMinifyInReleaseBuilds=true` → `minifyEnabled true` en `app/build.gradle` (release) |
| `enableShrinkResourcesInReleaseBuilds` | `true` | `android.enableShrinkResourcesInReleaseBuilds=true` → `shrinkResources true` |
| `extraProguardRules` | Reglas `-keep` para los módulos nativos de Certificate Pinning y Google Sign-In | Se agregan a `app/proguard-rules.pro` |

Verificado con `npx expo prebuild --platform android`: el `build.gradle` generado usa `minifyEnabled enableMinifyInReleaseBuilds` con `proguard-android-optimize.txt` y `proguard-rules.pro`.

**Pendiente:** compilar la versión release (`eas build --profile preview`) y descompilar el APK con **JADX** o analizarlo con **MobSF** para el reporte anti-descompilación. El código Java/Kotlin queda con nombres ofuscados; el JavaScript va como bytecode de **Hermes** (`index.android.bundle`), no como texto legible.

## 3. Permisos de Android

| Permiso | ¿Se usa? | Justificación |
| --- | --- | --- |
| `INTERNET` | Sí | Comunicarse con la REST API |
| `POST_NOTIFICATIONS` (Android 13+) | Sí, **a demanda** | Recordatorio 1 hora antes de cada cita. Lo agrega `expo-notifications` |
| `RECEIVE_BOOT_COMPLETED`, `VIBRATE`, `WAKE_LOCK` | Sí | Los usa `expo-notifications` para conservar los recordatorios tras reiniciar y mostrarlos. No son peligrosos |
| `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE` | **No** | Bloqueados con `android.blockedPermissions` |
| `SYSTEM_ALERT_WINDOW` | **No** | Bloqueado (solo lo usa el menú de desarrollo) |
| `RECORD_AUDIO` | **No** | Bloqueado |

La app **no usa** cámara, ubicación, contactos ni almacenamiento.

**Solicitud transparente:** el permiso de notificaciones **no se pide al abrir la app**. Se ofrece:
1. Después de reservar una cita, con el diálogo **"¿Te recordamos tu cita?"**, que explica para qué es, que no se usan otros datos y cómo desactivarlo. Solo si el usuario acepta aparece el diálogo del sistema.
2. Al activar "Recordatorios de citas" en **Perfil → Privacidad y datos**.

Si el permiso se negó de forma permanente, la app ofrece **"Abrir Ajustes"**. La oposición "Recordatorios de citas" de Privacidad **cancela** todos los recordatorios programados.

La lista final de permisos del APK compilado se confirmará en el reporte de MobSF.

## Pruebas automatizadas

| Archivo | Qué comprueba |
| --- | --- |
| `test/unit/core/certificatePinning.test.ts` | Host fijado, al menos dos pines SHA-256 válidos y sin duplicados, sin pinning para `http://` local, y no falla sin el módulo nativo |
| `test/unit/domain/reminders.test.ts` | Recordatorio 1 h antes, identificador que cambia al reprogramar, solo citas activas futuras |
| `test/unit/viewmodels/useRemindersViewModel.test.ts` | El permiso no se pide al abrir la app; se programa al concederlo; la oposición cancela todo; "Ahora no" no insiste; permiso negado no programa nada |
