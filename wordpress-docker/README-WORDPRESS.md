# WordPress de Villa Coco

WordPress funciona como CMS headless: el equipo agrega las villas en el panel de administración y Next.js las muestra en la portada. Al seleccionar una villa, el sitio abre su formulario con calendario.

## Abrir WordPress localmente

1. Abre Docker Desktop.
2. Desde la carpeta `wordpress-docker`, ejecuta:

   ```powershell
   docker compose up -d
   ```

3. Abre `http://localhost:8881/wp-admin`.
4. Inicia sesión con el usuario administrador creado durante la instalación de WordPress. La contraseña no está guardada en este repositorio.

Para detenerlo sin borrar información:

```powershell
docker compose stop
```

No elimines la carpeta `wordpress-docker/mysql`: contiene la base de datos local.

## Plugins necesarios

En **Plugins**, verifica que estén activos:

- Advanced Custom Fields (ACF)
- Custom Post Type UI (CPT UI)
- Villa Coco Reservations

## Configurar el tipo de contenido Villa

En **CPT UI → Add/Edit Post Types**, el tipo debe tener esta configuración:

- Post Type Slug: `villa`
- Plural Label: `Villas`
- Singular Label: `Villa`
- Public: `true`
- Show in REST API: `true`
- REST API base slug: `villa`
- Soporte para título, editor, extracto e imagen destacada

La API debe responder en:

```text
http://localhost:8881/wp-json/wp/v2/villa?_embed
```

## Campos ACF que consume el sitio

Crea un grupo llamado **Información de la Villa**, asígnalo al Post Type `Villa` y usa exactamente estos nombres de campo:

| Etiqueta | Nombre ACF | Tipo recomendado |
|---|---|---|
| Descripción corta | `description_short` | Text Area |
| Descripción larga | `description_long` | Text Area o WYSIWYG |
| Galería | `gallery` | Gallery o Repeater de imágenes |
| Suites | `suites_count` | Number |
| Estancia mínima | `minimum_stay_nights` | Number |
| Recámaras | `bedrooms` | Number |
| Baños | `bathrooms` | Number |
| Ubicación | `location` | Text |
| Tipo de estancia | `use_cases` | Checkbox |
| Amenidades | `amenities` | Checkbox |
| Precio por noche | `price` | Number |

La **imagen destacada** es la fotografía principal de la tarjeta y del formulario. La galería es opcional.

## Agregar una nueva villa

1. Entra a **Villas → Añadir nueva**.
2. Escribe el título, por ejemplo `Casa Cielo`.
3. Agrega una imagen destacada.
4. Completa los campos de **Información de la Villa**.
5. Pulsa **Publicar**.
6. Comprueba que aparezca en `http://localhost:8881/wp-json/wp/v2/villa?_embed`.
7. Recarga la portada de Next.js. No hace falta modificar código ni volver a desplegar para agregar contenido.

El slug que genera WordPress se usa en la URL del formulario, por ejemplo `/villas/casa-cielo`.

## Disponibilidad y reservas

El plugin **Villa Coco Reservations** agrega el menú **Reservas**.

- Las solicitudes del formulario se guardan como pendientes.
- Solo las reservas publicadas bloquean días en el calendario.
- Antes de publicar una reserva, verifica la villa y las fechas de entrada y salida.

## Conectar el deploy con WordPress

WordPress debe estar disponible mediante una URL HTTPS pública. Si se usa ngrok, Docker y el túnel deben permanecer encendidos.

Configura estas variables en Vercel con la misma URL pública de WordPress:

```text
WORDPRESS_API_URL=https://tu-wordpress-publico.example
WORDPRESS_PROXY_ORIGIN=https://tu-wordpress-publico.example
WORDPRESS_PUBLIC_URL=https://tu-wordpress-publico.example
NEXT_PUBLIC_WORDPRESS_URL=https://tu-wordpress-publico.example
```

Después de cambiar una variable en Vercel, realiza un redeploy. Si cambia el dominio de ngrok, actualiza las cuatro variables. Para un sitio permanente conviene alojar WordPress en un servidor con dominio estable; un túnel local deja de responder cuando la computadora, Docker o ngrok se apagan.

Las imágenes se sirven al navegador a través de `/api/wordpress-media/...`. Esto evita el bloqueo de Vercel sobre rutas llamadas `/wp-content`, pero el servidor de WordPress debe seguir accesible para que el proxy pueda obtener los archivos.
