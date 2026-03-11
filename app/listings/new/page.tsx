"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { PhotoUploader, type ListingPhoto } from "@/components/listings/PhotoUploader";
import { PageContainer } from "@/components/layout/PageContainer";
import { AuthCard } from "@/components/auth/AuthCard";
import { FormSection } from "@/components/forms/FormSection";

type MeData = {
  email: string;
  email_verified: boolean;
  is_profile_complete: boolean;
  is_banned: boolean;
};

type MeResponse =
  | { ok: true; data: MeData }
  | { ok: false; error?: { code: string; message: string } };

type GateState =
  | { kind: "loading" }
  | { kind: "unauth" }
  | { kind: "needsVerify" }
  | { kind: "needsProfile" }
  | { kind: "banned" }
  | { kind: "ready" };

type Step = "details" | "photos";

function GateScreen({ title, description, cta }: { title: string; description: string; cta?: React.ReactNode }) {
  return (
    <PageContainer>
      <div className="flex justify-center py-8 md:py-12">
        <AuthCard>
          <div className="space-y-4 text-center">
            <h1 className="text-2xl font-bold text-brand">{title}</h1>
            <p className="text-sm text-gray-500">{description}</p>
            {cta}
          </div>
        </AuthCard>
      </div>
    </PageContainer>
  );
}

