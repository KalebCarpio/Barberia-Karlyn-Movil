# Barbería Carlyn — aplicación móvil administrativa

Repositorio de la aplicación móvil de **Barbería Carlyn**, enfocada en que el administrador consulte y gestione las citas del negocio. El identificador técnico del repositorio conserva la grafía `Barberia-Karlyn-Movil`; el nombre del negocio en la documentación es **Barbería Carlyn**.

> **Estado del proyecto:** fase inicial. El repositorio contiene por ahora esta documentación; todavía no se ha publicado el código de la aplicación ni se ha definido el stack móvil.

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
| Framework móvil y lenguaje | Pendientes de definición en ARCH-01 |
| Estructura de carpetas y navegación | Pendientes de SETUP-02 |
| Cliente HTTP y configuración de entornos | Pendientes de ARCH-01 y SETUP-02 |
| Backend | REST API existente; los endpoints concretos se documentarán al integrar |
| Estrategia de pruebas | Se define en SETUP-02 y se ejecuta en los Issues TEST-01 y TEST-02 |

El cliente móvil enviará solicitudes a la API y mostrará sus respuestas, incluidos errores y estados de disponibilidad. Los contratos y reglas del backend guiarán la implementación.

## Requisitos e instalación

Las versiones de herramientas, dependencias y pasos de instalación se documentarán **cuando se publique el proyecto base** en SETUP-02. Por ahora no hay comandos de instalación ejecutables ni una aplicación que iniciar.

Esta sección deberá incluir:

1. Herramientas y versiones requeridas.
2. Clonación del repositorio e instalación de dependencias.
3. Preparación del entorno móvil y del dispositivo o emulador.
4. Configuración local de la URL de la REST API.
5. Pasos para iniciar la aplicación.

## Configuración local y variables de entorno

La configuración de la API se definirá durante la implementación. Se agregará un archivo de ejemplo con los nombres de variables requeridas, sin credenciales reales. No deben subirse secretos ni archivos locales de entorno.

## Ejecución y verificación

Los comandos reales de inicio, compilación, análisis estático y pruebas se añadirán cuando el stack y los scripts existan. TEST-01 contempla regresión funcional y UAT; TEST-02, integración REST API y pruebas móviles. No se declaran verificaciones automáticas como realizadas antes de configurarlas.

## Estructura del repositorio

La estructura de carpetas todavía no existe. Se documentará aquí después de SETUP-02 para que coincida con los archivos publicados, en lugar de presentar carpetas previstas como si ya estuvieran implementadas.

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
- **Javier Flores Hernández:** usuario de GitHub pendiente de confirmar.

Cada cambio deberá asociarse con el Issue correspondiente y revisarse antes de considerarse terminado. La estrategia definitiva de ramas y Pull Requests se acordará y documentará cuando comience el desarrollo. Un Issue pasa a Done cuando cumple sus criterios de aceptación, está implementado y probado, no tiene bugs críticos, valida la integración REST API cuando aplique, fue revisado y tiene la documentación relacionada actualizada.
