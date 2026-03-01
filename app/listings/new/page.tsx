"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { PhotoUploader, type ListingPhoto } from "@/components/listings/PhotoUploader";

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

  function renderGate() {
    if (gate.kind === "loading") {
      return (
        <main
          className="min-h-screen flex items-center justify-center px-4"
          style={{ backgroundColor: "#F8F9FB" }}
        >
          <p className="text-base" style={{ color: "#6B7280" }}>
            Checking your account…
          </p>
        </main>
      );
    }
    if (gate.kind === "unauth") {
      return (
        <main
          className="min-h-screen flex items-center justify-center px-4"
          style={{ backgroundColor: "#F8F9FB" }}
        >
          <div className="w-full max-w-md">
            <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-sm px-6 py-8 text-center space-y-4">
              <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>
                Log in to create a listing
              </h1>
              <p className="text-sm" style={{ color: "#6B7280" }}>
                You need to be logged in with your UIUC account to create listings.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-base font-medium text-white transition-shadow hover:shadow-md"
                style={{ backgroundColor: "#13294B" }}
              >
                Log in
              </Link>
            </div>
          </div>
        </main>
      );
    }
    if (gate.kind === "needsVerify") {
      return (
        <main
          className="min-h-screen flex items-center justify-center px-4"
          style={{ backgroundColor: "#F8F9FB" }}
        >
          <div className="w-full max-w-md">
            <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-sm px-6 py-8 text-center space-y-4">
              <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>
                Verify your email
              </h1>
              <p className="text-sm" style={{ color: "#6B7280" }}>
                Verify your UIUC email before creating listings.
              </p>
              <Link
                href="/verify-email"
                className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-base font-medium text-white transition-shadow hover:shadow-md"
                style={{ backgroundColor: "#13294B" }}
              >
                Verify email
              </Link>
            </div>
          </div>
        </main>
      );
    }
    if (gate.kind === "needsProfile") {
      return (
        <main
          className="min-h-screen flex items-center justify-center px-4"
          style={{ backgroundColor: "#F8F9FB" }}
        >
          <div className="w-full max-w-md">
            <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-sm px-6 py-8 text-center space-y-4">
              <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>
                Complete your profile
              </h1>
              <p className="text-sm" style={{ color: "#6B7280" }}>
                Finish your profile before creating listings.
              </p>
              <Link
                href="/profile/setup"
                className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-base font-medium text-white transition-shadow hover:shadow-md"
                style={{ backgroundColor: "#13294B" }}
              >
                Complete profile
              </Link>
            </div>
          </div>
        </main>
      );
    }
    if (gate.kind === "banned") {
      return (
        <main
          className="min-h-screen flex items-center justify-center px-4"
          style={{ backgroundColor: "#F8F9FB" }}
        >
          <div className="w-full max-w-md">
            <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-sm px-6 py-8 text-center space-y-4">
              <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>
                Account restricted
              </h1>
              <p className="text-sm" style={{ color: "#6B7280" }}>
                Your account is restricted from creating listings.
              </p>
            </div>
          </div>
        </main>
      );
    }
    return null;
  }

  if (gate.kind !== "ready") {
    return renderGate();
  }

  if (step === "details") {
    return (
      <main
        className="min-h-screen px-4 py-6"
        style={{ backgroundColor: "#F8F9FB" }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-sm px-6 py-8 space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold" style={{ color: "#111827" }}>
                Create listing
              </h1>
              <p className="text-sm" style={{ color: "#6B7280" }}>
                Step 1 of 2: add your listing details.
              </p>
            </div>

            {submitError && (
              <p className="text-sm" style={{ color: "#DC2626" }}>
                {submitError}
              </p>
            )}

            <form className="space-y-4" onSubmit={handleDetailsSubmit}>
              <div className="space-y-1">
                <label
                  htmlFor="title"
                  className="block text-sm font-medium"
                  style={{ color: "#111827" }}
                >
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E84A27]"
                  style={{ color: "#111827" }}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label
                    htmlFor="monthly_rent"
                    className="block text-sm font-medium"
                    style={{ color: "#111827" }}
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
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E84A27]"
                    style={{ color: "#111827" }}
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="total_bedrooms"
                    className="block text-sm font-medium"
                    style={{ color: "#111827" }}
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
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E84A27]"
                    style={{ color: "#111827" }}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label
                    htmlFor="lease_type"
                    className="block text-sm font-medium"
                    style={{ color: "#111827" }}
                  >
                    Lease type
                  </label>
                  <select
                    id="lease_type"
                    required
                    value={leaseType}
                    onChange={(e) => setLeaseType(e.target.value as any)}
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E84A27] bg-white"
                    style={{ color: "#111827" }}
                  >
                    <option value="">Select lease type</option>
                    <option value="SUBLEASE">Sublease</option>
                    <option value="LEASE_TAKEOVER">Lease takeover</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="room_type"
                    className="block text-sm font-medium"
                    style={{ color: "#111827" }}
                  >
                    Room type
                  </label>
                  <select
                    id="room_type"
                    required
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value as any)}
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E84A27] bg-white"
                    style={{ color: "#111827" }}
                  >
                    <option value="">Select room type</option>
                    <option value="PRIVATE_ROOM">Private room</option>
                    <option value="ENTIRE_UNIT">Entire unit</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label
                    htmlFor="start_date"
                    className="block text-sm font-medium"
                    style={{ color: "#111827" }}
                  >
                    Start date
                  </label>
                  <input
                    id="start_date"
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E84A27]"
                    style={{ color: "#111827" }}
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="end_date"
                    className="block text-sm font-medium"
                    style={{ color: "#111827" }}
                  >
                    End date
                  </label>
                  <input
                    id="end_date"
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E84A27]"
                    style={{ color: "#111827" }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="exact_address"
                  className="block text-sm font-medium"
                  style={{ color: "#111827" }}
                >
                  Exact address
                </label>
                <input
                  id="exact_address"
                  type="text"
                  required
                  value={exactAddress}
                  onChange={(e) => setExactAddress(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E84A27]"
                  style={{ color: "#111827" }}
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="nearby_landmark"
                  className="block text-sm font-medium"
                  style={{ color: "#111827" }}
                >
                  Nearby landmark
                </label>
                <input
                  id="nearby_landmark"
                  type="text"
                  required
                  value={nearbyLandmark}
                  onChange={(e) => setNearbyLandmark(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E84A27]"
                  style={{ color: "#111827" }}
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="gender_preference"
                  className="block text-sm font-medium"
                  style={{ color: "#111827" }}
                >
                  Gender preference
                </label>
                <select
                  id="gender_preference"
                  required
                  value={genderPreference}
                  onChange={(e) => setGenderPreference(e.target.value as any)}
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E84A27] bg-white"
                  style={{ color: "#111827" }}
                >
                  <option value="">No preference / any</option>
                  <option value="ANY">Any</option>
                  <option value="FEMALE">Female</option>
                  <option value="MALE">Male</option>
                </select>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2 text-sm" style={{ color: "#6B7280" }}>
                  <input
                    type="checkbox"
                    checked={furnished}
                    onChange={(e) => setFurnished(e.target.checked)}
                    className="rounded border-[#E5E7EB]"
                  />
                  Furnished
                </label>
                <label className="inline-flex items-center gap-2 text-sm" style={{ color: "#6B7280" }}>
                  <input
                    type="checkbox"
                    checked={utilitiesIncluded}
                    onChange={(e) => setUtilitiesIncluded(e.target.checked)}
                    className="rounded border-[#E5E7EB]"
                  />
                  Utilities included
                </label>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium"
                  style={{ color: "#111827" }}
                >
                  Description
                </label>
                <textarea
                  id="description"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E84A27] min-h-[96px]"
                  style={{ color: "#111827" }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-shadow hover:shadow-md disabled:opacity-70"
                style={{ backgroundColor: "#13294B" }}
              >
                {submitting ? "Creating listing..." : "Continue to photos"}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  // Photos step
  return (
    <main
      className="min-h-screen px-4 py-6"
      style={{ backgroundColor: "#F8F9FB" }}
    >
      <div className="max-w-3xl mx-auto">
        <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-sm px-6 py-8 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold" style={{ color: "#111827" }}>
              Upload photos
            </h1>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              Step 2 of 2: add at least 1 photo (max 8) to your listing.
            </p>
          </div>

          {listingId && (
            <PhotoUploader
              listingId={listingId}
              initialPhotos={photos}
              onChange={setPhotos}
            />
          )}

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-end items-center">
            <button
              type="button"
              disabled={!photos || photos.length === 0}
              onClick={() => router.push("/me/listings")}
              className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-shadow hover:shadow-md disabled:opacity-70"
              style={{ backgroundColor: "#13294B" }}
            >
              {photos && photos.length > 0 ? "Finish" : "Add at least 1 photo to finish"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

