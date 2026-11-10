# Registro de pruebas: privacidad y derechos ARCO

Responsable: Javier Flores Hernández. Fecha de ejecución: 8 de noviembre de 2026.

## Qué incluye

| Requisito de la rúbrica | Cómo se cumple | Dónde |
| --- | --- | --- |
| Aviso de Privacidad con Opt-In explícito no pre-marcado | Casilla **sin marcar** en el registro; sin aceptarla no se crea la cuenta. Las cuentas que no lo han aceptado (anteriores o creadas con Google) ven una pantalla para aceptarlo al iniciar sesión | `RegisterScreen`, `ConsentScreen` |
| Aviso de Privacidad publicado | `GET /privacidad` en el backend: <https://barberia-carlyn-backend.onrender.com/privacidad>. Es la URL para Google Play | Backend `routes/privacyPage.js` |
| **A**cceso (`GET /profile`) | Sección "Mis datos": nombre, correo, teléfono y número de citas | `PrivacyScreen` |
| **R**ectificación (`PUT /profile`) | "Corregir mis datos" lleva al perfil editable | `ProfileScreen` |
| **C**ancelación (`DELETE /account`) | "Eliminar mi cuenta" escribiendo ELIMINAR y confirmando. El backend borra los datos personales, desactiva la cuenta y cancela las citas futuras; conserva el registro anónimo de citas pasadas | `PrivacyScreen`, backend `privacyController.deleteAccount` |
| **O**posición (switches Opt-Out) | Recordatorios de citas, estadísticas y predicciones, y promociones (esta última apagada por defecto) | `PrivacyScreen`, `GET/PUT /auth/privacy` |

## Base de datos

Migración aditiva `backend-local/db/migrations/2026-11-08-privacidad-arco.sql`, aplicada en Aiven el 8 de noviembre de 2026: agrega `acepto_privacidad_at`, `permite_promociones`, `permite_recordatorios` y `permite_analitica` a `core.usuarios`. No modificó datos: había 261 usuarios antes y después.

## Casos automatizados (app)

| ID | Tipo | Caso | Resultado esperado | Resultado |
| --- | --- | --- | --- | --- |
| PRIV-V1 | ViewModel | Sin sesión | No consulta la API | Pasa |
| PRIV-V2 | ViewModel | Cuenta sin aviso aceptado | Pide aceptarlo; al aceptar deja de pedirlo | Pasa |
| PRIV-V3 | ViewModel | Falla la consulta de privacidad | No bloquea la app y muestra el error | Pasa |
| PRIV-V4 | ViewModel | Desactivar estadísticas | Envía la oposición y actualiza el switch | Pasa |
| PRIV-V5 | ViewModel | El servidor no guarda el switch | El switch regresa a su valor anterior | Pasa |
| PRIV-V6 | ViewModel | Eliminar cuenta | Solo con ELIMINAR (sin importar mayúsculas o espacios); después cierra la sesión | Pasa |
| PRIV-V7 | ViewModel | El backend rechaza la eliminación | Muestra el motivo y no cierra la sesión | Pasa |
| REG-V9 | ViewModel | Registro sin aceptar el aviso | Error en la casilla y no llama a la API | Pasa |
| PRIV-I1 | Integración | Consultar preferencias | `GET /api/auth/privacy` con token Bearer | Pasa |
| PRIV-I2 | Integración | Aviso sin fecha | Se reporta como no aceptado | Pasa |
| PRIV-I3 | Integración | Aceptar aviso | `POST /api/auth/privacy/consent` | Pasa |
| PRIV-I4 a I6 | Integración | Oposición a recordatorios, estadísticas y promociones | `PUT /api/auth/privacy` con el campo correcto | Pasa |
| PRIV-I7 | Integración | Eliminar cuenta | `DELETE /api/auth/account` con `confirmacion: ELIMINAR` | Pasa |
| PRIV-I8 | Integración | Cuenta de personal | Propaga el rechazo 403 | Pasa |
| ACC-I2 | Integración | Verificar registro | Envía `aceptaPrivacidad: true` | Pasa |

## Pruebas del backend contra la base real

Se ejecutó el modelo `Privacy` contra Aiven **dentro de una transacción revertida (ROLLBACK)**, con un cliente real:

| Paso | Resultado |
| --- | --- |
| Consultar preferencias iniciales | Aviso sin aceptar, promociones desactivadas, recordatorios y estadísticas activados |
| Aceptar aviso | Se registró la fecha |
| Oposición a estadísticas | `permite_analitica = false` |
| Eliminar cuenta | Nombre "Cuenta eliminada", correo anonimizado, teléfono borrado, cuenta inactiva y todos los permisos desactivados |
| Después del ROLLBACK | El usuario quedó intacto y no hay cuentas eliminadas en la base |

En Render se comprobó que `GET /privacidad` responde la página del aviso y que `GET /api/auth/privacy` y `DELETE /api/auth/account` responden 401 sin token.

## Pendiente

- Los procesos de recordatorios y predicciones del backend todavía no consultan `permite_recordatorios` ni `permite_analitica`; deben filtrarlos antes de enviar avisos o entrenar modelos.
- Prueba manual en el celular: aceptar el aviso con una cuenta existente, cambiar los switches y eliminar una cuenta de prueba.
