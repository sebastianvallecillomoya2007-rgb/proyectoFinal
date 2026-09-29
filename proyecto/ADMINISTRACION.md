# Administración NEXUS GAMES

## Ejecutar y entrar

Desde `proyecto`, ejecutar `npm run dev` y abrir la dirección que muestre Vite seguida de `/#/admin`.
El proyecto usa **HashRouter**: las rutas administrativas se escriben `/#/admin/games`, no `/admin/games` en la barra del navegador.
Sin sesión administrativa se redirige a `/#/admin/login`.

| Rol | Correo | Acceso |
| --- | --- | --- |
| SUPER ADMIN | superadmin@nexus.demo | Todas las secciones |
| ADMINISTRADOR | admin@nexus.demo | Juegos, usuarios, ventas y estadísticas |
| MODERADOR | moderador@nexus.demo | Usuarios y reseñas, incluidas las reportadas |
| EDITOR | editor@nexus.demo | Juegos, categorías, contenido y promociones |

Contraseña de todas las cuentas de demostración: **`NexusDemo2026!`**.
Las contraseñas introducidas no se guardan. La sesión solo almacena el identificador de una cuenta ficticia.

Esto es una simulación frontend, no autenticación ni autorización reales. No introducir información personal, tarjetas, CVV o credenciales reales.
La sesión de cliente de la tienda y la sesión administrativa son independientes: cerrar una no cierra la otra.

## Separación de la tienda

- No se modificaron el catálogo público, sus estilos, los componentes de compra, los servicios ni el servidor.
- `src/App.jsx` oculta la cabecera pública solo dentro de `/admin`.
- `src/routes/Routing.jsx` dirige `/admin/*` al nuevo panel. Las demás rutas conservan sus componentes.
- El panel administrativo anterior y sus servicios siguen conservados en sus archivos originales, pero `/admin` ahora utiliza el prototipo solicitado.
- Los juegos, promociones, banners y políticas editados son datos independientes: **no se publican en la tienda real**.
- Las preferencias del panel tampoco modifican las preferencias públicas del navegador.
- Todos los estilos nuevos están limitados a `.ac-root` o clases `ac-*`.

## Arquitectura

Todos los módulos nuevos están en `src/admin/control/`:

| Archivo | Responsabilidad |
| --- | --- |
| `AdminApp.jsx` | Rutas, sesión y comprobaciones de permisos |
| `AdminLogin.jsx` | Acceso demo y credenciales |
| `AdminLayout.jsx` | Sidebar, cabecera, búsqueda global y mensajes |
| `AdminDashboard.jsx` | Indicadores, alertas, ranking y gráficas |
| `AdminStatistics.jsx` | Estadísticas filtradas por período |
| `AdminSettings.jsx` | Preferencias, políticas y matriz de roles |
| `EntityPage.jsx` | Listas, filtros, paginación y acciones |
| `EntityForm.jsx` | Formularios y validación |
| `EntityDetails.jsx` | Fichas, historial de compras y juegos por estudio |
| `components.jsx` | Tabla, badges, tarjetas, estado vacío y modales accesibles |
| `schemas.js` | Campos y acciones por recurso |
| `model.js` | Datos mock, roles, cálculos y adaptador de almacenamiento |
| `useAdminStore.js` | Operaciones, persistencia, actividad y sesión |
| `admin.css` | Estilos aislados y adaptación a móvil |
| `admin.e2e.js` | Pruebas funcionales del panel |

Se reutilizan `GameImage` (incluido su fallback) y `SalesChart`. No se agregan dependencias.

## Funcionalidad y fases

Se ejecutó `npm run build` tras cada fase.

