import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600"],
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lidomare Health App",
  description: "Powered by Antifrágil® · Playamar, Torremolinos",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Lidomare",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "theme-color": "#000000",
    "msapplication-TileColor": "#000000",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${cormorant.variable}`}>
      <body style={{ background: "#000" }} className="min-h-screen">
        <div
          id="app"
          className="relative mx-auto min-h-screen overflow-x-hidden"
          style={{ maxWidth: 430, background: "#000" }}
        >
          {children}
        </div>
      </body>
    </html>
  );
}
