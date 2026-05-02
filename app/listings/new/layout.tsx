import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create a listing | Illini2Illini",
  robots: { index: false, follow: false },
};

export default function NewListingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
