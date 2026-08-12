# Reservas Villa Coco

1. En WordPress, entra a **Plugins** y activa **Villa Coco Reservations**.
2. Crea una reserva en **Reservas → Agregar reserva**.
3. Selecciona la villa, entrada, salida, invitados y nombre de la persona que reserva.
4. Publica únicamente reservas confirmadas: son las únicas que bloquean el calendario público.

El plugin expone `GET /wp-json/villa-coco/v1/villas/{id}/reservations` para el frontend.

Las solicitudes públicas se guardan como **pendientes**. Revisa sus datos, confirma que la villa y el rango sean correctos y cámbialas a **Publicada** para bloquear fechas en el calendario.
