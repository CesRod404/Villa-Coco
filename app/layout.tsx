import "./globals.css";
import Script from "next/script";
import ChatWidget from "@/components/chat/ChatWidget";

export const metadata = {
  title: "Villa Coco",
  description: "Reserva de villas de lujo",
};

// ID público del portal de HubSpot, solo para cargar el script de tracking
// (necesario para que el navegador genere el cookie `hubspotutk` y así los
// envíos de formularios puedan enlazarse al contacto correcto). No usar
// HUBSPOT_PORTAL_ID directamente aquí: esa variable es server-only.
const HUBSPOT_TRACKING_PORTAL_ID = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        {children}
        <ChatWidget />
        {HUBSPOT_TRACKING_PORTAL_ID && (
          <Script
            id="hs-script-loader"
            src={`https://js.hs-scripts.com/${HUBSPOT_TRACKING_PORTAL_ID}.js`}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
