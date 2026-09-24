# Base de datos única

La aplicación guarda toda la información persistente en `proyecto/bd.json`:

- `games`: catálogo, metadatos, imágenes (URLs), precios y ofertas.
- `users`: usuarios, roles y contraseñas protegidas con scrypt y sal.
- `orders`: compras y precios registrados al comprar.
- `wishlist`: juegos deseados por usuario.
- `reviews`: reseñas y valoraciones de los usuarios.

El servidor usa este archivo para las cuentas, el catálogo y la comunidad. Cada escritura conserva las demás colecciones y reemplaza el archivo de forma atómica. Esta base JSON está pensada para una sola instancia del servidor.

Al arrancar por primera vez, si no existe `bd.json`, se migran `server/data/users.json`, `server/data/commerce.json` y `server/data/community.json`. Los archivos anteriores quedan como respaldo y ya no reciben escrituras. Si no existe catálogo previo, `public/db.json` sirve únicamente para cargar los juegos iniciales.

`bd.json` está excluido de Git y bloqueado en el servidor de archivos de Vite. No debe copiarse a `public` ni distribuirse con la web. El navegador recibe solo la información autorizada mediante la API.

Reinicia `npm run dev` después de actualizar el servidor. Las sesiones siguen siendo temporales y se invalidan al reiniciar, pero las cuentas, los juegos y la comunidad se conservan.

Para pruebas, `AUTH_DATA_DIR` permite elegir otro directorio: allí se crea un `bd.json` aislado.
