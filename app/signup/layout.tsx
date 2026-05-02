import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create your account | Illini2Illini",
  description: "Sign up for Illini2Illini with your @illinois.edu email.",
  robots: { index: false, follow: false },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
