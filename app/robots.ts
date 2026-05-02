import type { MetadataRoute } from "next";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") || "https://illini2illini.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/listings", "/v/", "/community/"],
        disallow: [
          "/api/",
          "/admin",
          "/me",
          "/auth/",
          "/profile",
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
          "/listings/new",
          "/listings/*/edit",
          "/listings/*/contact",
          "/listings/*/report",
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
