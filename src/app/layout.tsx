import type { Metadata, Viewport } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Pathfinder Outdoor Education Center",
    template: "%s | Pathfinder",
  },
  description:
    "Five programs. One family portal. Cub Scouts, Boy Scouts, Rangers, Squadron, and Cedar Sports Shooting Club.",
  keywords: ["scouts", "youth programs", "outdoor education", "pathfinder"],
  openGraph: {
    type: "website",
    siteName: "Pathfinder Outdoor Education Center",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-slate-900 text-slate-100 antialiased min-h-dvh">
        {children}
      </body>
    </html>
  );
}