1. **Acceso y dashboard:** se crearon el modelo, el estado, el login, el layout, componentes, dashboard y CSS. Se ajustaron únicamente las dos entradas indicadas de la aplicación. Probar entrar, salir, las alertas y las escalas Día/Semana/Mes.
2. **Catálogo y comunidad:** se añadieron esquemas, formulario, fichas y páginas compartidas. Probar crear/editar/publicar/desactivar/eliminar un juego; bloquear/desbloquear usuarios; CRUD de categorías, géneros y etiquetas; filtros de ventas. Cancelar una eliminación conserva el registro.
3. **Operaciones:** se activaron promociones (campaña, cupón, descuento individual y bundle), moderación de reseñas, pagos simulados y reembolsos. Aprobar un reembolso cambia la venta y el pago asociado a Reembolsado; el dashboard deja de contarlo como ingreso. Las solicitudes resueltas no ofrecen una segunda resolución.
4. **Seguimiento:** se añadieron estadísticas y se activaron desarrolladores, contenido, notificaciones y actividad. Probar períodos de análisis, juegos por estudio, notificaciones leídas/no leídas y búsqueda global. Los resultados abren la ficha del registro.
5. **Preferencias y revisión:** se conectaron configuración, tema oscuro/medianoche, formato de fecha, zona horaria y notificaciones de acciones nuevas. Se revisaron permisos, almacenamiento y formularios. Se corrigió la separación del cálculo de gráficos requerida por Fast Refresh. Las pruebas de acceso del proyecto se actualizaron para la sesión demo solicitada.

La configuración admite español y USD, que son el idioma y moneda de los datos mock. No simula conversiones monetarias. Logo, favicon y políticas son contenido guardado para futura publicación, sin alterar la tienda pública. La zona horaria se utiliza en la fecha del dashboard; el historial conserva horas UTC explícitamente etiquetadas.

## Datos y persistencia

El conjunto inicial contiene 15 juegos, 15 usuarios, 36 ventas y pagos, 12 reseñas, 8 promociones, 12 notificaciones, 15 actividades, 5 desarrolladores y 5 reembolsos, además de categorías, etiquetas y contenido. Las fechas se generan en relación al día en que se inicializa la demo.

- Datos: `localStorage['nexus.admin.demo.v1']`.
- Sesión: `localStorage['nexus.admin.session.v1']`.
- Las mutaciones escriben primero en almacenamiento; si hay error de cuota o acceso, no se aplica el cambio en pantalla.
- Una carga incompatible muestra un error y conserva los datos guardados, sin sobrescribirlos.
- El historial conserva referencias de compras aunque se retire un juego o usuario del catálogo de demostración.
- Para reiniciar **solo** la demo, borrar estas dos claves en las herramientas del navegador y recargar. Esto elimina los cambios administrativos locales.
- No hay sincronización entre navegadores ni control de concurrencia entre pestañas.

## Integración futura

`repository.load/save` en `model.js` es el límite de persistencia que se puede sustituir por una API. `commit` en `useAdminStore.js` concentra las operaciones, incluida la actualización conjunta de reembolso, venta y pago. Una integración real deberá autenticar en servidor, comprobar permisos, validar entradas y ejecutar las operaciones relacionadas en transacciones. Los cupones y promociones se gestionan en el prototipo; no intervienen en el checkout público.

## Verificación

```sh
npm run build
npm run lint
npm run test:all
npx playwright test src/admin/control/admin.e2e.js src/requirements.e2e.js src/language.e2e.js
```

Playwright utiliza el servidor efímero existente del proyecto y datos de prueba aislados. Las imágenes externas se bloquean deliberadamente en las pruebas para comprobar también los fallbacks. Las capturas del dashboard se guardan en `artifacts/admin-375.png`, `artifacts/admin-768.png` y `artifacts/admin-1440.png`.

Resultados de la verificación: build correcto en las cinco fases, ESLint sin errores, 21 pruebas de servidor, 14 pruebas de lógica frontend y 10 pruebas de navegador aprobadas. La revisión visual permitió aislar también el ancho del sidebar y la disposición de la cabecera frente a los selectores globales del proyecto.
