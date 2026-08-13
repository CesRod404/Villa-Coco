import { Raleway } from "next/font/google";
import "./globals.css";
import ChatWidget from "@/components/chat/ChatWidget";

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-raleway",
});

export const metadata = {
  title: "Villa Coco",
  description: "Reserva de villas de lujo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={raleway.variable}>
      <body>
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}