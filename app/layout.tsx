import type { Metadata } from "next";
import "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  title: "Illini2Illini",
  description: "UIUC short-term housing marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
