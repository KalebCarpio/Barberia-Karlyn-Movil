# Barbería Carlyn — aplicación móvil administrativa

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
| Framework móvil y lenguaje | Expo SDK 57, React Native 0.86 y TypeScript 6; base reutilizada del repositorio de pruebas |
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
```

Aún no hay pruebas automatizadas ni flujo de integración. TEST-01 contempla regresión funcional y UAT; TEST-02, integración REST API y pruebas móviles.

## Estructura del repositorio

La base publicada contiene:

```text
App.tsx            Pantalla inicial de la aplicación
index.js           Registro del componente principal en Expo
app.json           Nombre y configuración de Expo
package.json       Dependencias y scripts
package-lock.json  Versiones resueltas de dependencias
tsconfig.json       Configuración de TypeScript
.gitignore         Exclusión de archivos locales y generados
README.md          Documentación del proyecto
```

La navegación, el cliente HTTP y la estructura funcional se incorporarán cuando se implementen los Issues correspondientes.

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

Cada cambio se relaciona con su Issue. La rama `main` reúne las versiones integradas. Para cada trabajo se crea una rama corta desde `main`, por ejemplo `feature/ARCH-01-arquitectura-movil` o `fix/BUG-01-error-critico`. El cambio se propone mediante un Pull Request hacia `main`, se revisa y se prueba antes de fusionarlo. Aún no se han configurado reglas automáticas de protección de ramas. Un Issue pasa a Done cuando cumple sus criterios de aceptación, está implementado y probado, no tiene bugs críticos, valida la integración REST API cuando aplique, fue revisado y tiene la documentación relacionada actualizada.
