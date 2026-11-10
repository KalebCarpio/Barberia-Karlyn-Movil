# Registro de pruebas: sesión con JWT Bearer y refresco ante 401

Responsable: Javier Flores Hernández. Fecha de ejecución: 8 de noviembre de 2026.

Rúbrica, Actividad 6, criterio 1: *consumo de API REST con tokens JWT Bearer e interceptor para refresco 401 Unauthorized*.

## Cómo funciona

1. Al iniciar sesión (correo o Google), el backend entrega un **token de acceso** (JWT, 7 días) y un **refresh token** (JWT, 30 días, firmado con otro secreto y marcado `typ: refresh`).
2. La app guarda los dos **cifrados** con `expo-secure-store` y envía el token de acceso como `Authorization: Bearer`.
3. Si una petición con sesión recibe **401**, el **interceptor del `ApiClient`** pide un token nuevo a `POST /api/auth/refresh`, guarda el refresh token rotado y **repite la petición**. El usuario no se entera.
4. Si varias peticiones reciben 401 a la vez, se hace **una sola** renovación y todas la esperan.
5. Si el refresh token venció, es inválido o la cuenta fue eliminada, la sesión se cierra y la app regresa al inicio de sesión.
6. Al abrir la app con un token guardado ya vencido, se renueva antes de mostrar el login.

| Pieza | Archivo |
| --- | --- |
| Interceptor de 401 (una sola renovación en paralelo) | `src/core/http/ApiClient.ts` |
| Renovador: lee y guarda el refresh token cifrado | `src/data/storage/tokenRefresher.ts` |
| Restaurar sesión con token vencido | `src/presentation/viewmodels/useSessionViewModel.ts` |
| Endpoint de renovación | Backend `controllers/sessionController.js`, `utils/refreshToken.js` |

## Casos automatizados (app)

| ID | Caso | Resultado esperado | Resultado |
| --- | --- | --- | --- |
| JWT-U1 | Petición con sesión recibe 401 | Renueva y repite con el token nuevo | Pasa |
| JWT-U2 | Dos peticiones reciben 401 a la vez | Una sola renovación; ambas responden | Pasa |
| JWT-U3 | No se puede renovar | Error "Tu sesión expiró" | Pasa |
| JWT-U4 | Login o petición con token explícito recibe 401 | No intenta renovar; muestra el mensaje del servidor | Pasa |
| JWT-U5 | Petición falla con 403 | No renueva ni repite | Pasa |
| JWT-U6 | Renovación exitosa | Guarda el refresh token rotado y actualiza la sesión | Pasa |
| JWT-U7 | Sesión guardada sin refresh token | Cierra la sesión sin llamar a la API | Pasa |
| JWT-U8 | Backend rechaza el refresh token | Cierra la sesión y borra lo guardado | Pasa |
| JWT-V1 | Abrir la app con token vencido | Renueva y entra sin pedir iniciar sesión | Pasa |
| JWT-V2 | Abrir la app con refresh token vencido | Pide iniciar sesión | Pasa |
| JWT-I1 | `POST /api/auth/refresh` | Envía el refresh token sin `Authorization` | Pasa |
| JWT-I2 | Refresh token vencido | Propaga el 401 del backend | Pasa |
| JWT-I3 | Login | Devuelve también el refresh token | Pasa |

## Pruebas del backend

Con el controlador real y un usuario activo de la base (solo lecturas):

| Caso | Respuesta |
| --- | --- |
| Refresh token válido | 200, token de acceso válido para el mismo usuario y refresh token rotado |
| Sin refresh token | 400 |
| Refresh token alterado | 401 |
| Token de acceso usado como refresh token | 401 |
| Refresh token vencido | 401 |
| Usuario inexistente o eliminado | 401 |

En Render (`https://barberia-carlyn-backend.onrender.com/api/auth/refresh`): 400 sin token y 401 con un token falso.

## Limitación conocida

Los refresh tokens no se guardan en la base, así que no se pueden revocar uno por uno antes de que venzan. Una cuenta eliminada o desactivada sí deja de renovarse, porque el backend verifica que siga activa.
