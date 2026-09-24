# Cuentas de NEXUS GAMES

La configuración del catálogo externo y las categorías múltiples se documenta en [RAWG.md](./RAWG.md).

Desde esta carpeta ejecuta `npm run dev`: inicia Vite y la API local en el puerto 3001. Abre la dirección que indique Vite.

- `/#/login`: acceso de clientes.
- `/#/registro`: crear cuenta e iniciar sesión automáticamente.
- `/#/cuenta`: datos de la cuenta actual.
- `/#/admin/login`: acceso exclusivo para administradores, sin registro público.
- `/#/admin`: panel protegido con conteos, listado y búsqueda de clientes.

## Administrador y almacenamiento

En el primer inicio, el servidor crea `admin@nexusgames.com` con una contraseña aleatoria que muestra en la terminal una sola vez. Guarda esa contraseña. Opcionalmente puedes definir `ADMIN_EMAIL` y `ADMIN_PASSWORD` antes del primer inicio; no modifican una cuenta ya creada.

Las cuentas persisten en `bd.json`, excluido de Git. Las contraseñas usan scrypt con sal aleatoria. Las sesiones usan cookies HttpOnly y SameSite=Strict, duran ocho horas y se invalidan al cerrar sesión o reiniciar el servidor. El servidor verifica el rol en cada consulta del panel y siempre asigna el rol de cliente al registro público.

Este servidor con archivo JSON está pensado para el proyecto local y una sola instancia. Para publicarlo, usa HTTPS, `COOKIE_SECURE=true`, una base de datos y un proxy del mismo origen para `/api`; la API no forma parte de la compilación estática de Vite. No publiques el directorio de datos.

## Ventas y ofertas

El panel de administración incluye compras realizadas, unidades, ingresos en USD, promedio por compra y clientes compradores. Puedes filtrar todo el historial o los últimos 7 o 30 días. Los rankings muestran hasta cinco juegos disponibles: más vendidos con ventas y menos vendidos incluyendo cero ventas; los próximos lanzamientos se excluyen. Los empates se ordenan por nombre.

En **Precios y ofertas**, modifica el precio normal y activa una oferta con un importe inferior. Desactivar la oferta restaura el precio normal. Todos los precios admiten hasta dos decimales. La tienda consulta `/api/games` al abrirla, al recuperar el foco, al pulsar Actualizar tienda y cada 30 segundos.

Para generar operaciones, inicia sesión como cliente, pulsa **Comprar** y confirma la **compra de prueba**. No hay pasarela de pago ni cobros reales. Cada operación registra una unidad; una repetición accidental de la misma solicitud no duplica la compra. El servidor comprueba el precio antes de guardar. Las estadísticas comienzan en cero, sin ventas inventadas.

El catálogo se inicializa desde `public/db.json` una sola vez y luego se guarda junto con las compras en `bd.json` (excluido de Git). Los cambios persisten al reiniciar. Cada compra conserva el precio de ese momento, aunque cambien las ofertas. Las rutas de estadísticas y edición de precios exigen una sesión de administrador.

## Verificación

- `npm test`: pruebas de registro, credenciales, cookies, roles, cierre de sesión y almacenamiento.
- `npm run lint`: análisis del código.
- `npm run build`: compilación del frontend.
- Para revisar la compilación: `npm run server` y, en otra terminal, `npm run preview`.
