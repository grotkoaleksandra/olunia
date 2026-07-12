import type { Metadata, Viewport } from "next";
import { Geist, Fraunces } from "next/font/google";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import "./globals.css";

const BP = process.env.NEXT_PUBLIC_BASE_PATH || "";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "Olunia",
  description: "Portfolio and studio of Ola — with a social media harmonogram.",
  appleWebApp: {
    capable: true,
    title: "Olunia",
    statusBarStyle: "default",
  },
  icons: {
    apple: `${BP}/icons/apple-touch-icon.png`,
  },
};

export const viewport: Viewport = {
  themeColor: "#faf9f6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable} ${fraunces.variable}`}>
      <head>
        {/* Add Google Fonts here if your locales need non-Latin scripts */}
      </head>
      <body className="min-h-screen flex flex-col antialiased bg-background text-foreground">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
