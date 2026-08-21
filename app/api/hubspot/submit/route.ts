import { NextRequest, NextResponse } from "next/server";
import {
  buildHubSpotVillaFields,
  isHubSpotReferralSource,
} from "@/lib/hubspot/villa-form";

const PORTAL_ID = process.env.HUBSPOT_PORTAL_ID;
const FORM_ID = process.env.HUBSPOT_FORM_ID;

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
    if (
      !body.email ||
      !body.firstname ||
      !body.checkInDate ||
      !body.checkOutDate ||
      !Number.isFinite(Number(body.numberOfGuests)) ||
      !body.message?.trim() ||
      !isHubSpotReferralSource(body.howYouHeardAboutUs)
    ) {
      return NextResponse.json(
        { ok: false, error: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    if (!PORTAL_ID || !FORM_ID) {
      console.error(
        "Faltan HUBSPOT_PORTAL_ID o HUBSPOT_FORM_ID en las variables de entorno."
      );
      return NextResponse.json(
        { ok: false, error: "Configuración del servidor incompleta." },
        { status: 500 }
      );
    }

    const fields = buildHubSpotVillaFields({
      firstName: body.firstname,
      lastName: body.lastname ?? "",
      email: body.email,
      phone: body.phone ?? "",
      checkIn: body.checkInDate,
      checkOut: body.checkOutDate,
      guests: Number(body.numberOfGuests),
      flexibleDates:
        body.flexibleDates === true ||
        body.flexibleDates === "Yes" ||
        body.flexibleDates === "Yes",
      villaName:
        body.villaOfInterest === "Casa Coco (10 Bedrooms)" ||
        body.villaOfInterest === "casa_coco"
          ? "Casa Coco"
          : undefined,
      referralSource: body.howYouHeardAboutUs,
      travelPlans: body.message.trim(),
    });

    // Cookie que HubSpot usa para enlazar el envío con el contacto/visitante
    // correcto. Sin esto, HubSpot avisa que no puede vincular la
    // presentación a un contacto existente. Solo existe si el sitio cargó
    // el script de tracking de HubSpot (ver app/layout.tsx).
    const hutk = req.cookies.get("hubspotutk")?.value;

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
            ...(hutk ? { hutk } : {}),
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