import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";

const pressStart = Press_Start_2P({
  subsets: ["latin"],
  weight: "400"
});

export const metadata: Metadata = {
  title: "Oráculo Gemini",
  description: "Consulta a un NPC impulsado por Gemini para evaluar ideas y métricas."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={pressStart.className}>{children}</body>
    </html>
  );
}
