# Catálogo RAWG

## Configuración

1. Obtén tu clave en https://rawg.io/apidocs.
2. En `proyecto/.env`, completa `RAWG_API_KEY=tu_clave`. `.env.example` sirve como plantilla; `.env` está excluido de Git.
3. Reinicia `npm run dev` desde la carpeta `proyecto`. El servidor carga `.env` automáticamente. No uses un prefijo `VITE_` para la clave: solo debe estar en el servidor.

Al abrir la tienda se importan en segundo plano hasta cinco páginas de RAWG (200 juegos, ordenados por popularidad según `added`) y tres colecciones de hasta 20 juegos cada una: novedades, próximos lanzamientos e independientes. Los duplicados se unifican. El catálogo guardado aparece inmediatamente y la pantalla se actualiza mientras termina la importación. **Descubrir más juegos** importa otra página; **Mostrar más juegos** pagina los resultados guardados en grupos de 24. Sin clave o durante un fallo del proveedor, permanece disponible el catálogo guardado.

La portada incluye destacados, colecciones por género, ofertas, valoraciones y próximos lanzamientos. Cada juego tiene una ficha con los datos disponibles. Los filtros de plataforma y género se combinan con la búsqueda; se puede ordenar por popularidad, valoración, lanzamiento, precio y nombre.

## Fechas y plataformas

Deja `RAWG_DATES` y `RAWG_PLATFORMS` vacíos para no restringir las importaciones. Para reproducir el ejemplo del proveedor:

```dotenv
RAWG_DATES=2019-09-01,2019-09-30
RAWG_PLATFORMS=18,1,7
```

Reinicia el servidor después de cambiar la configuración. Los filtros de importación no eliminan juegos que ya estén guardados. `GET /api/platforms` consulta las plataformas de RAWG sin exponer la clave.

## Categorías y precios

- Se guardan todos los géneros de RAWG en `categories`, sin duplicados. RPG se normaliza como `rpg`; las etiquetas de terror y ciencia ficción agregan `horror` y `scifi`.
- Cada tarjeta muestra sus categorías. La barra lateral se genera con las categorías de los juegos cargados. Un juego de Acción y RPG aparece en ambos filtros.
- La búsqueda y los filtros de categoría/plataforma operan sobre los juegos ya cargados. Puedes cargar más páginas con los filtros activos. Las plataformas desconocidas de juegos locales no coinciden con una plataforma específica.
- RAWG aporta metadatos; los precios de la tienda se gestionan localmente. Un juego nuevo empieza con **Precio pendiente**, sin botón de compra. Asigna su precio desde Administración → Precios y ofertas.
- Las importaciones conservan los IDs, precios, ofertas y ventas locales. Para vincular un juego existente se usa su ID RAWG, o una coincidencia exacta de nombre normalizado si aún no tiene ID RAWG.
- Las páginas de RAWG se almacenan en caché durante 15 minutos para reducir consultas repetidas; las solicitudes simultáneas iguales comparten la misma consulta. Hay un tiempo máximo de 12 segundos por consulta.
- Las tarjetas y páginas incluyen atribución y enlaces a RAWG. Los enlaces de paginación externos, que pueden contener la clave, no se envían al navegador.

## Verificación

`npm test` incluye pruebas con respuestas simuladas de RAWG para categorías múltiples, paginación, caché, errores y preservación de precios y compras. Una consulta real requiere una clave válida. `npm run lint` y `npm run build` verifican el frontend.