export default function NewListingPage() {
  const router = useRouter();

  const [gate, setGate] = useState<GateState>({ kind: "loading" });
  const [step, setStep] = useState<Step>("details");
  const [listingId, setListingId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<ListingPhoto[]>([]);

  const [title, setTitle] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [leaseType, setLeaseType] = useState<"SUBLEASE" | "LEASE_TAKEOVER" | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exactAddress, setExactAddress] = useState("");
  const [nearbyLandmark, setNearbyLandmark] = useState("");
  const [totalBedrooms, setTotalBedrooms] = useState("");
  const [roomType, setRoomType] = useState<"PRIVATE_ROOM" | "ENTIRE_UNIT" | "">("");
  const [furnished, setFurnished] = useState(false);
  const [utilitiesIncluded, setUtilitiesIncluded] = useState(false);
  const [genderPreference, setGenderPreference] = useState<"MALE" | "FEMALE" | "ANY" | "">("");
  const [description, setDescription] = useState("");

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadMe() {
      try {
        const res = await fetch("/api/me");
        const json = (await res.json()) as MeResponse;
        if (!res.ok || !json.ok) {
          if (!cancelled) setGate({ kind: "unauth" });
          return;
        }
        const data = json.data;
        if (!data.email_verified) {
          if (!cancelled) setGate({ kind: "needsVerify" });
          return;
        }
        if (!data.is_profile_complete) {
          if (!cancelled) setGate({ kind: "needsProfile" });
          return;
        }
        if (data.is_banned) {
          if (!cancelled) setGate({ kind: "banned" });
          return;
        }
        if (!cancelled) setGate({ kind: "ready" });
      } catch {
        if (!cancelled) setGate({ kind: "unauth" });
      }
    }
    loadMe();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDetailsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          monthly_rent: Number(monthlyRent),
          lease_type: leaseType,
          start_date: startDate,
          end_date: endDate,
          exact_address: exactAddress,
          nearby_landmark: nearbyLandmark,
          total_bedrooms: Number(totalBedrooms),
          room_type: roomType,
          furnished,
          utilities_included: utilitiesIncluded,
          gender_preference: genderPreference,
          description,
        }),
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json.ok) {
        const code = json?.error?.code as string | undefined;
        const message = json?.error?.message as string | undefined;
        if (code === "ACTIVE_LIMIT_REACHED") {
          setSubmitError(
            (message as string) ??
              "You have reached the maximum number of active listings. View your listings for details."
          );
        } else if (code === "VALIDATION_ERROR") {
          setSubmitError(message ?? "Please check your inputs and try again.");
        } else {
          setSubmitError(message ?? "Unable to create listing. Please try again.");
        }
        return;
      }
      const id = json.data?.listing_id as string | undefined;
      if (!id) {
        setSubmitError("Listing was created but an ID was not returned.");
        return;
      }
      setListingId(id);
      setStep("photos");
    } catch {
      setSubmitError("Unable to create listing. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (gate.kind === "loading") {
    return (
      <PageContainer>
        <p className="text-sm text-gray-500">Checking your account…</p>
      </PageContainer>
    );
  }

  if (gate.kind === "unauth") {
    return (
      <GateScreen
        title="Log in to create a listing"
        description="You need to be logged in with your UIUC account to create listings."
        cta={
          <Link href="/login" className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-button transition-all duration-200 hover:bg-accent-hover hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2">
            Log in
          </Link>
        }
      />
    );
  }

  if (gate.kind === "needsVerify") {
    return (
      <GateScreen
        title="Verify your email"
        description="Verify your UIUC email before creating listings."
        cta={
          <Link href="/verify-email" className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-button transition-all duration-200 hover:bg-accent-hover hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2">
            Verify email
          </Link>
        }
      />
    );
  }

  if (gate.kind === "needsProfile") {
    return (
      <GateScreen
        title="Complete your profile"
        description="Finish your profile before creating listings."
        cta={
          <Link href="/profile/setup" className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-button transition-all duration-200 hover:bg-accent-hover hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2">
            Complete profile
          </Link>
        }
      />
    );
  }

  if (gate.kind === "banned") {
    return (
      <GateScreen
        title="Account restricted"
        description="Your account is restricted from creating listings."
      />
    );
  }

  if (step === "details") {
    return (
      <PageContainer>
        <div className="mx-auto max-w-2xl space-y-6 md:space-y-8">
          <div>
            <h1 className="text-2xl font-semibold text-brand md:text-3xl">
              Create listing
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Step 1 of 2: add your listing details.
            </p>
          </div>

          {submitError && (
            <p className="text-sm text-red-600" role="alert">
              {submitError}
            </p>
          )}

          <form className="space-y-6 rounded-2xl border border-gray-200/60 bg-white p-6 shadow-card md:p-8" onSubmit={handleDetailsSubmit}>
            <FormSection title="Basic Info">
              <div className="space-y-1">
                <label htmlFor="title" className="block text-sm font-medium text-gray-800">
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-700 placeholder-gray-500 transition-all duration-200 focus:border-accent focus:bg-white focus:shadow-input-focus focus:outline-none"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label
                    htmlFor="monthly_rent"
                    className="block text-sm font-medium text-gray-800"
                  >
                    Monthly rent
                  </label>
                  <input
                    id="monthly_rent"
                    type="number"
                    min={0}
                    required
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-700 placeholder-gray-500 transition-all duration-200 focus:border-accent focus:bg-white focus:shadow-input-focus focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="total_bedrooms"
                    className="block text-sm font-medium text-gray-800"
                  >
                    Total bedrooms
                  </label>
                  <input
                    id="total_bedrooms"
                    type="number"
                    min={1}
                    required
                    value={totalBedrooms}
                    onChange={(e) => setTotalBedrooms(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-700 placeholder-gray-500 transition-all duration-200 focus:border-accent focus:bg-white focus:shadow-input-focus focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label
                    htmlFor="lease_type"
                    className="block text-sm font-medium text-gray-800"
                  >
                    Lease type
                  </label>
                  <select
                    id="lease_type"
                    required
                    value={leaseType}
                    onChange={(e) => setLeaseType(e.target.value as any)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-700 transition-all duration-200 focus:border-accent focus:bg-white focus:shadow-input-focus focus:outline-none"
                  >
                    <option value="">Select lease type</option>
                    <option value="SUBLEASE">Sublease</option>
                    <option value="LEASE_TAKEOVER">Lease takeover</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="room_type"
                    className="block text-sm font-medium text-gray-800"
                  >
                    Room type
                  </label>
                  <select
                    id="room_type"
                    required
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value as any)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-700 transition-all duration-200 focus:border-accent focus:bg-white focus:shadow-input-focus focus:outline-none"
                  >
                    <option value="">Select room type</option>
                    <option value="PRIVATE_ROOM">Private room</option>
                    <option value="ENTIRE_UNIT">Entire unit</option>
                  </select>
                </div>
              </div>
            </FormSection>

            <FormSection title="Dates">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label
                    htmlFor="start_date"
                    className="block text-sm font-medium text-gray-800"
                  >
                    Start date
                  </label>
                  <input
                    id="start_date"
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-700 transition-all duration-200 focus:border-accent focus:bg-white focus:shadow-input-focus focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="end_date"
                    className="block text-sm font-medium text-gray-800"
                  >
                    End date
                  </label>
                  <input
                    id="end_date"
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-700 transition-all duration-200 focus:border-accent focus:bg-white focus:shadow-input-focus focus:outline-none"
                  />
                </div>
              </div>
            </FormSection>

            <FormSection title="Location">
              <div className="space-y-1">
                <label
                  htmlFor="exact_address"
                  className="block text-sm font-medium text-gray-800"
                >
                  Exact address
                </label>
                <input
                  id="exact_address"
                  type="text"
                  required
                  value={exactAddress}
                  onChange={(e) => setExactAddress(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-700 placeholder-gray-500 transition-all duration-200 focus:border-accent focus:bg-white focus:shadow-input-focus focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="nearby_landmark"
                  className="block text-sm font-medium text-gray-800"
                >
                  Nearby landmark
                </label>
                <input
                  id="nearby_landmark"
                  type="text"
                  required
                  value={nearbyLandmark}
                  onChange={(e) => setNearbyLandmark(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-700 placeholder-gray-500 transition-all duration-200 focus:border-accent focus:bg-white focus:shadow-input-focus focus:outline-none"
                />
              </div>
            </FormSection>

            <FormSection title="Unit Details">
              <div className="space-y-1">
                <label
                  htmlFor="gender_preference"
                  className="block text-sm font-medium text-gray-800"
                >
                  Gender preference
                </label>
                <select
                  id="gender_preference"
                  required
                  value={genderPreference}
                  onChange={(e) => setGenderPreference(e.target.value as any)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-700 transition-all duration-200 focus:border-accent focus:bg-white focus:shadow-input-focus focus:outline-none"
                >
                  <option value="">No preference / any</option>
                  <option value="ANY">Any</option>
                  <option value="FEMALE">Female</option>
                  <option value="MALE">Male</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-4 pt-1">
                <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={furnished}
                    onChange={(e) => setFurnished(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-200 text-accent focus:ring-accent"
                  />
                  Furnished
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={utilitiesIncluded}
                    onChange={(e) => setUtilitiesIncluded(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-200 text-accent focus:ring-accent"
                  />
                  Utilities included
                </label>
              </div>
            </FormSection>

            <FormSection title="Description">
              <div className="space-y-1">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-800"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[96px] w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-700 placeholder-gray-500 transition-all duration-200 focus:border-accent focus:bg-white focus:shadow-input-focus focus:outline-none"
                />
              </div>
            </FormSection>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-button transition-all duration-200 hover:bg-accent-hover hover:shadow-button-hover disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              >
                {submitting ? "Creating listing..." : "Continue to photos"}
              </button>
            </div>
          </form>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mx-auto max-w-2xl space-y-6 md:space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-brand md:text-3xl">Upload photos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Step 2 of 2: add at least 1 photo (max 8) to your listing.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-card md:p-8">
          <FormSection title="Photos">
            {listingId && (
              <PhotoUploader
                listingId={listingId}
                initialPhotos={photos}
                onChange={setPhotos}
              />
            )}
          </FormSection>
        </div>

        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={() => setStep("details")}
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-gray-300"
          >
            Back
          </button>
          <button
            type="button"
            disabled={!photos || photos.length === 0}
            onClick={() => router.push("/me/listings")}
            className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-button transition-all duration-200 hover:bg-accent-hover hover:shadow-button-hover disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          >
            {photos && photos.length > 0 ? "Finish" : "Add at least 1 photo to finish"}
          </button>
        </div>
      </div>
    </PageContainer>
  );
}
