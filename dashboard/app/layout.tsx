import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Score Energy — Dashboard Cencosud",
  description: "Dashboard de stock y ventas Score Energy en Cencosud",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
