import { NextResponse } from "next/server";
import { WORDPRESS_BASE_URL } from "@/lib/wp";
import {
  buildHubSpotVillaFields,
  isHubSpotReferralSource,
  type HubSpotReferralSource,
} from "@/lib/hubspot/villa-form";
import { normalizeRequestedVillaIds } from "@/lib/reservations/request";

type ReservationRequest = {
  villaId?: number;
  villaIds?: number[];
  villaName?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  flexibleDates?: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  referralSource?: HubSpotReferralSource;
  travelPlans?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ReservationRequest | null;
  const villaIds = body ? normalizeRequestedVillaIds(body) : [];
  if (!body || !villaIds.length || !body.checkIn || !body.checkOut || !Number.isInteger(body.guests) || !body.firstName || !body.lastName || !body.email || !body.phone || !isHubSpotReferralSource(body.referralSource) || !body.travelPlans?.trim()) {
    return NextResponse.json({ error: "Completa todos los datos de la solicitud." }, { status: 400 });
  }

  const normalizedBody = { ...body, villaId: villaIds[0], villaIds };
  try {
    const response = await fetch(`${WORDPRESS_BASE_URL}/wp-json/villa-coco/v1/reservation-requests`, { method: "POST", headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "1" }, body: JSON.stringify(normalizedBody), cache: "no-store" });
    const result = await response.json().catch(() => null);
    if (!response.ok) return NextResponse.json({ error: result?.message || "No fue posible registrar la solicitud." }, { status: response.status });
    const hubspotSynced = await submitToHubSpot(normalizedBody).catch(() => false);
    return NextResponse.json({ id: result.id, ids: result.ids || [result.id], hubspotSynced }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "El servicio de reservas no está disponible en este momento." }, { status: 503 });
  }
}

async function submitToHubSpot(body: ReservationRequest) {
  const portalId = process.env.HUBSPOT_PORTAL_ID;
  const formId = process.env.HUBSPOT_FORM_ID;
  if (!portalId || !formId || portalId.startsWith("your_") || formId.startsWith("your_")) return false;
  if (!body.firstName || !body.lastName || !body.email || !body.phone || !body.checkIn || !body.checkOut || !body.guests || !isHubSpotReferralSource(body.referralSource) || !body.travelPlans?.trim()) return false;

  const fields = buildHubSpotVillaFields({
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    phone: body.phone,
    checkIn: body.checkIn,
    checkOut: body.checkOut,
    guests: body.guests,
    flexibleDates: Boolean(body.flexibleDates),
    villaName: body.villaName,
    referralSource: body.referralSource,
    travelPlans: body.travelPlans.trim(),
  });
  const response = await fetch(`https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formId}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields, submittedAt: String(Date.now()), context: { pageName: "Solicitud de reserva Villa Coco", pageUri: process.env.NEXT_PUBLIC_SITE_URL || "" } }),
  });
  if (!response.ok) {
    console.error("HubSpot rechazó la solicitud de reserva:", await response.text());
  }
  return response.ok;
}
