import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
