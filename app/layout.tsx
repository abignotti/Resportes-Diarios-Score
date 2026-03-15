import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Score Energy — Dashboard",
  description: "Dashboard de stock y ventas Score Energy",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
