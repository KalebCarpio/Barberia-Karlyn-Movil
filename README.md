# Barbería Carlyn — aplicación móvil administrativa

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/KalebCarpio/Barberia-Karlyn-Movil)

Repositorio de la aplicación móvil de **Barbería Carlyn**, enfocada en que el administrador consulte y gestione las citas del negocio. El identificador técnico del repositorio conserva la grafía `Barberia-Karlyn-Movil`; el nombre del negocio en la documentación es **Barbería Carlyn**.

> **Estado del proyecto:** base inicial de Expo + React Native + TypeScript publicada. La pantalla de inicio confirma la configuración; las funcionalidades de citas y la integración REST API siguen pendientes.

## Objetivo

Ofrecer al administrador un flujo móvil para revisar citas pendientes y próximas, consultar disponibilidad, gestionar cambios y consultar el historial. La aplicación consumirá la **REST API existente**, que es la fuente de verdad para datos y reglas de negocio. La aplicación móvil no duplicará validaciones de negocio del backend.

## Funcionalidades del MVP

- Autenticación administrativa, gestión de sesión, recuperación de acceso y perfil.
- Consulta de sucursales, servicios y barberos necesarios para las citas.
- Consulta de fechas y horarios disponibles.
- Dashboard de citas, citas pendientes y próximas, filtros y detalle.
- Modificación y reprogramación de citas con validación de disponibilidad.
- Actualización de estado y cancelación de citas.
- Historial de citas y manejo de estados de carga, vacío y error.

Quedan fuera del MVP: punto de venta, productos, respaldos, administración avanzada de bases de datos y analítica compleja.

## Tecnología y arquitectura

| Elemento | Estado |
| --- | --- |
| Framework móvil y lenguaje | Expo SDK 58, React Native 0.88 y TypeScript 6; base reutilizada del repositorio de pruebas |
| Estructura de carpetas y navegación | Pantalla inicial en `App.tsx`; navegación por definir según flujos del MVP |
| Cliente HTTP y configuración de entornos | Aún no implementados; pendientes de ARCH-01 y SETUP-02 |
| Backend | REST API existente; los endpoints concretos se documentarán al integrar |
| Estrategia de pruebas | Se define en SETUP-02 y se ejecuta en los Issues TEST-01 y TEST-02 |

El cliente móvil enviará solicitudes a la API y mostrará sus respuestas, incluidos errores y estados de disponibilidad. Los contratos y reglas del backend guiarán la implementación.

## Requisitos e instalación

La base actual requiere Node.js y npm, además de un dispositivo con Expo Go o un emulador compatible. Se recomienda comprobar la versión de Node.js compatible con Expo SDK 57 antes de instalar.

```bash
git clone https://github.com/KalebCarpio/Barberia-Karlyn-Movil.git
cd Barberia-Karlyn-Movil
npm ci
npm start
```

En la terminal de Expo se puede elegir el dispositivo o emulador. También están disponibles `npm run android` y `npm run ios` según el entorno de desarrollo. La app muestra una pantalla inicial; todavía no se conecta a la REST API.

## Configuración local y variables de entorno

La URL y las variables de la REST API se definirán durante ARCH-01. Aún no hay un archivo `.env.example` porque no existe el cliente HTTP. El `.gitignore` excluye archivos locales de entorno y permite publicar un ejemplo sin secretos cuando sea necesario.

## Ejecución y verificación

Comandos disponibles en `package.json`:

```bash
npm start          # servidor Expo
npm run android    # abrir en Android
npm run ios        # abrir en iOS
npm run typecheck  # comprobar tipos de TypeScript
npm test           # pruebas unitarias e integración (Jest)
```

El workflow `Quality` en `.github/workflows/quality.yml` se ejecuta en Pull Requests hacia `develop` y `main`, y en cambios enviados a ambas ramas, con dos jobs en orden:

