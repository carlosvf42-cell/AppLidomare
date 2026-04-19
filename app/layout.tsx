import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond, Barlow_Condensed } from "next/font/google";
import SplashScreen from "@/components/SplashScreen";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500"],
});

const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  display: "swap",
  weight: ["700", "800", "900"],
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
    <html lang="es" className={`${inter.variable} ${cormorant.variable} ${barlow.variable}`}>
      <body style={{ background: "#000" }} className="min-h-screen">
        <div
          id="app"
          className="relative mx-auto min-h-screen overflow-x-hidden"
          style={{ maxWidth: 430, background: "#000" }}
        >
          <SplashScreen />
          {children}
        </div>
      </body>
    </html>
  );
}
