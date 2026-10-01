import type { Metadata } from "next";
import { Geist, Geist_Mono, Archivo_Black, Caveat } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

const archivoBlack = Archivo_Black({
  weight: "400",
  variable: "--font-archivo-black",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Minion | Architecture, Interiors, Construction & Smart Home Solutions",
  description: "Minion provides architecture, construction, interior design, smart home automation, landscaping and building product solutions.",
};

import GlobalNavbar from "@/components/GlobalNavbar";
import { Providers } from "@/components/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${archivoBlack.variable} ${caveat.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <GlobalNavbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