1. **SAST (Semgrep)**, antes de compilar: analiza el código con las reglas de JavaScript/TypeScript, React, secretos expuestos y OWASP Top 10. Si hay hallazgos críticos (`ERROR`) el pipeline se detiene y no se ejecuta el siguiente job. El resultado aparece en el resumen de la ejecución y en la pestaña **Security** del repositorio.
2. **TypeScript and Expo checks**: `npm ci`, `npm run typecheck`, pruebas unitarias, pruebas de integración REST API y Expo Doctor.

Las acciones de GitHub se fijan por hash de commit. Para correr el análisis en local:

```bash
pip install semgrep
semgrep scan --config p/javascript --config p/typescript --config p/react --config p/secrets --config p/owasp-top-ten --exclude node_modules --exclude dist --metrics=off
```

Todavía no hay lint ni comprobación de formato. TEST-01 contempla regresión funcional y UAT; TEST-02, integración REST API y pruebas móviles.

## Estructura del repositorio

La app sigue **MVVM** sobre capas de **Clean Architecture** y aplica los patrones **Singleton**, **Factory**, **Repository** y **Observer**. El detalle está en [`docs/arquitectura.md`](docs/arquitectura.md).

```text
App.tsx                     Raíz: crea los ViewModels y elige la pantalla
src/
  domain/                   Modelos y reglas puras (catálogo, fechas y horarios)
  core/
    http/ApiClient.ts       Cliente REST (Singleton) con autenticación Bearer
    state/                  Observable y SessionStore (Observer)
  data/
    factories/              ModelFactory (Factory): respuestas de la API → modelos
    repositories/           Repositories: catálogo, disponibilidad, citas y autenticación
    storage/                Sesión cifrada con expo-secure-store
  presentation/
    viewmodels/             ViewModels (hooks) por pantalla
    screens/                Vistas: login, inicio, servicios, reserva, citas y perfil
    components/             Componentes reutilizables
    theme/                  Colores y estilos
test/
  fixtures/                 Datos de prueba con la forma real de la REST API
  unit/                     Pruebas de caja blanca por capa
  integration/              Repositories contra la REST API simulada
docs/                       Arquitectura y registro de pruebas
```

## Organización del trabajo

