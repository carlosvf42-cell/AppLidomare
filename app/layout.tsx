import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Lidomare Health App",
  description: "Powered by Antifrágil® · Playamar, Torremolinos",
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
    <html lang="es" className={inter.variable}>
      {/*
        body = outer shell (#050505) filling the whole viewport
        #app  = centered column, max 430px, with the real app background
      */}
      <body className="bg-[#050505] min-h-screen">
        <div
          id="app"
          className="relative mx-auto min-h-screen bg-[#080808] text-[#f0f0f0] overflow-x-hidden"
          style={{ maxWidth: 430 }}
        >
          {children}
        </div>
      </body>
    </html>
  );
}
