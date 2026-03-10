"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { PageContainer } from "@/components/layout/PageContainer";

type MeOk = {
  ok: true;
  data: {
    email: string;
    email_verified: boolean;
    is_profile_complete: boolean;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    profile_picture_url: string | null;
  };
};

type MeError = {
  ok: false;
  error?: { code: string; message: string };
};

type MeResponse = MeOk | MeError;

type GateState =
  | { kind: "loading" }
  | { kind: "unauthenticated" }
  | { kind: "needsVerification"; email: string }
  | { kind: "needsProfile"; me: MeOk["data"] }
  | { kind: "completeRedirect" };

export function ProfileSetupForm() {
  const router = useRouter();
  const [gate, setGate] = useState<GateState>({ kind: "loading" });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>("");

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/me", { method: "GET" });
        const status = res.status;
        const json = (await res.json()) as MeResponse;

        if (!res.ok) {
          if (status === 401 || (json as MeError).error?.code === "UNAUTHORIZED") {
            if (!cancelled) setGate({ kind: "unauthenticated" });
            return;
          }
          if (!cancelled) setGate({ kind: "unauthenticated" });
          return;
        }

        if (!json.ok) {
          if (!cancelled) setGate({ kind: "unauthenticated" });
          return;
        }

        const data = json.data;

        if (!data.email_verified) {
          if (!cancelled) setGate({ kind: "needsVerification", email: data.email });
          return;
        }

        if (data.is_profile_complete) {
          if (!cancelled) {
            setGate({ kind: "completeRedirect" });
            router.replace("/listings");
          }
          return;
        }

        if (!cancelled) {
          setGate({ kind: "needsProfile", me: data });
          setFirstName(data.first_name ?? "");
          setLastName(data.last_name ?? "");
          if (data.username) {
            setUsername(data.username);
          }
          if (data.profile_picture_url) {
            setProfilePictureUrl(data.profile_picture_url);
          }
        }
      } catch {
        if (!cancelled) setGate({ kind: "unauthenticated" });
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleUploadChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/me/profile-picture/upload", {
        method: "POST",
        body: formData,
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json.ok) {
        const message =
          json?.error?.message ?? "Failed to upload profile picture. Please try again.";
        setUploadError(message);
        return;
      }
      const url = json.data?.profile_picture_url as string | undefined;
      if (url) {
        setProfilePictureUrl(url);
      } else {
        setUploadError("Upload succeeded, but no image URL was returned.");
      }
    } catch {
      setUploadError("Failed to upload profile picture. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    if (!profilePictureUrl) {
      setFormError("Profile picture is required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/me/profile/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          username,
          profile_picture_url: profilePictureUrl,
        }),
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json.ok) {
        const code = json?.error?.code as string | undefined;
        const message = json?.error?.message as string | undefined;
        if (code === "USERNAME_TAKEN") {
          setFormError("That username is taken.");
        } else if (code === "PROFILE_ALREADY_COMPLETE") {
          setFormError("Profile already complete.");
          router.replace("/listings");
        } else if (code === "VALIDATION_ERROR") {
          setFormError(message ?? "Please check your inputs and try again.");
        } else if (code === "UNAUTHORIZED") {
          setFormError(message ?? "You need to log in to complete your profile.");
        } else if (code === "EMAIL_NOT_VERIFIED") {
          setFormError(message ?? "Please verify your email first.");
        } else {
          setFormError(message ?? "Unable to complete profile. Please try again.");
        }
        return;
      }
      router.push("/listings");
    } catch {
      setFormError("Unable to complete profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (gate.kind === "loading") {
    return (
      <PageContainer>
        <div className="flex justify-center py-12">
          <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white px-6 py-8 shadow-sm space-y-4">
            <div className="h-6 w-40 rounded-lg bg-gray-100" />
            <div className="h-4 w-full rounded-lg bg-gray-100" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (gate.kind === "unauthenticated") {
    return (
      <PageContainer>
        <div className="flex justify-center py-12">
          <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white px-6 py-8 text-center shadow-sm space-y-4">
            <h1 className="text-2xl font-semibold text-illini-blue">Log in to continue</h1>
            <p className="text-sm text-gray-500">
              You need to be logged in to complete your profile.
            </p>
            <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg bg-illini-orange px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-illini-orange focus:ring-offset-2"
              >
                Log in
              </Link>
              <Link
                href="/listings"
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300"
              >
                Browse listings
              </Link>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (gate.kind === "needsVerification") {
    const email = gate.email;
    return (
      <PageContainer>
        <div className="flex justify-center py-12">
          <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white px-6 py-8 text-center shadow-sm space-y-4">
            <h1 className="text-2xl font-semibold text-illini-blue">Verify your email</h1>
            <p className="text-sm text-gray-500">
              Before setting up your profile, verify{" "}
              <span className="font-medium">{email || "your email address"}</span>.
            </p>
            <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href={email ? `/verify-email?email=${encodeURIComponent(email)}` : "/verify-email"}
                className="inline-flex items-center justify-center rounded-lg bg-illini-orange px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-illini-orange focus:ring-offset-2"
              >
                Verify email
              </Link>
              <Link
                href="/listings"
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300"
              >
                Browse listings
              </Link>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (gate.kind === "completeRedirect") {
    return (
      <PageContainer>
        <div className="flex justify-center py-12">
          <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white px-6 py-8 text-center shadow-sm space-y-2">
            <h1 className="text-2xl font-semibold text-illini-blue">Profile already complete</h1>
            <p className="text-sm text-gray-500">
              Redirecting you to listings…
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  // needsProfile
  return (
    <PageContainer>
      <div className="flex justify-center py-8 md:py-12">
        <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white px-6 py-8 shadow-sm space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold text-illini-blue md:text-3xl">
              Complete your profile
            </h1>
            <p className="text-sm text-gray-500">
              Add your name, username, and a profile picture. Usernames are permanent.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label
                htmlFor="first_name"
                className="block text-sm font-medium text-gray-700"
              >
                First name
              </label>
              <input
                id="first_name"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:border-illini-orange"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="last_name"
                className="block text-sm font-medium text-gray-700"
              >
                Last name
              </label>
              <input
                id="last_name"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:border-illini-orange"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:border-illini-orange"
              />
              <p className="text-xs text-gray-500">
                Usernames are permanent. Use letters, numbers, and underscores only.
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="profile_picture"
                className="block text-sm font-medium text-gray-700"
              >
                Profile picture
              </label>
              <input
                id="profile_picture"
                type="file"
                accept="image/*"
                onChange={handleUploadChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
              />
              {uploadError && (
                <p className="text-xs text-red-600">
                  {uploadError}
                </p>
              )}
              {profilePictureUrl && (
                <div className="flex items-center gap-3 mt-2">
                  <img
                    src={profilePictureUrl}
                    alt="Profile preview"
                    className="h-12 w-12 rounded-full object-cover border border-gray-200"
                  />
                  <span className="text-xs text-gray-500">
                    This photo will be shown on your listings.
                  </span>
                </div>
              )}
            </div>

            {formError && (
              <p className="text-sm text-red-600">
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || uploading || !profilePictureUrl}
              className="w-full inline-flex items-center justify-center rounded-lg bg-illini-orange px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-shadow hover:shadow-md disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:ring-offset-2"
            >
              {submitting ? "Saving..." : "Save profile"}
            </button>
          </form>
        </div>
      </div>
    </PageContainer>
  );
}
