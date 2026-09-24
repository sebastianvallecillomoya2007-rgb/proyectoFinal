# Cuentas de NEXUS GAMES

Desde esta carpeta ejecuta `npm run dev`: inicia Vite y la API local en el puerto 3001. Abre la dirección que indique Vite.

- `/#/login`: acceso de clientes.
- `/#/registro`: crear cuenta e iniciar sesión automáticamente.
- `/#/cuenta`: datos de la cuenta actual.
- `/#/admin/login`: acceso exclusivo para administradores, sin registro público.
- `/#/admin`: panel protegido con conteos, listado y búsqueda de clientes.

## Administrador y almacenamiento

En el primer inicio, el servidor crea `admin@nexusgames.com` con una contraseña aleatoria que muestra en la terminal una sola vez. Guarda esa contraseña. Opcionalmente puedes definir `ADMIN_EMAIL` y `ADMIN_PASSWORD` antes del primer inicio; no modifican una cuenta ya creada.

Las cuentas persisten en `server/data/users.json`, excluido de Git. Las contraseñas usan scrypt con sal aleatoria. Las sesiones usan cookies HttpOnly y SameSite=Strict, duran ocho horas y se invalidan al cerrar sesión o reiniciar el servidor. El servidor verifica el rol en cada consulta del panel y siempre asigna el rol de cliente al registro público.

Este servidor con archivo JSON está pensado para el proyecto local y una sola instancia. Para publicarlo, usa HTTPS, `COOKIE_SECURE=true`, una base de datos y un proxy del mismo origen para `/api`; la API no forma parte de la compilación estática de Vite. No publiques el directorio de datos. El catálogo continúa leyendo `public/db.json`.

## Verificación

- `npm test`: pruebas de registro, credenciales, cookies, roles, cierre de sesión y almacenamiento.
- `npm run lint`: análisis del código.
- `npm run build`: compilación del frontend.
- Para revisar la compilación: `npm run server` y, en otra terminal, `npm run preview`.
