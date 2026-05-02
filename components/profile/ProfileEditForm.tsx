"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { AuthCard } from "@/components/auth/AuthCard";
import { PageContainer } from "@/components/layout/PageContainer";
import { cropProfileImage } from "@/lib/images/cropProfileImage";

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
  | { kind: "needsProfileSetup" }
  | { kind: "ready"; me: MeOk["data"] };

type EditableProfileValues = {
  firstName: string;
  lastName: string;
  username: string;
  profilePictureUrl: string;
};

function formatDateForUser(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "later";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ProfileEditForm() {
  const router = useRouter();
  const [gate, setGate] = useState<GateState>({ kind: "loading" });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [initialProfileValues, setInitialProfileValues] = useState<EditableProfileValues | null>(
    null
  );

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [draftImageFile, setDraftImageFile] = useState<File | null>(null);
  const [draftImageUrl, setDraftImageUrl] = useState<string | null>(null);
  const [photoOffsetX, setPhotoOffsetX] = useState(0);
  const [photoOffsetY, setPhotoOffsetY] = useState(0);
  const [photoZoom, setPhotoZoom] = useState(1);

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

        if (!data.is_profile_complete) {
          if (!cancelled) {
            setGate({ kind: "needsProfileSetup" });
          }
          return;
        }

        if (!cancelled) {
          setGate({ kind: "ready", me: data });
          const initialValues: EditableProfileValues = {
            firstName: data.first_name ?? "",
            lastName: data.last_name ?? "",
            username: data.username ?? "",
            profilePictureUrl: data.profile_picture_url ?? "",
          };
          setInitialProfileValues(initialValues);
          setFirstName(initialValues.firstName);
          setLastName(initialValues.lastName);
          setUsername(initialValues.username);
          setProfilePictureUrl(initialValues.profilePictureUrl);
        }
      } catch {
        if (!cancelled) setGate({ kind: "unauthenticated" });
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (draftImageUrl) {
        URL.revokeObjectURL(draftImageUrl);
      }
    };
  }, [draftImageUrl]);

  async function handleUploadChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setSuccessMessage(null);
    setFormError(null);
    if (draftImageUrl) {
      URL.revokeObjectURL(draftImageUrl);
    }
    setDraftImageFile(file);
    setDraftImageUrl(URL.createObjectURL(file));
    setPhotoOffsetX(0);
    setPhotoOffsetY(0);
    setPhotoZoom(1);
    e.currentTarget.value = "";
  }

  function clearDraftImage() {
    if (draftImageUrl) {
      URL.revokeObjectURL(draftImageUrl);
    }
    setDraftImageFile(null);
    setDraftImageUrl(null);
    setPhotoOffsetX(0);
    setPhotoOffsetY(0);
    setPhotoZoom(1);
  }

  function resetToInitialValues() {
    if (!initialProfileValues) return;
    setFormError(null);
    setUploadError(null);
    setSuccessMessage(null);
    clearDraftImage();
    setFirstName(initialProfileValues.firstName);
    setLastName(initialProfileValues.lastName);
    setUsername(initialProfileValues.username);
    setProfilePictureUrl(initialProfileValues.profilePictureUrl);
  }

  async function applyPhotoAdjustments() {
    if (!draftImageFile) return;
    setUploadError(null);
    setSuccessMessage(null);
    setUploading(true);
    try {
      const croppedFile = await cropProfileImage({
        file: draftImageFile,
        zoom: photoZoom,
        offsetX: photoOffsetX,
        offsetY: photoOffsetY,
      });

      const formData = new FormData();
      formData.append("file", croppedFile);
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
        clearDraftImage();
      } else {
        setUploadError("Upload succeeded, but no image URL was returned.");
      }
    } catch {
      setUploadError("Failed to process and upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!profilePictureUrl) {
      setFormError("Profile picture is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
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
        } else if (code === "USERNAME_COOLDOWN_ACTIVE") {
          const nextChangeAt = json?.data?.username_next_change_at as string | undefined;
          setFormError(
            nextChangeAt
              ? `You can change your username again on ${formatDateForUser(nextChangeAt)}.`
              : "You can’t change your username yet due to the cooldown."
          );
        } else if (code === "PROFILE_INCOMPLETE") {
          router.replace("/profile/setup");
          return;
        } else if (code === "VALIDATION_ERROR") {
          setFormError(message ?? "Please check your inputs and try again.");
        } else if (code === "UNAUTHORIZED") {
          setFormError(message ?? "You need to log in to edit your profile.");
        } else if (code === "EMAIL_NOT_VERIFIED") {
          setFormError(message ?? "Please verify your email first.");
        } else {
          setFormError(message ?? "Unable to save profile. Please try again.");
        }
        return;
      }

      setInitialProfileValues({
        firstName,
        lastName,
        username,
        profilePictureUrl,
      });
      setSuccessMessage("Profile updated.");
      router.refresh();
    } catch {
      setFormError("Unable to save profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (gate.kind === "loading") {
    return (
      <PageContainer>
        <div className="flex justify-center py-8 md:py-12">
          <AuthCard>
            <div className="space-y-4 animate-pulse">
              <div className="mx-auto h-6 w-40 rounded-lg bg-gray-100" />
              <div className="h-4 w-full rounded-lg bg-gray-100" />
              <div className="h-10 w-full rounded-lg bg-gray-100" />
            </div>
          </AuthCard>
        </div>
      </PageContainer>
    );
  }

  if (gate.kind === "unauthenticated") {
    return (
      <PageContainer>
        <div className="flex justify-center py-8 md:py-12">
          <AuthCard>
            <div className="space-y-4 text-center">
              <h1 className="text-2xl font-bold text-brand">Log in to edit your profile</h1>
              <p className="text-sm text-gray-500">
                You need to be logged in to manage your account details.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-button transition-all duration-200 hover:bg-accent-hover hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                >
                  Sign in
                </Link>
                <Link
                  href="/listings"
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300"
                >
                  Browse listings
                </Link>
              </div>
            </div>
          </AuthCard>
        </div>
      </PageContainer>
    );
  }

  if (gate.kind === "needsVerification") {
    return (
      <PageContainer>
        <div className="flex justify-center py-8 md:py-12">
          <AuthCard>
            <div className="space-y-4 text-center">
              <h1 className="text-2xl font-bold text-brand">Verify your email</h1>
              <p className="text-sm text-gray-500">
                Verify <span className="font-medium">{gate.email || "your email address"}</span>{" "}
                before editing your profile.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href={
                    gate.email
                      ? `/verify-email?email=${encodeURIComponent(gate.email)}`
                      : "/verify-email"
                  }
                  className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-button transition-all duration-200 hover:bg-accent-hover hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                >
                  Verify email
                </Link>
                <Link
                  href="/listings"
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300"
                >
                  Browse listings
                </Link>
              </div>
            </div>
          </AuthCard>
        </div>
      </PageContainer>
    );
  }

  if (gate.kind === "needsProfileSetup") {
    return (
      <PageContainer>
        <div className="flex justify-center py-8 md:py-12">
          <AuthCard>
            <div className="space-y-4 text-center">
              <h1 className="text-2xl font-bold text-brand">Complete profile first</h1>
              <p className="text-sm text-gray-500">
                Finish onboarding once, then you can edit your profile here anytime.
              </p>
              <div className="flex justify-center">
                <Link
                  href="/profile/setup"
                  className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-button transition-all duration-200 hover:bg-accent-hover hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                >
                  Go to profile setup
                </Link>
              </div>
            </div>
          </AuthCard>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex justify-center py-4 md:py-8">
        <AuthCard>
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold text-brand">Edit profile</h1>
              <p className="text-sm text-gray-500">
                Update your name, username, and profile picture.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="flex flex-col items-center gap-3">
                <label htmlFor="profile_picture" className="group cursor-pointer">
                  {draftImageUrl ? (
                    <div className="h-20 w-20 overflow-hidden rounded-full ring-2 ring-accent/20 transition-all duration-200 group-hover:shadow-glow group-hover:ring-accent">
                      {/* Live preview of the framing controls before upload. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={draftImageUrl}
                        alt="Profile preview"
                        className="h-full w-full object-cover"
                        style={{
                          objectPosition: `${50 + photoOffsetX / 2}% ${50 + photoOffsetY / 2}%`,
                          transform: `scale(${photoZoom})`,
                          transformOrigin: "center",
                        }}
                      />
                    </div>
                  ) : profilePictureUrl ? (
                    <Image
                      src={profilePictureUrl}
                      alt="Profile preview"
                      width={80}
                      height={80}
                      className="h-20 w-20 rounded-full object-cover ring-2 ring-accent/20 transition-all duration-200 group-hover:shadow-glow group-hover:ring-accent"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-light ring-2 ring-accent/20 transition-all duration-200 group-hover:shadow-glow group-hover:ring-accent">
                      <span className="text-2xl text-accent/60" aria-hidden>
                        +
                      </span>
                    </div>
                  )}
                </label>
                <input
                  id="profile_picture"
                  type="file"
                  accept="image/*"
                  onChange={handleUploadChange}
                  className="sr-only"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById("profile_picture")?.click()}
                  disabled={uploading}
                  className="text-xs font-medium text-accent hover:underline disabled:opacity-70"
                >
                  {draftImageFile ? "Choose different photo" : "Change photo"}
                </button>
                {draftImageFile && draftImageUrl && (
                  <div className="w-full max-w-sm space-y-3 rounded-xl border border-gray-200 bg-gray-50/60 p-3">
                    <p className="text-xs font-medium text-gray-700">Adjust photo position</p>
                    <div className="space-y-1">
                      <label className="block text-xs text-gray-500">Horizontal</label>
                      <input
                        type="range"
                        min={-100}
                        max={100}
                        value={photoOffsetX}
                        onChange={(e) => setPhotoOffsetX(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs text-gray-500">Vertical</label>
                      <input
                        type="range"
                        min={-100}
                        max={100}
                        value={photoOffsetY}
                        onChange={(e) => setPhotoOffsetY(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs text-gray-500">Zoom</label>
                      <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.01}
                        value={photoZoom}
                        onChange={(e) => setPhotoZoom(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={clearDraftImage}
                        disabled={uploading}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-70"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={applyPhotoAdjustments}
                        disabled={uploading}
                        className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-70"
                      >
                        {uploading ? "Uploading..." : "Apply photo"}
                      </button>
                    </div>
                  </div>
                )}
                {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                    First name
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 transition-all duration-200 focus:border-accent focus:bg-white focus:shadow-input-focus focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                    Last name
                  </label>
                  <input
                    id="last_name"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 transition-all duration-200 focus:border-accent focus:bg-white focus:shadow-input-focus focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 transition-all duration-200 focus:border-accent focus:bg-white focus:shadow-input-focus focus:outline-none"
                />
                <p className="text-xs text-gray-500">
                  Letters, numbers, and underscores only. Username changes are limited.
                </p>
              </div>

              {formError && (
                <div className="rounded-xl bg-red-50 px-3 py-2">
                  <p className="text-sm text-red-600">{formError}</p>
                </div>
              )}

              {successMessage && (
                <div className="rounded-xl bg-green-50 px-3 py-2">
                  <p className="text-sm text-green-700">{successMessage}</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={resetToInitialValues}
                  disabled={submitting || uploading || !initialProfileValues}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors duration-200 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300 disabled:opacity-70"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploading || !profilePictureUrl}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-button transition-all duration-200 hover:bg-accent-hover hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-70"
                >
                  {submitting ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </AuthCard>
      </div>
    </PageContainer>
  );
}
