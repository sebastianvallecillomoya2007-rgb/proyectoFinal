# Catálogo FreeToGame

FreeToGame se suma al catálogo de NEXUS; no sustituye OpenGames ni los juegos, precios, compras o cuentas existentes. Sus IDs usan el prefijo `freetogame-` para evitar colisiones con los IDs locales.

## Uso

1. Reiniciar el servidor con `npm run dev` si ya estaba abierto antes de la integración.
2. Abrir la tienda. La carga del catálogo gratuito se inicia en segundo plano y mantiene visible el catálogo guardado.
3. En **Catálogo**, elegir **Juegos gratuitos · FreeToGame**.
4. Usar las categorías laterales, el filtro Windows/Navegador y los órdenes relevancia, nombre, fecha o popularidad.
5. Abrir la ficha para ver descripción, capturas, desarrollador, distribuidor, requisitos disponibles y enlace del proveedor. La búsqueda de texto sigue funcionando dentro de los resultados.
6. Con una cuenta de cliente, guardar en deseados o usar la obtención de prueba existente. El juego aparece en la biblioteca de «Mi perfil».

Los juegos de FreeToGame tienen precio de acceso **0 / Gratis**. La API no ofrece precios de juegos comerciales ni precios de compras internas. El catálogo de pago conserva sus precios actuales. La obtención en NEXUS sigue siendo una operación de prueba; el enlace externo permite visitar la página del juego.

## Endpoints

Los nombres oficiales están en inglés, no `/juegos` ni parámetros traducidos:

| Operación | FreeToGame | Integración local |
| --- | --- | --- |
| Catálogo | `/api/games` | `/api/freetogame/games` |
| Género | `/api/games?category=shooter` | `/api/freetogame/games?category=shooter` |
| Plataforma | `/api/games?platform=windows` | `/api/freetogame/games?platform=windows` |
| Orden | `/api/games?sort-by=release-date` | `/api/freetogame/games?sort-by=release-date` |
| Detalle | `/api/game?id=452` | `/api/games/freetogame-452` |

Los filtros se pueden combinar. Órdenes admitidos: `relevance`, `popularity`, `alphabetical`, `release-date`. La ruta visual existente de una ficha es `/#/juego/freetogame-452`.

Documentación oficial: [FreeToGame API](https://www.freetogame.com/api-doc). La aplicación incluye atribución y enlace activo a [FreeToGame](https://www.freetogame.com/).

## Arquitectura y disponibilidad

- `server/freetogame.js`: normalización de respuestas, validación de filtros, detalles, caché de cinco minutos, deduplicación y separación entre solicitudes para respetar el límite del proveedor.
- `server/commerce.js`: incorpora únicamente los IDs del proveedor; preserva el resto del catálogo. Los resúmenes no borran capturas, requisitos ni descripciones completas previamente recuperadas.
- `server/index.js`: usa el servidor existente como proxy y ofrece fichas compatibles con reseñas, deseados y la biblioteca del cliente.
- `src/service/useFreeCatalog.js`: carga filtrada con cancelación de solicitudes obsoletas.
- `Store`, `GameCard`, `GamePage` y `GameRequirements`: reutilizan la estructura y los estilos existentes.

La variable opcional `FREETOGAME_API_URL` tiene por defecto `https://www.freetogame.com/api`. Un valor vacío desactiva las consultas externas. No se necesita clave de API ni una dependencia adicional.

Si el proveedor no responde, se conservan los juegos ya importados en la base local. La interfaz avisa cuando muestra datos guardados. Los filtros por etiquetas y la ordenación del proveedor pueden tener resultados incompletos sin conexión. Las pruebas automáticas usan fixtures, no la red pública.

## Mi perfil

El botón del banner está dentro de la portada, en su esquina superior derecha. «Tus amigos» ocupa una barra lateral derecha desde 960 px; en pantallas menores se coloca después de la biblioteca.

El avatar abre un menú con vista previa, carga, ajuste y eliminación confirmada. El editor admite arrastre con ratón o dedo, movimiento por teclado, zoom, giro, centrado, encuadre completo y restauración. El avatar usa una vista circular. Cancelar no guarda cambios; el guardado conserva imagen y encuadre en la API de perfil existente.

## Verificación

```sh
npm run build
npm run lint
npm run test:all
npx playwright test src/profile.e2e.js src/freetogame.e2e.js src/requirements.e2e.js src/language.e2e.js
```
