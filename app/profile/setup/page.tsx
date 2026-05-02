import type { Metadata } from "next";

import { ProfileSetupForm } from "@/components/profile/ProfileSetupForm";

export const metadata: Metadata = {
  title: "Set up your profile | Illini2Illini",
  robots: { index: false, follow: false },
};

export default function ProfileSetupPage() {
  return <ProfileSetupForm />;
}
