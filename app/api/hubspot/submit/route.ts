import { NextRequest, NextResponse } from "next/server";

const PORTAL_ID = process.env.HUBSPOT_PORTAL_ID;
const FORM_ID = process.env.HUBSPOT_VILLA_FORM_ID;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // --- Anti-spam: honeypot (DISC-07) ---
    // Si el campo "website" viene lleno, es un bot.
    // Respondemos éxito para no delatar el honeypot, pero descartamos el envío.
    if (body.website) {
      return NextResponse.json({ ok: true });
    }

    // --- Validación básica del lado del servidor ---
    if (!body.email || !body.firstname) {
      return NextResponse.json(
        { ok: false, error: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    if (!PORTAL_ID || !FORM_ID) {
      console.error(
        "Faltan HUBSPOT_PORTAL_ID o HUBSPOT_VILLA_FORM_ID en las variables de entorno."
      );
      return NextResponse.json(
        { ok: false, error: "Configuración del servidor incompleta." },
        { status: 500 }
      );
    }

    // --- Construir el payload para HubSpot Forms API ---
    // Nombres de campo (internal names) confirmados directamente en HubSpot.
    const fields = [
      { name: "firstname", value: body.firstname },
      { name: "lastname", value: body.lastname ?? "" },
      { name: "email", value: body.email },
      { name: "phone", value: body.phone ?? "" },
      { name: "check_in_date", value: body.checkInDate ?? "" },
      { name: "check_out_date", value: body.checkOutDate ?? "" },
      { name: "number_of_guests", value: body.numberOfGuests ?? "" },
      // Dropdown de opciones fijas: "Yes" | "No"
      { name: "flexible_dates", value: body.flexibleDates ?? "" },
      // Dropdown de opciones fijas: "Casa Coco (10 Bedrooms)" | "Not Sure"
      { name: "villa_of_interest", value: body.villaOfInterest ?? "" },
      // Dropdown de opciones fijas: "Airbnb" | "VRBO" | "Web Search" | "Social Media" | "Referral" | "Magazine"
      { name: "how_you_heard_about_us", value: body.howYouHeardAboutUs ?? "" },
      { name: "message", value: body.message ?? "" },
      // Campo "Request Type" (visible en HubSpot como Request Type, internal name request_type).
      // Debe estar configurado como hidden con valor fijo por formulario en HubSpot.
      // Si HubSpot ya lo autocompleta por default value, esta línea es redundante pero inofensiva.
      { name: "request_type", value: "villa_wedding" },
    ];

    const hubspotRes = await fetch(
      `https://api.hsforms.com/submissions/v3/integration/submit/${PORTAL_ID}/${FORM_ID}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields,
          context: {
            pageUri: req.headers.get("referer") ?? "",
            pageName: "Solicitud de Villa",
          },
        }),
      }
    );

    if (!hubspotRes.ok) {
      const errorData = await hubspotRes.json().catch(() => null);
      console.error("Error de HubSpot:", errorData);
      return NextResponse.json(
        { ok: false, error: "No se pudo enviar la solicitud." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error en /api/hubspot/submit-villa:", err);
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}