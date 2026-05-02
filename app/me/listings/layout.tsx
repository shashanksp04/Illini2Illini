import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My listings | Illini2Illini",
  robots: { index: false, follow: false },
};

export default function MyListingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
