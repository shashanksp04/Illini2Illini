import type { Metadata } from "next";

import { ProfileEditForm } from "@/components/profile/ProfileEditForm";

export const metadata: Metadata = {
  title: "Profile | Illini2Illini",
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return <ProfileEditForm />;
}
