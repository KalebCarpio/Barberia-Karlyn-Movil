# Barbería Carlyn — aplicación móvil administrativa

Aplicación móvil del MVP de Barbería Carlyn, enfocada en que el administrador consulte y gestione citas. Este repositorio contiene el trabajo de la aplicación móvil; la REST API existente es la fuente de verdad para datos y reglas de negocio.

> **Estado:** repositorio inicial. La aplicación, sus dependencias y las instrucciones de ejecución aún no están implementadas.

## Alcance del MVP

- Inicio de sesión administrativo, gestión de sesión, recuperación de acceso y perfil.
- Consulta de sucursales, servicios, barberos, fechas y horarios disponibles.
- Dashboard con citas pendientes y próximas, filtros y detalle de cita.
- Modificación, reprogramación, actualización de estado y cancelación de citas.
- Historial de citas, manejo de carga, estados vacíos y errores.
- Pruebas funcionales, móviles y de integración con la REST API.

No se incluyen punto de venta, productos, respaldos, administración avanzada de bases de datos ni analítica compleja. Las reglas de negocio se validan en el backend; la aplicación móvil consume sus respuestas.

## Planeación

El trabajo se organiza con **Scrumban** en [Barbería Carlyn – Mobile App Development](https://github.com/users/KalebCarpio/projects/5). El Product Backlog contiene 26 Issues nuevos distribuidos en ocho Sprints semanales, del 21 de septiembre al 15 de noviembre de 2026.

| Sprint | Periodo | Enfoque |
| --- | --- | --- |
| 01 | 21–27 sep 2026 | Alcance, arquitectura, UX y configuración inicial |
| 02 | 28 sep–4 oct 2026 | Autenticación y perfil |
| 03 | 5–11 oct 2026 | Sucursales, servicios y barberos |
| 04 | 12–18 oct 2026 | Disponibilidad |
| 05 | 19–25 oct 2026 | Dashboard y consulta de citas |
| 06 | 26 oct–1 nov 2026 | Gestión de citas |
| 07 | 2–8 nov 2026 | Historial y UX |
| 08 | 9–15 nov 2026 | Pruebas y documentación |

Flujo de trabajo: **Backlog → To Do → In Progress → Review / Testing → Done**. Límites WIP: 3 en In Progress y 2 en Review / Testing. Los Issues nuevos comienzan en Backlog.

## Equipo

- **Kaleb Carpio:** [@KalebCarpio](https://github.com/KalebCarpio).
- **Javier Hernández González:** [@JavierHG13](https://github.com/JavierHG13).
- **Javier Flores Hernández:** usuario de GitHub pendiente de confirmar.

## Desarrollo y ejecución

La arquitectura, el stack y la estructura del proyecto se definirán en **ARCH-01** y **SETUP-02**. Cuando se publique el proyecto base, esta sección incluirá requisitos, instalación, configuración local, variables de entorno, comandos para ejecutar y probar la app, y la referencia a los endpoints de la REST API. No se deben subir credenciales ni archivos de entorno con secretos.

Cada cambio debe relacionarse con su Issue. Para considerarlo Done debe estar implementado, cumplir sus criterios de aceptación, estar probado, no tener bugs críticos, validar la integración REST API cuando aplique, pasar revisión y actualizar la documentación relacionada.

## Repositorio

El identificador técnico y la URL conservan `Barberia-Karlyn-Movil`; el nombre del proyecto y del negocio en esta documentación es **Barbería Carlyn**.
