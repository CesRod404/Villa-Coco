import { NextResponse } from "next/server";
import { WORDPRESS_BASE_URL } from "@/lib/wp";

type ReservationRequest = { villaId?: number; checkIn?: string; checkOut?: string; guests?: number; flexibleDates?: boolean; firstName?: string; lastName?: string; email?: string; phone?: string; referralSource?: string; travelPlans?: string };

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ReservationRequest | null;
  if (!body || !Number.isInteger(body.villaId) || !body.checkIn || !body.checkOut || !Number.isInteger(body.guests) || !body.firstName || !body.lastName || !body.email || !body.phone || !body.referralSource) {
    return NextResponse.json({ error: "Completa todos los datos de la solicitud." }, { status: 400 });
  }
  try {
    const response = await fetch(`${WORDPRESS_BASE_URL}/wp-json/villa-coco/v1/reservation-requests`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
    const result = await response.json().catch(() => null);
    if (!response.ok) return NextResponse.json({ error: result?.message || "No fue posible registrar la solicitud." }, { status: response.status });
    const hubspotSynced = await submitToHubSpot(body).catch(() => false);
    return NextResponse.json({ id: result.id, hubspotSynced }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "El servicio de reservas no está disponible en este momento." }, { status: 503 });
  }
}

async function submitToHubSpot(body: ReservationRequest) {
  const portalId = process.env.HUBSPOT_PORTAL_ID;
  const formId = process.env.HUBSPOT_FORM_ID;
  if (!portalId || !formId || portalId.startsWith("your_") || formId.startsWith("your_")) return false;
  const fields = [
    ["firstname", body.firstName], ["lastname", body.lastName], ["email", body.email], ["phone", body.phone],
    ["how_did_you_hear_about_us", body.referralSource], ["travel_plans", body.travelPlans || ""],
    ["villa_id", String(body.villaId)], ["check_in", body.checkIn], ["check_out", body.checkOut],
    ["guest_count", String(body.guests)], ["flexible_dates", body.flexibleDates ? "true" : "false"],
  ].map(([name, value]) => ({ name, value }));
  const response = await fetch(`https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formId}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields, submittedAt: String(Date.now()), context: { pageName: "Solicitud de reserva Villa Coco", pageUri: process.env.NEXT_PUBLIC_SITE_URL || "" } }),
  });
  return response.ok;
}
