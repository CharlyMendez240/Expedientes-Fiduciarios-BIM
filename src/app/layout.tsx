import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Tipografía geométrica cercana a la identidad BIM (sans institucional). */
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-bim",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Expedientes Digitales BIM",
  description:
    "Portal demo de originación e integración del expediente digital fiduciario — Banco Inmobiliario Mexicano",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${montserrat.variable} antialiased`}>{children}</body>
    </html>
  );
}
