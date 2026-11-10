# Matriz de pruebas de caja negra (funcionales E2E)

Rúbrica, Actividad 6, criterio 5: *matriz de pruebas funcionales sin acceso al código, en Debug y Release, y registro de errores corregidos*.

Responsable de ejecución: Javier Flores Hernández. Dispositivo: Android (anotar modelo y versión al ejecutar).

## Cómo se ejecuta

- **Caja negra:** se prueba como un usuario, sin ver el código. Solo se compara el resultado esperado con el obtenido.
- **Debug:** development build conectada a Metro (`npx expo start`). En las primeras pruebas se usó Expo Go con el mismo código JavaScript.
- **Release:** APK firmado del perfil `preview` (R8, `shrinkResources` y Certificate Pinning activos), instalado desde EAS: build [`3c3babce`](https://expo.dev/accounts/javi_10/projects/carlyn-mobile/builds/3c3babce-3800-45f4-84b5-02532373df12).
- **Backend:** staging en Render (`https://barberia-carlyn-backend.onrender.com`).
- **Resultado:** ✅ pasa · ❌ falla (se registra en la tabla de errores) · ⬜ pendiente · N/A no aplica.
- **Evidencia:** captura de pantalla nombrada con el ID del caso (por ejemplo, `CN-05.jpg`) en `docs/pruebas/evidencias/`.
- **Datos de prueba:** cuenta personal del responsable y una **cuenta de prueba** creada en CN-08 (la única que se elimina en CN-27).

## Casos de prueba

### Acceso y cuenta

| ID | Funcionalidad | Pasos | Datos | Resultado esperado | Debug | Release | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CN-01 | Abrir la app | Abrir Carlyn por primera vez | — | Logo animado y luego pantalla de inicio de sesión | ✅ | ⬜ | |
| CN-02 | Iniciar sesión | Correo y contraseña válidos → "Iniciar sesión" | Cuenta personal | Entra a "Hola, (nombre)" | ✅ | ⬜ | |
| CN-03 | Contraseña incorrecta | Correo válido y contraseña equivocada | Contraseña `123456` | Diálogo de error "Credenciales incorrectas"; no entra | ⬜ | ⬜ | |
| CN-04 | Campos vacíos | Tocar "Iniciar sesión" sin escribir nada | — | Diálogo "Faltan datos" | ⬜ | ⬜ | |
| CN-05 | Iniciar con Google | "Continuar con Google" → elegir cuenta | Gmail de usuario de prueba | Entra a la app | ❌ → ✅ (ERR-09) | ✅ | |
| CN-06 | Cancelar Google | Abrir la ventana de Google y cerrarla | — | Regresa al login sin error | ⬜ | ⬜ | |
| CN-07 | Registro: validaciones | "Crear cuenta" → "Continuar" con campos vacíos | — | Error en rojo bajo cada campo y en la casilla del aviso | ⬜ | ⬜ | |
| CN-08 | Registro completo | Llenar datos → marcar aviso → código del correo → "Verificar" | Correo nuevo (cuenta de prueba) | Llega el código; "¡Cuenta creada!"; regresa al login con el correo escrito | ❌ → ✅ (ERR-06, ERR-07) | ⬜ | |
| CN-09 | Registro sin aceptar el aviso | Llenar datos sin marcar la casilla → "Continuar" | — | No avanza; pide aceptar el Aviso de Privacidad | ⬜ | ⬜ | |
| CN-10 | Código incorrecto | En el paso del código escribir otro número | `000000` | Mensaje "Código incorrecto"; no crea la cuenta | ⬜ | ⬜ | |
| CN-11 | Recuperar contraseña | "Olvidé mi contraseña" → correo → código → nueva contraseña | Cuenta personal | Llega el código; "¡Contraseña actualizada!"; entra con la nueva | ❌ → ✅ (ERR-06, ERR-08) | ⬜ | |
| CN-12 | Aceptar aviso de privacidad | Iniciar sesión con una cuenta que no lo ha aceptado | Cuenta personal (primera vez) | Pantalla "Tu privacidad importa"; sin marcar la casilla no deja continuar | ⬜ | ⬜ | |
| CN-13 | Sesión guardada | Cerrar la app por completo y volver a abrirla | — | Entra sin pedir contraseña | ⬜ | ⬜ | |
| CN-14 | Cerrar sesión | Perfil → "Cerrar sesión" → confirmar | — | Pide confirmación y regresa al login | ⬜ | ⬜ | |

### Catálogo y citas

| ID | Funcionalidad | Pasos | Datos | Resultado esperado | Debug | Release | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CN-15 | Ver servicios | Pestaña "Servicios" | — | Lista de servicios reales con precio, duración e imagen | ✅ | ⬜ | |
| CN-16 | Filtrar por categoría | Tocar una categoría | — | Solo servicios de esa categoría | ⬜ | ⬜ | |
| CN-17 | Ver barberos de una sucursal | Elegir servicio → sucursal | Sucursal principal | Aparecen sus barberos | ❌ → ✅ (ERR-01) | ⬜ | |
| CN-18 | Días y horarios | Elegir barbero → día | — | Días sin servicio deshabilitados; horarios ocupados marcados "Ocupado" | ❌ → ✅ (ERR-02) | ⬜ | |
| CN-19 | Reservar cita | Elegir horario libre → "Confirmar cita" | Servicio y horario libres | Capa "Reservando tu cita…" y diálogo "¡Cita confirmada!" con el resumen | ✅ | ⬜ | |
| CN-20 | Reservar sin horario | "Confirmar cita" sin elegir horario | — | Diálogo "Completa la reserva" | ⬜ | ⬜ | |
| CN-21 | Ver mis citas | Pestaña "Mis citas" | — | La cita reservada aparece como pendiente | ✅ | ⬜ | |
| CN-22 | Reagendar cita | "Reagendar" → otro horario → guardar | — | "¡Cita reprogramada!" y la cita muestra el horario nuevo | ⬜ | ⬜ | |
| CN-23 | Cancelar cita | "Cancelar" → confirmar | — | Diálogo de confirmación con el resumen; la cita queda cancelada | ⬜ | ❌ (ERR-11) → reprobar | |

### Privacidad, recordatorios y perfil

| ID | Funcionalidad | Pasos | Datos | Resultado esperado | Debug | Release | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CN-24 | Editar perfil | Perfil → cambiar teléfono → "Guardar cambios" | Teléfono de 10 dígitos | "Perfil actualizado" y el dato se conserva al volver | ⬜ | ⬜ | |
| CN-25 | Ver mis datos (Acceso) | Perfil → "Privacidad y datos" | — | Nombre, correo, teléfono y número de citas | ⬜ | ⬜ | |
| CN-26 | Switches de oposición | Apagar y prender "Estadísticas" y "Promociones" | — | El switch cambia y se conserva al salir y volver a entrar | ⬜ | ⬜ | |
| CN-27 | Eliminar cuenta | En la cuenta de prueba: escribir `ELIMINAR` → "Eliminar mi cuenta" → confirmar | Cuenta de prueba de CN-08 | "Cuenta eliminada", regresa al login y esa cuenta ya no puede entrar | ⬜ | ⬜ | |
| CN-28 | Eliminar sin confirmar | Escribir otro texto | `borrar` | El botón sigue deshabilitado | ⬜ | ⬜ | |
| CN-29 | Ofrecer recordatorio | Reservar una cita (CN-19) por primera vez | — | Diálogo "¿Te recordamos tu cita?"; al aceptar aparece el permiso de Android | N/A | ⬜ | |
| CN-30 | Rechazar permiso | En CN-29 elegir "Ahora no" | — | No aparece el permiso del sistema y la app sigue normal | N/A | ⬜ | |
| CN-31 | Recordatorio recibido | Reservar una cita para dentro de 1 a 2 horas, con permiso concedido | — | Notificación "Tu cita en Carlyn es en 1 hora" a la hora indicada | N/A | ⬜ | |
| CN-32 | Oposición a recordatorios | Apagar "Recordatorios de citas" en Privacidad | — | La notificación programada ya no llega | N/A | ⬜ | |

### Condiciones del dispositivo y seguridad

| ID | Funcionalidad | Pasos | Datos | Resultado esperado | Debug | Release | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CN-33 | Sin conexión | Activar modo avión → abrir Servicios o reservar | — | Mensaje de error claro; la app no se cierra | ⬜ | ⬜ | |
| CN-34 | Recuperar conexión | Quitar modo avión → volver a intentar | — | Carga normal | ⬜ | ⬜ | |
| CN-35 | Servidor dormido | Abrir la app después de más de 15 min sin uso | — | La primera carga tarda hasta ~60 s y luego responde (plan gratuito de Render) | ⬜ | ⬜ | |
| CN-36 | Segundo plano | Durante una reserva, ir a otra app y volver | — | La pantalla conserva lo elegido | ⬜ | ⬜ | |
| CN-37 | Rotación y tamaño de texto | Agrandar el tamaño de letra del sistema | — | Los textos se ajustan sin cortarse los botones | ⬜ | ⬜ | |
| CN-38 | Barra de navegación de Android | Navegar entre pestañas | — | El menú inferior no queda tapado por los botones del sistema | ❌ → ✅ (ERR-05) | ⬜ | |
| CN-39 | Certificate Pinning | Usar la app en red normal | — | Conecta normalmente con el servidor real | N/A | ⬜ | |
| CN-40 | Interceptación (opcional) | Con un proxy de interceptación y su certificado instalado | HTTP Toolkit o mitmproxy | La conexión se bloquea y aparece "Conexión no segura" | N/A | ⬜ | |

Los casos marcados **N/A** en Debug usan módulos nativos (notificaciones o Certificate Pinning) que no existían en la development build anterior; se prueban en Release.

## Registro de errores encontrados y corregidos

| ID | Caso | Versión | Qué pasó | Causa | Corrección | Commit | Reprueba |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ERR-01 | CN-17 | Staging (API) | No aparecían barberos al elegir sucursal | La app consultaba `/barberos/local/:id`; el backend publica `/barbero/local/:id` (404) | Se usó la ruta correcta | `4ad03f2` | ✅ |
| ERR-02 | CN-18 | Staging (API) | Los horarios ocupados no se veían y se ofrecían días sin servicio | Se leía solo la lista de horarios libres y no se consultaban las fechas disponibles | Se usa la lista completa y se bloquean los días sin horario | `1c7261f` | ✅ |
| ERR-03 | CN-01 | Debug | Expo Go no abría el proyecto | Expo Go del teléfono era SDK 58 y el proyecto SDK 57 | Actualización a Expo SDK 58 | `d02b018` | ✅ |
| ERR-04 | CN-01 | Debug (web) | Se quedaba en "Preparando Carlyn" | El almacenamiento seguro no existe en web y la lectura fallaba | Si no se puede leer la sesión, se muestra el login | `8f9b09f` | ✅ |
| ERR-05 | CN-38 | Debug | El logo chocaba con la barra de estado y los botones de Android tapaban el menú | Expo SDK 58 dibuja de borde a borde | Márgenes seguros con `react-native-safe-area-context` | `cd6bd03` | ✅ |
| ERR-06 | CN-08, CN-11 | Debug | "Connection timeout" / "ENETUNREACH …:465" al pedir el código | Render bloquea SMTP en el plan gratuito | Envío por la API HTTPS de Brevo (backend) | `b1d9f06b` (backend) | ✅ |
| ERR-07 | CN-08 | Debug | Si fallaba el correo, el registro quedaba esperando sin respuesta | `register` no respondía el error | Se responde el error al cliente (backend) | `f0c322c8` (backend) | ✅ |
| ERR-08 | CN-11 | Debug | Un código de recuperación correcto podía rechazarse | Comparación estricta de tipos distintos | Se comparan como texto (backend) | `f0c322c8` (backend) | ✅ |
| ERR-09 | CN-05 | Debug | `DEVELOPER_ERROR` al entrar con Google | No existía el cliente OAuth de Android con el paquete y la SHA-1 de la app | Proyecto "Carlyn Movil" en Google Cloud con clientes web y Android | `0ec0181` | ✅ Release |
| ERR-11 | CN-23 | Release | Al confirmar la cancelación: "Cannot read properties of undefined (reading 'motivo')" | La app enviaba el `DELETE` sin cuerpo y en Express 5 `req.body` queda `undefined`; el backend leía `req.body.motivo` | Backend: lectura segura `req.body?.motivo`. App: envía el motivo "Cancelada por el cliente desde la app movil" | `b28c80ce` (backend) y app | ⬜ |
| ERR-10 | — | Release | El APK pedía 29 permisos, varios sin uso (huella, push, contadores) | Los agregan las librerías al combinar manifiestos | Se bloquearon; quedaron 8 | `cbeecf3` | ✅ |

## Resumen

| | Debug | Release |
| --- | --- | --- |
| Casos aplicables | 34 | 40 |
| ✅ Pasan | 11 | 1 |
| ⬜ Pendientes | 23 | 39 |
| Errores encontrados y corregidos | 11 | |

Actualizar este resumen al terminar la ejecución.
