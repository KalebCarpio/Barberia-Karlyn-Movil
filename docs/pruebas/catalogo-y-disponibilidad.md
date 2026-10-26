# Registro de pruebas: catálogo y disponibilidad

Issues: [#53 CAT-01](https://github.com/KalebCarpio/Barberia-Karlyn-Movil/issues/53), [#54 CAT-02](https://github.com/KalebCarpio/Barberia-Karlyn-Movil/issues/54) y [#68 AVAIL-01](https://github.com/KalebCarpio/Barberia-Karlyn-Movil/issues/68).
Responsable: Javier Flores Hernández. Fechas de ejecución: 25 y 26 de octubre de 2026.

## Cómo se prueba

| Tipo de prueba | Herramienta | Comando | Dónde se ejecuta |
| --- | --- | --- | --- |
| Unitaria | Jest (`jest-expo`) | `npm run test:unit` | Local y GitHub Actions (`Quality`) |
| Integración REST API (simulada) | Jest con `fetch` simulado | `npm run test:integration` | Local y GitHub Actions (`Quality`) |
| Integración REST API (staging) | `curl` contra Render | Manual | `https://barberia-carlyn-backend.onrender.com` |

Los datos de prueba están en `test/fixtures/` y reproducen la forma de las respuestas reales del backend:

| Archivo | Endpoint que representa | Casos que cubre |
| --- | --- | --- |
| `servicios-activos.json` | `GET /api/servicios/activos` | Precio como texto, imagen nula o vacía, descripción y duración faltantes, registro sin id |
| `locales.json` | `GET /api/locales` | Sucursal con dirección y sucursal sin dirección |
| `barberos-local-1.json` | `GET /api/barbero/local/1` | Tres barberos, uno sin especialidad |
| `fechas-disponibles.json` | `GET /api/citas/fechas-disponibles` | Días con y sin disponibilidad |
| `horarios-disponibles.json` | `GET /api/citas/horarios-disponibles` | Horarios libres, ocupados y pasados |
| `horarios-sin-disponibilidad.json` | `GET /api/citas/horarios-disponibles` | Día en que el barbero no trabaja |

## Casos automatizados

| ID | Issue | Tipo | Caso | Datos | Resultado esperado | Resultado |
| --- | --- | --- | --- | --- | --- | --- |
| CAT01-U1 | #53 | Unitaria | Mapear servicio completo | `servicios-activos.json` (id 11) | Precio `"250.00"` → `250`, conserva duración e imagen | Pasa |
| CAT01-U2 | #53 | Unitaria | Servicio con campos faltantes | id 13 | Descripción y duración por defecto, sin imagen | Pasa |
| CAT01-U3 | #53 | Unitaria | Registro sin id | Cuarto registro | Se descarta | Pasa |
| CAT01-U4 | #53 | Unitaria | Categorías del catálogo | Servicios 11–13 | `Todos`, `Paquetes`, `Cortes`, `Barba` sin repetir | Pasa |
| CAT01-U5 | #53 | Unitaria | Filtrar por categoría | `Cortes`, `Todos`, categoría inexistente | 1, 3 y 0 servicios | Pasa |
| CAT01-U6 | #53 | Unitaria | Mapear sucursales | `locales.json` | Dirección por defecto si viene nula | Pasa |
| CAT01-I1 | #53 | Integración | Servicios con datos | `servicios-activos.json` | Consulta `/api/servicios/activos`, devuelve ids 11, 12 y 13 | Pasa |
| CAT01-I2 | #53 | Integración | Servicios vacíos | `{ "servicios": [] }` | Lista vacía | Pasa |
| CAT01-I3 | #53 | Integración | Error de API en servicios | HTTP 500 con mensaje | Se muestra el mensaje de la API | Pasa |
| CAT01-I4 | #53 | Integración | Sucursales con datos | `locales.json` | Consulta `/api/locales` sin token | Pasa |
| CAT01-I5 | #53 | Integración | Sucursales vacías | `{ "data": [] }` | Lista vacía | Pasa |
| CAT01-I6 | #53 | Integración | Error sin cuerpo | HTTP 503 sin JSON | Mensaje genérico de comunicación | Pasa |
| CAT02-U1 | #54 | Unitaria | Mapear barberos | `barberos-local-1.json` | `barbero_id` como id, especialidad por defecto | Pasa |
| CAT02-I1 | #54 | Integración | Barberos de una sucursal | `barberos-local-1.json` | Consulta `/api/barbero/local/1`, devuelve ids 34, 35 y 36 | Pasa |
| CAT02-I2 | #54 | Integración | Sucursal sin barberos | `{ "data": [] }` | Lista vacía | Pasa |
| CAT02-I3 | #54 | Integración | Error de API | HTTP 500 | Se informa el error | Pasa |
| CAT02-I4 | #54 | Integración | Sin conexión | Falla de red | Se propaga `Network request failed` | Pasa |
| AVAIL-U1 | #68 | Unitaria | Formato de fecha | 5 de enero de 2026 | `2026-01-05` | Pasa |
| AVAIL-U2 | #68 | Unitaria | Días reservables | Hoy = 26 oct 2026 | 14 días, del 26 oct al 8 nov | Pasa |
| AVAIL-U3 | #68 | Unitaria | Bloquear días sin disponibilidad | `fechas-disponibles.json` | 26 oct y 1 nov deshabilitados | Pasa |
| AVAIL-U4 | #68 | Unitaria | Horarios libres y ocupados | `horarios-disponibles.json` | 4 horarios: 2 libres, 1 pasado, 1 reservado | Pasa |
| AVAIL-U5 | #68 | Unitaria | Solo lista `disponibles` | Respuesta sin `slots` | 09:40 y 11:00 | Pasa |
| AVAIL-U6 | #68 | Unitaria | Hora con segundos y registro sin hora | `13:20:00` | `13:20`; el registro sin hora se descarta | Pasa |
| AVAIL-U7 | #68 | Unitaria | Día sin horarios | `horarios-sin-disponibilidad.json` | Sin horarios libres | Pasa |
| AVAIL-I1 | #68 | Integración | Fechas sin disponibilidad | `fechas-disponibles.json` | Envía barbero y token `Bearer` | Pasa |
| AVAIL-I2 | #68 | Integración | Respuesta sin fechas bloqueadas | `{}` | Lista vacía | Pasa |
| AVAIL-I3 | #68 | Integración | Distintos barberos y fechas | Barbero 34 / 27 oct, barbero 35 / 31 oct | URL con `barberoId` y `fecha` correctos | Pasa |
| AVAIL-I4 | #68 | Integración | Horarios disponibles | `horarios-disponibles.json` | Libres 09:40 y 11:00; motivos de los no disponibles | Pasa |
| AVAIL-I5 | #68 | Integración | Barbero sin horario ese día | `horarios-sin-disponibilidad.json` | Lista vacía | Pasa |
| AVAIL-I6 | #68 | Integración | Sin token | HTTP 401 | Mensaje `Token no proporcionado` | Pasa |
| AVAIL-I7 | #68 | Integración | Fecha inválida | HTTP 400 | Mensaje `fecha inválida` | Pasa |
| AVAIL-I8 | #68 | Integración | Sin conexión | Falla de red | Se propaga `Network request failed` | Pasa |

### Casos de ViewModels (caja blanca, con Repositories falsos)

| ID | Issue | Caso | Datos | Resultado esperado | Resultado |
| --- | --- | --- | --- | --- | --- |
| CAT01-V1 | #53 | Cargar catálogo | 2 servicios falsos | Servicios y categorías `Todos`, `Paquetes`, `Cortes` | Pasa |
| CAT01-V2 | #53 | Elegir categoría | `Cortes` | Solo el servicio 12 | Pasa |
| CAT01-V3 | #53 | API caída | Repositorio que falla | Servicios de ejemplo y mensaje de error | Pasa |
| CAT01-V4 | #53 | Catálogo vacío | Lista vacía | Aviso "El catalogo no contiene servicios disponibles." | Pasa |
| CAT02-V1 | #54 | Sucursal sin barberos | Lista vacía | Aviso "Esta sucursal aun no tiene barberos disponibles." | Pasa |
| AVAIL-V1 | #68 | Abrir reserva | Sucursal 1, barbero 34 | Selecciona la primera sucursal y barbero y consulta sus horarios | Pasa |
| AVAIL-V2 | #68 | Día sin disponibilidad | Mañana bloqueado | Ese día aparece deshabilitado | Pasa |
| AVAIL-V3 | #68 | Reservar sin horario | Sin horario elegido | Pide completar la reserva y no llama a la API | Pasa |
| MGMT-V1 | #59 | Crear cita | Servicio 12, 09:40 | Envía barbero, servicio, sucursal, fecha y hora | Pasa |
| MGMT-V2 | #59 | Reprogramar cita | Cita 7 → 09:40 | Llama a reprogramar, no crea otra cita | Pasa |
| MGMT-V3 | #59 | Error al guardar | API responde "Horario no disponible" | Muestra el mensaje de la API | Pasa |

Las demás pruebas cubren la arquitectura: `ApiClient` (Singleton y token Bearer), `SessionStore` (Observer), `ModelFactory` (Factory) y `AppointmentRepository` (listar, crear, reprogramar, conflicto y cancelar).

Resumen: 10 suites, 64 pruebas (40 unitarias y 24 de integración), 64 aprobadas.

## Verificación contra el entorno de pruebas (Render)

| Solicitud | Resultado esperado | Resultado obtenido |
| --- | --- | --- |
| `GET /api/servicios/activos` | HTTP 200 con servicios | HTTP 200, 4 servicios |
| `GET /api/locales` | HTTP 200 con sucursales | HTTP 200, 2 sucursales |
| `GET /api/barbero/local/1` | HTTP 200 con barberos | HTTP 200, 3 barberos |
| `GET /api/barbero/local/2` | Respuesta vacía controlada | HTTP 200, 0 barberos (la app muestra "Esta sucursal aun no tiene barberos disponibles.") |
| `GET /api/citas/horarios-disponibles` sin token | Rechazo por autenticación | HTTP 401 `Token no proporcionado` |
| `GET /api/citas/fechas-disponibles` sin token | Rechazo por autenticación | HTTP 401 `Token no proporcionado` |
| `http://` en lugar de `https://` | Redirección a HTTPS | HTTP 301 |

## Defectos encontrados y corregidos

| ID | Issue | Defecto | Corrección |
| --- | --- | --- | --- |
| DEF-01 | #54 | La app consultaba `/api/barberos/local/:id` (plural); el backend publica `/api/barbero/local/:id`. Staging respondía 404 y nunca se listaban barberos. | Se usa `/api/barbero/local/:id`. Lo cubre CAT02-I1. |
| DEF-02 | #68 | Se leía la lista `disponibles`, que solo trae horarios libres; los horarios ocupados no se mostraban como "Ocupado". | Se prioriza la lista `slots`, que trae todos los horarios con su estado. Lo cubre AVAIL-U4. |
| DEF-03 | #68 | No se consultaban las fechas disponibles; se ofrecían días en que el barbero no trabaja. | Se consulta `/api/citas/fechas-disponibles` y esos días aparecen deshabilitados. Lo cubren AVAIL-U3 y AVAIL-I1. |

## Pendiente

- Consultar horarios y fechas con una cuenta de prueba autenticada en staging. Se ejecuta como parte de TEST-01 (#73) y TEST-02 (#74).
