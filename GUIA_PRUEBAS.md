# Guía para probar Villa Coco localmente

Esta guía permite levantar el proyecto desde cero después de clonar el repositorio.

El proyecto tiene dos partes que deben estar funcionando al mismo tiempo:

- **Frontend:** aplicación Next.js, disponible en `http://localhost:3000`.
- **Backend:** WordPress y MySQL, ejecutados con Docker y disponibles en `http://localhost:8881`.

> Importante: el repositorio incluye el código, pero no necesariamente los datos reales de WordPress (villas, imágenes, usuarios y reservas). Para ver exactamente la misma demostración, pide al responsable del proyecto una exportación sanitizada de la base de datos.

## 1. Requisitos

Instala estas herramientas antes de comenzar:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) versión 20 o superior
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

Abre Docker Desktop y verifica que esté en ejecución antes de levantar WordPress.

## 2. Clonar el proyecto

En PowerShell o una terminal, ejecuta:

```powershell
git clone <URL_DEL_REPOSITORIO>
cd "Hackaton villa coco"
npm ci
```

Reemplaza `<URL_DEL_REPOSITORIO>` por la URL real de GitHub o GitLab.

## 3. Configurar las variables locales

Crea el archivo de variables a partir del ejemplo:

```powershell
Copy-Item .env.example .env.local
```

Abre `.env.local` y confirma que tenga, como mínimo:

```env
WORDPRESS_API_URL=http://localhost:8881
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Las variables de HubSpot son opcionales para una prueba local. Si no están configuradas, la solicitud se guardará en WordPress, pero no se enviará a HubSpot.

## 4. Levantar WordPress y MySQL

Desde la raíz del proyecto, ejecuta:

```powershell
docker compose -f wordpress-docker/docker-compose.yml up -d
```

Cuando termine, abre:

- Sitio WordPress: `http://localhost:8881`
- Administración de WordPress: `http://localhost:8881/wp-admin`

En una instalación nueva, WordPress mostrará su asistente inicial. Complétalo creando un usuario administrador local.

Después entra a **Plugins** y verifica que esté activo **Villa Coco Reservations**. También deben estar activos los plugins requeridos para el contenido de villas, como ACF y CPT UI si el sitio los utiliza.

## 5. Levantar el frontend

En otra terminal, desde la raíz del proyecto, ejecuta:

```powershell
npm run dev
```

Abre estas páginas:

- Inicio: `http://localhost:3000`
- Listado de villas: `http://localhost:3000/villas`

## 6. Probar el calendario y las solicitudes

1. Entra al detalle de una villa desde el listado.
2. Selecciona una fecha de entrada y después una fecha de salida.
3. Si seleccionas la misma fecha de entrada, se deselecciona.
4. Los días con reservas aprobadas/publicadas en WordPress aparecen bloqueados.
5. Completa los datos del formulario y envíalo.
6. El botón se bloquea después de enviar correctamente para evitar solicitudes duplicadas.
7. En WordPress, entra a `wp-admin → Reservations` para ver la solicitud creada como pendiente.
8. Al publicar/aprobar la reserva, sus noches se bloquean en el calendario de esa villa.

El campo de salida no se considera noche ocupada: una reserva del 10 al 13 bloquea los días 10, 11 y 12; el 13 vuelve a estar disponible para una nueva entrada.

## 7. Datos de demostración

Un clon limpio puede iniciar sin villas ni reservas, porque esos datos viven en la base de datos de WordPress.

Para probar la misma información que el equipo original, solicita:

- Una exportación sanitizada de la base de datos de WordPress.
- Las imágenes o archivos de `uploads` que se necesiten, si no están versionados en el repositorio.
- Las credenciales locales o instrucciones de importación correspondientes.

No importes una base de datos sobre una instalación que contenga información importante sin crear antes un respaldo.

## 8. Detener el entorno

Para detener los contenedores, ejecuta:

```powershell
docker compose -f wordpress-docker/docker-compose.yml down
```

No agregues `-v` a ese comando a menos que quieras borrar también los volúmenes y datos locales de MySQL.

## Problemas frecuentes

### Docker no inicia

Verifica que Docker Desktop esté abierto y que el motor de Docker esté activo. Después repite el comando de la sección 4.

### El frontend no muestra villas

Comprueba que WordPress responda en `http://localhost:8881` y que `WORDPRESS_API_URL` tenga ese mismo valor en `.env.local`. Si WordPress está vacío, importa los datos de demostración o crea una villa desde el administrador.

### El calendario no bloquea fechas

Verifica que la reserva esté relacionada con la villa correcta y publicada/aprobada. Las solicitudes pendientes no bloquean las fechas hasta su aprobación.

### HubSpot no recibe la solicitud

Comprueba en `.env.local` que `HUBSPOT_PORTAL_ID` y `HUBSPOT_FORM_ID` estén configurados con valores reales y que las propiedades del formulario de HubSpot coincidan con las enviadas por el proyecto.
