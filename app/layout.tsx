import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
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

export const metadata: Metadata = {
  title: "Illini2Illini",
  description: "UIUC short-term housing marketplace",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let navUser: { username: string; profile_picture_url: string | null; role: string } | null = null;
  let needsProfile = false;

  if (process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD) {
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
