import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/i18n/provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// Get base path for GitHub Pages
const basePath = process.env.NODE_ENV === "production" ? "/carbon_hub" : "";

export const metadata: Metadata = {
  title: "Carbon Hub",
  description: "A platform for calculating and managing carbon emissions",
  manifest: `${basePath}/manifest.json`,
  icons: {
    icon: `${basePath}/carbon-hub-favicon.ico`,
    shortcut: `${basePath}/carbon-hub-favicon.ico`,
    apple: `${basePath}/carbon-hub-favicon.ico`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/x-icon" href={`${basePath}/carbon-hub-favicon.ico`} />
        <link rel="shortcut icon" type="image/x-icon" href={`${basePath}/carbon-hub-favicon.ico`} />
        <link rel="apple-touch-icon" type="image/x-icon" href={`${basePath}/carbon-hub-favicon.ico`} />
        <link rel="manifest" href={`${basePath}/manifest.json`} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
