# Arquitectura de la aplicación móvil

La app usa **MVVM** sobre capas de **Clean Architecture**. Cada capa solo depende de las capas internas:

```text
presentation  →  data  →  domain
     ↓            ↓
   core  ←────────┘
```

| Capa | Carpeta | Responsabilidad | Depende de |
| --- | --- | --- | --- |
| Dominio | `src/domain/` | Modelos (`Service`, `Branch`, `Barber`, `Slot`, `Appointment`) y reglas puras: filtro por categoría, fechas reservables, horarios libres | Nada |
| Núcleo | `src/core/` | Cliente HTTP, configuración y estado global de sesión | Dominio (tipos) |
| Datos | `src/data/` | Repositories que consultan la REST API, fábrica de modelos y almacenamiento cifrado de la sesión | Núcleo y dominio |
| Presentación | `src/presentation/` | ViewModels (hooks), pantallas, componentes y tema visual | Datos (interfaces) y dominio |

`App.tsx` es la raíz: crea los ViewModels, elige la pantalla según el estado de la sesión y conecta la navegación.

## MVVM

| Elemento | Archivos | Qué hace |
| --- | --- | --- |
| **Model** | `src/domain/models.ts` | Datos que maneja la app, sin nombres de campo del backend |
| **View** | `src/presentation/screens/*.tsx` | Solo dibujan el estado del ViewModel y le avisan de las acciones del usuario. No llaman a la API |
| **ViewModel** | `src/presentation/viewmodels/use*ViewModel.ts` | Guardan el estado de la pantalla (carga, error, selección), llaman a los Repositories y devuelven un `ActionResult` que la vista muestra |

Ejemplo del flujo de reserva:

```text
BookingScreen ──acción──▶ useBookingViewModel ──▶ AvailabilityRepository ──▶ ApiClient ──▶ REST API
      ▲                          │                          │
      └──────── estado ──────────┘              ModelFactory.createList('slot', …)
```

## Patrones de diseño

| Patrón | Tipo | Dónde | Para qué |
| --- | --- | --- | --- |
| **Singleton** | Creacional | `src/core/http/ApiClient.ts` (`ApiClient.getInstance()`, constructor privado) | Una sola instancia comparte la URL base y la forma de autenticar con `Bearer` en toda la app |
| **Factory** | Creacional | `src/data/factories/ModelFactory.ts` (`create`, `createList`, `createUser`) | Centraliza la creación de modelos a partir de respuestas de la API; los Repositories piden un tipo (`'service'`, `'slot'`…) y no conocen los nombres de campo del backend |
| **Repository** | Estructural / acceso a datos | `src/data/repositories/*Repository.ts` (interfaces `CatalogRepository`, `AvailabilityRepository`, `AppointmentRepository`, `AuthRepository` y sus implementaciones `Api*`) | Los ViewModels dependen de interfaces, no de la REST API. En las pruebas se reemplazan por dobles (`test/unit/viewmodels/fakes.ts`) |
| **Observer** | Comportamiento | `src/core/state/Observable.ts` y `src/core/state/sessionStore.ts` | La sesión notifica a sus suscriptores al iniciar, actualizar o cerrar sesión. `useSessionViewModel` se suscribe con `useSyncExternalStore` y el `ApiClient` lee el token actual |

`src/data/repositories/index.ts` (`createRepositories`) es el único lugar donde se eligen las implementaciones; así se pueden cambiar sin tocar los ViewModels.

## Seguridad aplicada en esta capa

- El token de sesión se guarda cifrado con `expo-secure-store` (Keychain en iOS y Keystore en Android), en `src/data/storage/sessionStorage.ts`.
- Solo las solicitudes que lo requieren envían `Authorization: Bearer` (`auth: true` en el `ApiClient`).
- Los errores de la API llegan como `ApiError` con su código HTTP, para que se puedan tratar los 401 más adelante.

## Pruebas por capa

| Capa | Pruebas | Tipo |
| --- | --- | --- |
| Dominio | `test/unit/domain/` | Unitarias (caja blanca) |
| Núcleo | `test/unit/core/` (Singleton y Observer) | Unitarias (caja blanca) |
| Datos | `test/unit/data/` (Factory) y `test/integration/` (Repositories con `fetch` simulado) | Unitarias e integración |
| Presentación | `test/unit/viewmodels/` (ViewModels con Repositories falsos) | Unitarias (caja blanca) |

Los casos, los datos usados y los resultados se registran en [`docs/pruebas/catalogo-y-disponibilidad.md`](pruebas/catalogo-y-disponibilidad.md).
