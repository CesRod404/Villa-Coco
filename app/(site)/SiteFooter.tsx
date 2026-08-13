// app/api/reservations/request/route.ts

import { NextResponse } from "next/server";
import { WORDPRESS_BASE_URL } from "@/lib/wp";

type ReservationRequest = {
  villaId?: number;
  villaName?: string; // ⚠️ agregar este campo en el fetch de ReservationPlanner.tsx (ver nota abajo)
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  flexibleDates?: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  referralSource?: string;
  travelPlans?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ReservationRequest | null;

  if (
    !body ||
    !Number.isInteger(body.villaId) ||
    !body.checkIn ||
    !body.checkOut ||
    !Number.isInteger(body.guests) ||
    !body.firstName ||
    !body.lastName ||
    !body.email ||
    !body.phone ||
    !body.referralSource
  ) {
    return NextResponse.json(
      { error: "Completa todos los datos de la solicitud." },
      { status: 400 }
    );
  }

  try {
    // 1. Crear la reserva pendiente en WordPress
    const response = await fetch(
      `${WORDPRESS_BASE_URL}/wp-json/villa-coco/v1/reservation-requests`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        { error: result?.message || "No fue posible registrar la solicitud." },
        { status: response.status }
      );
    }

    // 2. Enviar a HubSpot (independiente; si falla, no bloquea la reserva ya creada)
    const hubspotSynced = await submitToHubSpot(body).catch(() => false);

    return NextResponse.json({ id: result.id, hubspotSynced }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "El servicio de reservas no está disponible en este momento." },
      { status: 503 }
    );
  }
}

async function submitToHubSpot(body: ReservationRequest) {
  const portalId = process.env.HUBSPOT_PORTAL_ID;
  const formId = process.env.HUBSPOT_FORM_ID;

  if (!portalId || !formId || portalId.startsWith("your_") || formId.startsWith("your_")) {
    return false;
  }

  // Internal names confirmados directamente en HubSpot (no son los mismos
  // nombres que usa el estado interno de React/WordPress).
  const fields = [
    ["firstname", body.firstName],
    ["lastname", body.lastName],
    ["email", body.email],
    ["phone", body.phone],
    ["check_in_date", body.checkIn],
    ["check_out_date", body.checkOut],
    ["number_of_guests", String(body.guests)],
    ["flexible_dates", body.flexibleDates ? "Yes" : "No"],
    // ⚠️ "villa_of_interest" es un dropdown con opciones de TEXTO fijas en HubSpot
    // (ej. "Casa Coco (10 Bedrooms)"), no acepta un ID numérico.
    // Por eso se necesita villaName, no villaId, aquí.
    ["villa_of_interest", body.villaName || ""],
    // ⚠️ "how_you_heard_about_us" también es dropdown con opciones fijas en HubSpot:
    // Airbnb | VRBO | Web Search | Social Media | Referral | Magazine.
    // El <select> de ReservationPlanner.tsx actualmente tiene opciones distintas
    // (Instagram, Google, Recomendación, etc.) — hay que alinearlas antes de producción.
    ["how_you_heard_about_us", body.referralSource],
    ["message", body.travelPlans || ""],
    // Campo oculto con valor fijo por formulario
    ["request_type", "villa_wedding"],
  ].map(([name, value]) => ({ name, value }));

  const response = await fetch(
    `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields,
        submittedAt: String(Date.now()),
        context: {
          pageName: "Solicitud de reserva Villa Coco",
          pageUri: process.env.NEXT_PUBLIC_SITE_URL || "",
        },
      }),
    }
  );

  return response.ok;
}