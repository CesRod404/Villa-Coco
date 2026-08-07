# WordPress Headless - Configuración del CMS

Este documento explica cómo instalar y configurar el CMS de WordPress para el proyecto de Villas, utilizando **WordPress Studio**, **Advanced Custom Fields (ACF)** y **Custom Post Type UI (CPT UI)**.

---

# Requisitos

- WordPress Studio
- Node.js (para el frontend)
- Git

---

# 1. Instalar WordPress Studio

Descargar desde:

https://developer.wordpress.com/studio/

Instalar normalmente.

---

# 2. Crear un sitio

Abrir WordPress Studio.

Seleccionar:

```
Add Site
```

Configurar:

```
Nombre del sitio:
Villa Coco CMS
```

Esperar a que WordPress termine la instalación.

---

# 3. Abrir el panel de administración

Dentro de WordPress Studio seleccionar:

```
WP Admin
```

o abrir

```
http://localhost:8881/wp-admin
```

(Ingresar la URL correspondiente que genere WordPress Studio.)

---

# 4. Instalar los plugins

Ir a

```
Plugins
→ Add Plugin
```

Instalar los siguientes plugins:

## Advanced Custom Fields

Buscar

```
Advanced Custom Fields
```

Instalar y activar.

---

## Custom Post Type UI

Buscar

```
Custom Post Type UI
```

Instalar y activar.

---

# 5. Crear el Custom Post Type

Ir a

```
CPT UI
→ Add/Edit Post Types
```

Crear un nuevo Post Type.

## Configuración

Post Type Slug

```
villa
```

Plural Label

```
Villas
```

Singular Label

```
Villa
```

---

Activar las siguientes opciones.

```
Show in REST API
YES
```

```
Public
YES
```

```
Has Archive
YES
```

Guardar.

---

# 6. Crear los campos personalizados

Ir a

```
ACF
→ Field Groups
→ Add New
```

Nombre del grupo

```
Información de la Villa
```

Agregar los siguientes campos.

---

## Descripción corta

Tipo

```
Text Area
```

Nombre

```
descripcion_corta
```

---

## Fecha inicio

Tipo

```
Date Picker
```

Nombre

```
fecha_inicio
```

---

## Fecha final

Tipo

```
Date Picker
```

Nombre

```
fecha_fin
```

---

## Habitaciones

Tipo

```
Number
```

Nombre

```
habitaciones
```

---

## Capacidad personas

Tipo

```
Number
```

Nombre

```
capacidad_personas
```

---

## Precio

Tipo

```
Number
```

Nombre

```
precio
```

---

## Ubicación

Tipo

```
Text
```

Nombre

```
ubicacion
```

---

## Amenidades

Tipo

```
Checkbox
```

Opciones

```
Wifi
Alberca
Aire acondicionado
Kayak
Paddle Board
Seguridad
Estacionamiento
```

---

## Retreat

Tipo

```
WYSIWYG Editor
```

Nombre

```
retreat
```

---

## Accommodations

Tipo

```
WYSIWYG Editor
```

Nombre

```
accommodations
```

---

## Sustenance

Tipo

```
WYSIWYG Editor
```

Nombre

```
sustenance
```

---

## Travel

Tipo

```
WYSIWYG Editor
```

Nombre

```
travel
```

---

## Activities

Tipo

```
WYSIWYG Editor
```

Nombre

```
activities
```

---

## Non Inclusives

Tipo

```
WYSIWYG Editor
```

Nombre

```
non_inclusives
```

---

# 7. Configurar las reglas del grupo

En la parte inferior del grupo configurar:

```
Show this field group if

Post Type

is equal to

Villa
```

Guardar.

---

# 8. Crear una Villa

Ir a

```
Villas
→ Add New
```

Completar:

Título

```
Casa Coco
```

Imagen destacada

Subir la fotografía principal.

Completar todos los campos ACF.

Finalmente publicar.

---

# 9. Consumir la API

## Todas las villas

```
http://localhost:8881/wp-json/wp/v2/villa
```

---

## Villa por ID

Ejemplo

```
http://localhost:8881/wp-json/wp/v2/villa/55
```

---

## Con imágenes embebidas

```
http://localhost:8881/wp-json/wp/v2/villa?_embed
```

---

# 10. Estructura de la respuesta

Ejemplo simplificado.

```json
{
  "id":55,
  "title":{
      "rendered":"Casa Coco"
  },
  "slug":"casa-coco",
  "acf":{
      "descripcion_corta":"...",
      "fecha_inicio":"2026-12-06",
      "fecha_fin":"2026-12-12",
      "habitaciones":10,
      "capacidad_personas":20,
      "precio":4500,
      "ubicacion":"Isla Mujeres",
      "retreat":"...",
      "accommodations":"...",
      "sustenance":"...",
      "travel":"...",
      "activities":"...",
      "non_inclusives":"..."
  }
}
```

---

# 11. Consumir desde Next.js

Ejemplo.

```ts
const API_URL = "http://localhost:8881/wp-json/wp/v2";

export async function getVillas() {
    const response = await fetch(
        `${API_URL}/villa?_embed`,
        {
            cache: "no-store"
        }
    );

    return response.json();
}
```

Uso.

```tsx
const villas = await getVillas();

return (
    <>
        {villas.map((villa) => (
            <div key={villa.id}>
                <h2>{villa.title.rendered}</h2>

                <p>{villa.acf.descripcion_corta}</p>
            </div>
        ))}
    </>
);
```

---

# Flujo de trabajo del equipo

1. Crear o editar una Villa desde WordPress.
2. Publicar los cambios.
3. Verificar la información en la API.
4. Consumir los datos desde Next.js.
5. Confirmar que los cambios se reflejan en el frontend.

---

# Notas

- No modificar directamente la base de datos.
- Todas las villas deben crearse desde el panel de WordPress.
- Mantener los nombres de los campos ACF sin cambios para evitar errores en el frontend.
- Si se agregan nuevos campos, documentarlos y actualizar el frontend según corresponda.
