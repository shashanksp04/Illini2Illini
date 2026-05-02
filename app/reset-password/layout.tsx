import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset password | Illini2Illini",
  robots: { index: false, follow: false },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