El [GitHub Project de Barbería Carlyn](https://github.com/users/KalebCarpio/projects/5) usa Scrumban con las vistas **Product Backlog** y **Tablero Scrumban**. El backlog administrativo contiene 26 Issues nuevos, agrupados en ocho Sprints semanales del 21 de septiembre al 15 de noviembre de 2026.

| Sprint | Fechas de 2026 | Enfoque |
| --- | --- | --- |
| 01 | 21–27 septiembre | Alcance, arquitectura, UI/UX y proyecto base |
| 02 | 28 septiembre–4 octubre | Autenticación y perfil |
| 03 | 5–11 octubre | Sucursales, servicios y barberos |
| 04 | 12–18 octubre | Disponibilidad |
| 05 | 19–25 octubre | Dashboard y citas |
| 06 | 26 octubre–1 noviembre | Gestión de citas |
| 07 | 2–8 noviembre | Historial y UX |
| 08 | 9–15 noviembre | Pruebas y documentación |

Estados: **Backlog → To Do → In Progress → Review / Testing → Done**. Límites WIP: 3 en In Progress y 2 en Review / Testing. La prioridad y los Story Points se consultan en el Project.

## Equipo y contribuciones

- **Kaleb Carpio:** [@KalebCarpio](https://github.com/KalebCarpio).
- **Javier Hernández González:** [@JavierHG13](https://github.com/JavierHG13).
- **Javier Flores Hernández:** [@JaviFlor10](https://github.com/JaviFlor10).

Cada cambio se relaciona con su Issue. Se utiliza el flujo `feature → develop → main`:

- `main`: versiones estables, revisadas y probadas.
- `develop`: integración de los avances del equipo.
- `feature/ID-descripcion`: una rama por Issue, creada desde `develop`. Por ejemplo, `feature/AUTH-01-login`. Las correcciones pueden usar `fix/BUG-01-error-critico`.

Para iniciar una actividad:

```bash
git fetch origin
git switch develop
git pull --ff-only origin develop
git switch -c feature/AUTH-01-login
# Realizar y comprobar los cambios; después crear el commit.
git push -u origin feature/AUTH-01-login
```

El Pull Request de cada actividad se dirige a `develop`. Antes de fusionarlo, otro integrante revisa el cambio, se comprueba el cumplimiento de los criterios de aceptación y deben pasar las verificaciones de Quality. Cuando el conjunto integrado cumple las pruebas previstas, se abre un Pull Request de `develop` hacia `main` y se vuelve a revisar y validar.

Quality se ejecuta en Pull Requests y pushes de ambas ramas. Actualmente comprueba TypeScript, pruebas unitarias, pruebas de integración REST API y Expo Doctor; la distribución de compilaciones móviles sigue pendiente. No se realiza un despliegue automático. Aún no se han configurado reglas automáticas de protección de ramas. Un Issue pasa a Done cuando cumple sus criterios de aceptación, está implementado y probado, no tiene bugs críticos, valida la integración REST API cuando aplique, fue revisado y tiene la documentación relacionada actualizada.

## Avance integrado en `feature/JAVIER/catalogo-y-citas-movil`

Esta rama incorpora un cliente movil funcional para consultar el catalogo y gestionar citas. El avance se relaciona con los Issues #53, #54, #59, #60 y #68.

### Funcionalidades incluidas

- Inicio de sesion, registro de cuenta y persistencia local de la sesion mediante `expo-secure-store`.
- Consulta de sucursales, servicios y barberos relacionados con una sucursal.
- Consulta de dias y horarios disponibles para el servicio elegido.
- Creacion, consulta, cancelacion y reprogramacion de citas desde la aplicacion.
- Consulta de proximas citas e historial de citas del usuario.
- Estados de carga, vacio y error para las consultas principales.
- Uso del logotipo de Carlyn y una interfaz visual alineada con la identidad de la barberia.

### Configuracion de la API

Copiar `.env.example` a `.env` y asignar la direccion del backend:

```ini
# Entorno de pruebas (staging) publicado en Render: funciona desde cualquier red
EXPO_PUBLIC_API_URL=https://barberia-carlyn-backend.onrender.com

# Backend local: solo funciona en la misma red Wi-Fi que el equipo
# EXPO_PUBLIC_API_URL=http://IP_DE_TU_EQUIPO:4000
```

En Expo Go no debe utilizarse `localhost`. El servidor gratuito de Render se suspende tras unos minutos sin uso, por lo que la primera consulta puede tardar hasta un minuto. El archivo `.env` no se versiona.

### Validacion antes de fusionar

```bash
npm ci
npm run typecheck
npm run test:unit
npm run test:integration
npx expo-doctor
```

### Pruebas y datos de prueba

| Carpeta | Tipo de prueba | Contenido |
| --- | --- | --- |
| `test/fixtures/` | Datos de prueba | Respuestas de la REST API con la misma forma que el backend real: servicios, sucursales, barberos, fechas y horarios |
| `test/unit/` | Unitarias (caja blanca) | Reglas de dominio, ApiClient (Singleton), SessionStore (Observer), ModelFactory (Factory) y ViewModels con Repositories falsos, sin red (40 pruebas) |
| `test/integration/` | Integración REST API | Repositories: endpoint, token, respuesta con datos, respuesta vacía, error de API y falla de red, con `fetch` simulado (24 pruebas) |

Los casos, datos usados y resultados de cada Issue se registran en [`docs/pruebas/catalogo-y-disponibilidad.md`](docs/pruebas/catalogo-y-disponibilidad.md).

Las pruebas completas con datos reales del backend y la aprobacion de otro integrante son necesarias antes de cerrar los Issues o fusionar la rama hacia `develop`.
