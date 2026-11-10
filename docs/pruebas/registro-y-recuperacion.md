# Registro de pruebas: crear cuenta y recuperar contraseña

Responsable: Javier Flores Hernández. Fecha de ejecución: 6 de noviembre de 2026.

## Flujos

| Flujo | Pasos | Endpoints |
| --- | --- | --- |
| Crear cuenta | Datos personales → código de 6 dígitos enviado al correo (vence en 4 min) → cuenta creada y regreso al login con el correo escrito | `POST /auth/register`, `/auth/verify-email`, `/auth/resend-code` |
| Recuperar contraseña | Correo → código (vence en 10 min) → nueva contraseña → regreso al login | `POST /auth/forgot-password`, `/auth/verify-recovery-code`, `/auth/reset-password`, `/auth/resend-recovery-code` |

La app valida antes de enviar las mismas reglas que el backend (`src/domain/account.ts`): nombre de 3 letras o más, correo con formato válido, teléfono de 10 dígitos, contraseña de 6 caracteres o más y confirmación igual. Los reenvíos de código esperan 30 segundos, igual que el backend.

## Casos automatizados

| ID | Tipo | Caso | Resultado esperado | Resultado |
| --- | --- | --- | --- | --- |
| ACC-U1 | Unitaria (dominio) | Cuenta completa y válida | Sin errores | Pasa |
| ACC-U2 | Unitaria (dominio) | Todos los campos inválidos | Un mensaje por campo | Pasa |
| ACC-U3 | Unitaria (dominio) | Teléfono con espacios y guiones | Se acepta | Pasa |
| ACC-U4 | Unitaria (dominio) | Código de 5 dígitos o con letras | Se rechaza | Pasa |
| ACC-U5 | Unitaria (dominio) | Cuenta regresiva | `4:00`, `1:05`, `0:00` | Pasa |
| REG-V1 | Unitaria (ViewModel) | Formulario inválido | Errores por campo y no llama a la API | Pasa |
| REG-V2 | Unitaria (ViewModel) | Corregir un campo | Se quita su error | Pasa |
| REG-V3 | Unitaria (ViewModel) | Registro válido | Pasa al código con 4:00 de vigencia y 30 s de espera | Pasa |
| REG-V4 | Unitaria (ViewModel) | El backend rechaza el registro | Muestra el mensaje y sigue en el formulario | Pasa |
| REG-V5 | Unitaria (ViewModel) | Código válido | "¡Cuenta creada!" | Pasa |
| REG-V6 | Unitaria (ViewModel) | Código incompleto | Error en el campo, no llama a la API | Pasa |
| REG-V7 | Unitaria (ViewModel) | Reenviar antes de 30 s | No llama a la API | Pasa |
| REG-V8 | Unitaria (ViewModel) | Código vencido y reenvío | Avisa que venció; el reenvío reinicia los 4:00 | Pasa |
| REC-V1 | Unitaria (ViewModel) | Abrir desde el login | Usa el correo ya escrito | Pasa |
| REC-V2 | Unitaria (ViewModel) | Correo inválido | Error en el campo, no llama a la API | Pasa |
| REC-V3 | Unitaria (ViewModel) | Flujo completo | Correo → código → contraseña actualizada | Pasa |
| REC-V4 | Unitaria (ViewModel) | Código rechazado por el backend | Muestra "Código incorrecto" y no avanza | Pasa |
| REC-V5 | Unitaria (ViewModel) | Contraseñas distintas | Error de confirmación | Pasa |
| REC-V6 | Unitaria (ViewModel) | Correo sin cuenta | Muestra el mensaje del backend | Pasa |
| ACC-I1 | Integración REST API | Registrar | `POST /auth/register` con `nombreCompleto`, `correoElectronico`, `telefono` (solo dígitos), `contrasena`, `canal`, sin token | Pasa |
| ACC-I2 | Integración REST API | Verificar registro | `POST /auth/verify-email` con el código sin espacios | Pasa |
| ACC-I3 | Integración REST API | Código vencido | Propaga el mensaje del backend | Pasa |
| ACC-I4 | Integración REST API | Límite de reenvíos (HTTP 429) | Propaga el mensaje del backend | Pasa |
| ACC-I5 | Integración REST API | Solicitar recuperación | `POST /auth/forgot-password` | Pasa |
| ACC-I6 | Integración REST API | Correo sin cuenta (HTTP 404) | Propaga el mensaje del backend | Pasa |
| ACC-I7 | Integración REST API | Verificar código y cambiar contraseña | `/auth/verify-recovery-code` y `/auth/reset-password` | Pasa |

## Defectos corregidos en el backend

| ID | Defecto | Corrección |
| --- | --- | --- |
| DEF-04 | `register` no respondía si fallaba el envío del correo: la app se quedaba esperando. | Se llama a `next(error)` para responder el error. |
| DEF-05 | `verifyRecoveryCode` comparaba el código con `!==`: un código correcto se rechazaba si el tipo de dato no coincidía. | Se comparan ambos como texto, igual que en el registro. |

## Pendiente

- Prueba manual con un correo real en staging (Render): recibir el código, crear la cuenta e iniciar sesión, y recuperar la contraseña.
