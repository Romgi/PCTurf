import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PC Turf Board",
    template: "%s | PC Turf Board",
  },
  description: "Daily turf department job board for Port Carling Golf and Country Club.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  icons: {
    icon: [{ url: "/pc-icon.png", type: "image/png", sizes: "300x300" }],
    shortcut: "/pc-icon.png",
    apple: [{ url: "/pc-icon.png", type: "image/png", sizes: "300x300" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#333e3d]">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
