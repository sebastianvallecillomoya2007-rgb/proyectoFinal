# Integración del punto 2

Las funciones están conectadas conservando las carpetas y los estilos existentes. Los controles añadidos reutilizan las clases actuales.

| Apartado | Implementación |
| --- | --- |
| 2.1 Arquitectura | React Router DOM, rutas protegidas y peticiones centralizadas en `src/service`. |
| 2.2 Accesibilidad | Tema, contraste, texto ajustable, ARIA y navegación por teclado. Verificada la tienda a 375, 768 y 1280 px. El texto al 200 % puede causar desplazamiento horizontal en móvil con los estilos existentes. |
| 2.3 Datos | JSON Server en `/api/admin/resources` y base privada `server/data/db.json`. Se migra `bd.json` conservando el original. Servicio externo OpenGames con respaldo local. |
| 2.4 Autenticación | Registro, inicio de sesión, rutas públicas/privadas y sesiones persistentes mediante hashes de tokens. |
| 2.5 Roles | client/admin persistentes, comprobados por el servidor. |
| 2.6 CRUD | Usuarios, juegos, pedidos, deseados y reseñas desde «Gestionar registros». Validaciones y protección de referencias. |
| 2.7 Métricas | Panel de ventas y gráfico SVG accesible. |
| 2.8 Jest | Pruebas del servicio HTTP, categorías, ranking e idiomas. |
| 2.9 IA | Búsqueda semántica con Transformers.js en un Web Worker. La primera descarga necesita conexión. La inferencia con descarga real requiere verificación adicional; el fallo de inicio conserva la búsqueda normal. |
| 2.10 n8n | Dos flujos de registro y compra, cola persistente y reintentos. Requieren n8n en ejecución y workflows activos. |

## Ejecución

Desde esta carpeta, ejecutar `npm install` y `npm run dev`. En otra terminal, `npm run n8n` inicia n8n 2.40.7 en `127.0.0.1:5678`, con sus datos privados en `server/data/n8n`.

Los workflows `server/n8n-registro.json` y `server/n8n-compra.json` generan una bienvenida y un comprobante de compra de prueba. No envían correos ni cobran dinero. Las variables de conexión están en `.env.example`. El administrador puede consultar y reintentar eventos desde «Gestionar registros».

Estado de la comprobación local: n8n inició y reconoció dos workflows publicados, pero sus webhooks devolvieron HTTP 404. La activación efectiva de esos endpoints queda pendiente; no se consideran verificadas las automatizaciones de extremo a extremo.

Estado de la comprobación local: n8n inició y reconoció dos workflows publicados, pero sus webhooks devolvieron HTTP 404. La activación efectiva de esos endpoints queda pendiente; no se consideran verificadas las automatizaciones de extremo a extremo.

## Idiomas

En **Ajustes → Idioma**: Español, English y 日本語. El cambio es inmediato, actualiza `html.lang` y se guarda en el navegador. Las etiquetas, formularios y mensajes tienen traducciones. Títulos, descripciones de catálogo, nombres y reseñas conservan su contenido. Las traducciones están en `src/data/translations.js`.

## Verificación

- `npm run build`: compilación correcta.
- `npm run lint`: sin errores.
- `npm test`: 21 pruebas de servidor aprobadas.
- `npm run test:frontend`: 14 pruebas Jest aprobadas.
- Pruebas de navegador: idiomas y persistencia, tres anchos de pantalla, sesión y permisos, CRUD, gráfico y búsqueda normal ante fallo de inicio de IA aprobados.

`npm run test:e2e` ejecuta las pruebas de navegador. La prueba opcional de descarga e inferencia real se habilita con `NEXUS_REAL_AI=1`; no forma parte de la ejecución predeterminada.
