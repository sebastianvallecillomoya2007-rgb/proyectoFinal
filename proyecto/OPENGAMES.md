# Catálogo OpenGames

Ejecuta `npm install` y `npm run dev` desde `proyecto`. Reinicia el proceso si cambias las variables de entorno.

## Configuración

```env
VITE_API_URL=https://opengames.dev/api
OPENGAMES_FALLBACK_URL=https://www.open-source-games.com/api
```

La API documentada en https://www.open-source-games.com/api no requiere clave. En la comprobación del 24 de septiembre de 2026, opengames.dev no resolvía por DNS, mientras que el dominio de la documentación respondió con un catálogo de 1016 juegos. El adaptador intenta la URL solicitada y usa el respaldo del mismo proveedor si falla. No se envían credenciales de NEXUS al proveedor.

El servidor lee VITE_API_URL desde .env y adapta las respuestas. El navegador utiliza /api mediante el proxy de Vite, evitando depender de CORS del proveedor. OPENGAMES_API_URL permite sobrescribir la dirección solo en el servidor; un valor vacío desactiva la importación para pruebas. RAWG ya no se consulta.

## Catálogo y datos disponibles

La primera visita inicia una importación paginada de 100 juegos por solicitud, con una pausa entre páginas. La interfaz muestra progreso y conserva el catálogo existente. La sincronización se puede repetir después de cinco minutos; tras errores espera treinta segundos antes de reintentar. Las fichas tienen caché de cinco minutos. Los juegos se guardan en bd.json, manteniendo los precios administrados y las compras anteriores.

Búsqueda por nombre o descripción, filtro por género/plataforma, ordenación y carga de 24 tarjetas por vez. La búsqueda abarca todos los juegos importados; mientras se importa, la interfaz lo indica.

La ficha /#/juego/:id muestra descripción, imágenes proporcionadas, plataformas, licencia, versión, repositorio y otros datos disponibles. Muchos registros no tienen imágenes ni plataformas. En ese caso se muestra la ausencia del dato. Las estrellas de GitHub se presentan como popularidad, nunca como reseñas.

OpenGames no proporciona precios de venta ni reseñas de jugadores en su contrato documentado. Los precios son los administrados en NEXUS; si no existe precio se desactiva la compra y se ofrece el sitio oficial cuando está disponible. Las compras siguen siendo demostraciones sin cobros ni entrega de licencias.

## Reseñas y deseados

Se guardan en bd.json. Los deseados son privados por cuenta y se consultan en /#/deseados. Los clientes pueden escribir o actualizar una reseña por juego (1–5 estrellas, 10–2000 caracteres). Las reseñas muestran el nombre público, sin correo ni identificador de usuario.

Las cuentas y la administración siguen usando /api/auth y /api/admin. Al iniciar sesión desde una ficha o desde deseados, se regresa al apartado solicitado.

## Comprobación

`npm test`, `npm run lint` y `npm run build`. Las pruebas automatizadas usan respuestas controladas y no dependen de OpenGames. Los datos locales de pruebas se crean en directorios temporales aislados.
