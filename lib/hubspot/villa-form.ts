export const HUBSPOT_REFERRAL_OPTIONS = [
  { value: "airbnb", label: "Airbnb" },
  { value: "vrbo", label: "VRBO" },
  { value: "web_search", label: "Web Search" },
  { value: "social_media", label: "Social Media" },
  { value: "referral", label: "Referral" },
  { value: "magazine", label: "Magazine" },
] as const;

export type HubSpotReferralSource =
  (typeof HUBSPOT_REFERRAL_OPTIONS)[number]["value"];

export type VillaFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  flexibleDates: boolean;
  villaName?: string;
  referralSource: HubSpotReferralSource;
  travelPlans: string;
};

export function isHubSpotReferralSource(
  value: unknown,
): value is HubSpotReferralSource {
  return HUBSPOT_REFERRAL_OPTIONS.some((option) => option.value === value);
}

function getVillaOfInterest(villaName?: string) {
  const normalizedName = villaName?.trim().toLocaleLowerCase("es-MX") ?? "";

  return normalizedName.includes("casa coco")
    ? "casa_coco"
    : "not_sure";
}

export function buildHubSpotVillaFields(data: VillaFormData) {
  const villaNote = data.villaName?.trim()
    ? `Villas solicitadas: ${data.villaName.trim()}\n\n`
    : "";

  return [
    { name: "firstname", value: data.firstName },
    { name: "lastname", value: data.lastName },
    { name: "email", value: data.email },
    { name: "phone", value: data.phone },
    { name: "check_in_date", value: data.checkIn },
    { name: "check_out_date", value: data.checkOut },
    { name: "number_of_guests", value: String(data.guests) },
    // Valores internos exactos según CONFIGURACION_HUBSPOT.md: "yes" / "no"
    // en minúsculas. HubSpot rechaza "Yes"/"No" por no coincidir con las
    // opciones permitidas de la propiedad `flexible_dates`.
    { name: "flexible_dates", value: data.flexibleDates ? "yes" : "no" },
    { name: "villa_of_interest", value: getVillaOfInterest(data.villaName) },
    { name: "how_you_heard_about_us", value: data.referralSource },
    { name: "message", value: `${villaNote}${data.travelPlans}` },
    { name: "request_type", value: "villa" },
    // La definición publicada de HubSpot lo exige aunque no aparezca en el editor visual.
    { name: "loyalty_tier", value: "villa" },
  ];
}
