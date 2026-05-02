import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify reset code | Illini2Illini",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordVerifyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
