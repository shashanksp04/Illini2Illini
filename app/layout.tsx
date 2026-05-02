import { Inter } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "@/lib/env";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") || "https://illini2illini.com";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Illini2Illini — UIUC Subleases & Student Housing",
    template: "%s",
  },
  description:
    "Find Student Housing at UIUC — subleases, lease takeovers, and full-year housing from verified @illinois.edu students.",
  applicationName: "Illini2Illini",
  keywords: [
    "UIUC sublease",
    "UIUC housing",
    "Champaign sublease",
    "Urbana sublease",
    "lease takeover",
    "Illinois student housing",
    "Illini housing",
  ],
  openGraph: {
    type: "website",
    siteName: "Illini2Illini",
    title: "Illini2Illini — UIUC Subleases & Student Housing",
    description:
      "Find Student Housing at UIUC — subleases, lease takeovers, and full-year housing from verified @illinois.edu students.",
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Illini2Illini — UIUC Subleases & Student Housing",
    description:
      "Find Student Housing at UIUC — subleases, lease takeovers, and full-year housing from verified @illinois.edu students.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ff5f05" },
    { media: "(prefers-color-scheme: dark)", color: "#13294b" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let navUser: { username: string; profile_picture_url: string | null; role: string } | null = null;
  let needsProfile = false;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { auth_user_id: data.user.id },
        select: { username: true, profile_picture_url: true, role: true, first_name: true, last_name: true },
      });
      if (user && user.first_name && user.last_name && user.username && user.profile_picture_url) {
        navUser = { username: user.username, profile_picture_url: user.profile_picture_url, role: user.role };
      } else {
        needsProfile = true;
      }
    }
  } catch {
    // Fall back to logged-out state if auth/DB fails (e.g. during build)
  }

  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased min-h-screen flex flex-col bg-gray-50">
        <Navbar user={navUser} needsProfile={needsProfile} />
        <main className="flex-1 flex flex-col">{children}</main>
        <Analytics />
      </body>
    </html>
  );
}
