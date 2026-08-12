import "./globals.css";
import ChatWidget from '@/components/chat/ChatWidget';

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
    <html lang="es">
      <body>
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
