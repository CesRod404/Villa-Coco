# Configuración de HubSpot para el formulario de Villa Coco

Esta guía deja alineados tres elementos que deben coincidir exactamente:

1. Las propiedades del contacto en HubSpot.
2. Los campos incluidos en el formulario de HubSpot.
3. Los nombres y valores internos enviados por el sitio.

> Importante: HubSpot permite cambiar una etiqueta visible, pero no el nombre interno de una propiedad después de crearla. Si una propiedad existente tiene otro nombre interno, crea una nueva con el nombre indicado o coordina el cambio correspondiente en el código.

## 1. Revisar o crear las propiedades de contacto

En HubSpot, abre **Configuración → Propiedades** y selecciona **Propiedades de contacto**. Busca cada propiedad por nombre y confirma esta tabla:

| Etiqueta sugerida | Nombre interno exacto | Tipo | Valores internos exactos |
| --- | --- | --- | --- |
| Nombre | `firstname` | Texto de una línea | — |
| Apellidos | `lastname` | Texto de una línea | — |
| Correo electrónico | `email` | Correo | — |
| Teléfono | `phone` | Teléfono | — |
| Fecha de llegada | `check_in_date` | Selector de fecha | — |
| Fecha de salida | `check_out_date` | Selector de fecha | — |
| Número de huéspedes | `number_of_guests` | Número | — |
| Fechas flexibles | `flexible_dates` | Selección desplegable | `yes`, `no` |
| Villa de interés | `villa_of_interest` | Selección desplegable | `casa_coco`, `not_sure` |
| Cómo nos conociste | `how_you_heard_about_us` | Selección desplegable | ver tabla siguiente |
| Mensaje | `message` | Texto de varias líneas | — |
| Tipo de solicitud | `request_type` | Selección desplegable | `villa` |
| Clasificación heredada | `loyalty_tier` | Campo de compatibilidad de la API | `villa` |

Para **Cómo nos conociste**, configura las opciones exactamente como aparecen en el formulario de HubSpot:

| Etiqueta visible | Valor interno exacto |
| --- | --- |
| Airbnb | `airbnb` |
| VRBO | `vrbo` |
| Web Search | `web_search` |
| Social Media | `social_media` |
| Referral | `referral` |
| Magazine | `magazine` |

No agregues `Instagram`, `Google`, `Recomendación`, `Agencia de viajes`, `Ya nos conocía` u `Otro` como valores enviados desde el sitio mientras esas opciones no existan también en la propiedad de HubSpot.

> Nota de compatibilidad: la definición publicada del formulario exige `loyalty_tier` aunque el campo no aparezca en **Form contents**. El sitio lo envía automáticamente con el valor heredado `villa`; no es necesario agregarlo al formulario visible.

Documentación oficial: [crear y editar propiedades](https://knowledge.hubspot.com/properties/create-and-edit-properties) y [administrar opciones de propiedades desplegables](https://knowledge.hubspot.com/properties/manage-enumeration-property-options).

## 2. Configurar el formulario en HubSpot

1. Abre **Marketing → Formularios**. Si Marketing no aparece directamente, entra desde **Más**.
2. Abre el formulario de solicitud de villa y selecciona **Editar**.
3. Agrega al formulario todas las propiedades de la tabla anterior. La API puede rechazar campos que no pertenezcan al formulario.
4. Marca como obligatorios: nombre, apellidos, correo, teléfono, llegada, salida, número de huéspedes y cómo nos conociste.
5. Configura `request_type` como campo oculto con el valor `villa`.
6. En `how_you_heard_about_us`, abre las opciones del campo y confirma que estén disponibles las seis opciones internas indicadas.
7. Selecciona **Revisar y actualizar** para publicar los cambios.

HubSpot indica que primero se actualizan las opciones en la propiedad y después se agregan o ajustan dentro del editor del formulario: [editar campos del formulario](https://knowledge.hubspot.com/forms/edit-form-fields).

## 3. Conectar el proyecto con ese formulario

1. Obtén el **ID de la cuenta** de HubSpot y el **ID único del formulario** que acabas de editar.
2. Crea o actualiza `.env.local` en la raíz del proyecto:

   ```env
   HUBSPOT_PORTAL_ID=12345678
   HUBSPOT_FORM_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```

3. No compartas `.env.local` ni subas esos valores al repositorio.
4. Reinicia el servidor de Next.js después de cambiar las variables.

El sitio usa el endpoint oficial de envío de formularios con el ID de cuenta y el ID del formulario: [Submit data to a form](https://developers.hubspot.com/docs/api-reference/legacy/marketing/forms/v3-legacy/submit-data-unauthenticated).

## 4. Prueba de extremo a extremo

1. Abre una villa en el sitio.
2. Selecciona fechas disponibles y una cantidad de huéspedes.
3. Completa el formulario con un correo de prueba identificable.
4. En **¿Cómo nos conociste?**, selecciona una opción, por ejemplo **Social Media**. El sitio mostrará esa etiqueta y enviará `social_media`.
5. Envía la solicitud.
6. Comprueba que aparezca en WordPress y que la respuesta del sitio no muestre una advertencia de sincronización.
7. En HubSpot, revisa las entregas del formulario y después abre el contacto por correo.
8. Confirma especialmente estos valores: fechas, huéspedes, fechas flexibles, villa, origen, mensaje y tipo de solicitud.

## 5. Diagnóstico rápido si HubSpot no recibe datos

- **No aparece ninguna entrega:** verifica `HUBSPOT_PORTAL_ID`, `HUBSPOT_FORM_ID` y reinicia el servidor.
- **HubSpot responde que un campo no existe:** compara el nombre interno, no solo la etiqueta visible.
- **Falla únicamente “Cómo nos conociste”:** compara los valores internos; por ejemplo, las etiquetas `VRBO` y `Social Media` deben enviarse como `vrbo` y `social_media`.
- **Falta un campo en el contacto:** confirma que la propiedad también esté agregada al formulario publicado.
- **La web confirma el guardado pero muestra advertencia:** la solicitud sí quedó en WordPress, pero HubSpot rechazó o no pudo confirmar la sincronización. Revisa el log del servidor para ver la respuesta de HubSpot y no dupliques el envío del usuario.
- **HubSpot avisa "The cookie needed to link form submissions to existing contacts isn't being sent":** el sitio carga el script de tracking de HubSpot (`app/layout.tsx`, usando `NEXT_PUBLIC_HUBSPOT_PORTAL_ID`) para que el navegador genere el cookie `hubspotutk`, y ambas rutas de envío (`/api/hubspot/submit` y `/api/reservations/request`) lo reenvían como `context.hutk`. Si el aviso persiste, confirma que `NEXT_PUBLIC_HUBSPOT_PORTAL_ID` esté definido en `.env.local` y que el navegador no esté bloqueando el script (bloqueadores de cookies/anuncios). La primera visita de cada usuario puede no tener el cookie todavía si el envío ocurre antes de que el script termine de cargar.
