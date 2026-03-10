"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { PhotoUploader, type ListingPhoto } from "@/components/listings/PhotoUploader";
import { PageContainer } from "@/components/layout/PageContainer";
import { FormSection } from "@/components/forms/FormSection";

type MeData = {
  email_verified: boolean;
  is_profile_complete: boolean;
  is_banned: boolean;
};

type MeResponse =
  | { ok: true; data: MeData }
  | { ok: false; error?: { code: string; message: string } };

type VerifiedListingForEdit = {
  id: string;
  title: string;
  monthly_rent: number;
  lease_type: "SUBLEASE" | "LEASE_TAKEOVER";
  start_date: string;
  end_date: string;
  exact_address: string;
  nearby_landmark: string;
  total_bedrooms: number;
  room_type: "PRIVATE_ROOM" | "ENTIRE_UNIT";
  furnished: boolean;
  utilities_included: boolean;
  gender_preference: "MALE" | "FEMALE" | "ANY";
  description: string;
  photos?: ListingPhoto[];
};

type ListingResponse =
  | { ok: true; data: { listing: VerifiedListingForEdit; requires_login_for_details?: boolean } }
  | { ok: false; error?: { code: string; message: string } };

type GateState =
  | { kind: "loading" }
  | { kind: "unauth" }
  | { kind: "needsVerify" }
  | { kind: "needsProfile" }
  | { kind: "banned" }
  | { kind: "ready" };

export function EditListingClient({ id }: { id: string }) {
  const router = useRouter();

  const [gate, setGate] = useState<GateState>({ kind: "loading" });
  const [loadingListing, setLoadingListing] = useState(true);
  const [listing, setListing] = useState<VerifiedListingForEdit | null>(null);
  const [requiresLoginFlag, setRequiresLoginFlag] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

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
  const [photos, setPhotos] = useState<ListingPhoto[]>([]);

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

  useEffect(() => {
    if (gate.kind !== "ready") return;
    let cancelled = false;
    async function loadListing() {
      setLoadingListing(true);
      setLoadError(null);
      try {
        const res = await fetch(`/api/listings/${id}`);
        const json = (await res.json()) as ListingResponse;
        if (!res.ok || !json.ok) {
          const code = (json as any)?.error?.code as string | undefined;
          if (code === "NOT_FOUND" || res.status === 404) {
            setLoadError("Listing not found.");
          } else if (code === "NOT_OWNER") {
            setLoadError("You do not have access to edit this listing.");
          } else {
            setLoadError((json as any)?.error?.message ?? "Failed to load listing.");
          }
          return;
        }
        const data = json.data;
        if (data.requires_login_for_details) {
          setRequiresLoginFlag(true);
          setLoadError("You don’t have access to this listing.");
          return;
        }
        const l = data.listing;
        if (!cancelled) {
          setListing(l);
          setTitle(l.title);
          setMonthlyRent(String(l.monthly_rent));
          setLeaseType(l.lease_type);
          setStartDate(l.start_date.slice(0, 10));
          setEndDate(l.end_date.slice(0, 10));
          setExactAddress(l.exact_address);
          setNearbyLandmark(l.nearby_landmark);
          setTotalBedrooms(String(l.total_bedrooms));
          setRoomType(l.room_type);
          setFurnished(l.furnished);
          setUtilitiesIncluded(l.utilities_included);
          setGenderPreference(l.gender_preference);
          setDescription(l.description);
          setPhotos((l.photos ?? []) as ListingPhoto[]);
        }
      } catch {
        if (!cancelled) setLoadError("Failed to load listing.");
      } finally {
        if (!cancelled) setLoadingListing(false);
      }
    }
    loadListing();
    return () => {
      cancelled = true;
    };
  }, [gate.kind, id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: "PUT",
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
        if (code === "NOT_OWNER") {
          setSubmitError("You do not have permission to edit this listing.");
        } else if (code === "VALIDATION_ERROR") {
          setSubmitError(message ?? "Please check your inputs and try again.");
        } else {
          setSubmitError(message ?? "Unable to save changes. Please try again.");
        }
        return;
      }
      router.push("/me/listings");
    } catch {
      setSubmitError("Unable to save changes. Please try again.");
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
      <PageContainer>
        <div className="flex justify-center py-12">
          <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white px-6 py-8 text-center shadow-sm space-y-4">
            <h1 className="text-2xl font-semibold text-illini-blue">Log in to edit this listing</h1>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-illini-orange px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-illini-orange focus:ring-offset-2"
            >
              Log in
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (gate.kind === "needsVerify") {
    return (
      <PageContainer>
        <div className="flex justify-center py-12">
          <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white px-6 py-8 text-center shadow-sm space-y-4">
            <h1 className="text-2xl font-semibold text-illini-blue">Verify your email</h1>
            <p className="text-sm text-gray-500">
              Verify your UIUC email before editing listings.
            </p>
            <Link
              href="/verify-email"
              className="inline-flex items-center justify-center rounded-lg bg-illini-orange px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-illini-orange focus:ring-offset-2"
            >
              Verify email
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (gate.kind === "needsProfile") {
    return (
      <PageContainer>
        <div className="flex justify-center py-12">
          <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white px-6 py-8 text-center shadow-sm space-y-4">
            <h1 className="text-2xl font-semibold text-illini-blue">Complete your profile</h1>
            <p className="text-sm text-gray-500">
              Finish your profile before editing listings.
            </p>
            <Link
              href="/profile/setup"
              className="inline-flex items-center justify-center rounded-lg bg-illini-orange px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-illini-orange focus:ring-offset-2"
            >
              Complete profile
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (gate.kind === "banned") {
    return (
      <PageContainer>
        <div className="flex justify-center py-12">
          <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white px-6 py-8 text-center shadow-sm space-y-4">
            <h1 className="text-2xl font-semibold text-illini-blue">Account restricted</h1>
            <p className="text-sm text-gray-500">
              Your account is restricted from editing listings.
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (loadingListing) {
    return (
      <PageContainer>
        <p className="text-sm text-gray-500">Loading listing…</p>
      </PageContainer>
    );
  }

  if (!listing || requiresLoginFlag || loadError) {
    return (
      <PageContainer>
        <div className="flex justify-center py-12">
          <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white px-6 py-8 text-center shadow-sm space-y-4">
            <h1 className="text-2xl font-semibold text-illini-blue">Unable to edit listing</h1>
            <p className="text-sm text-gray-500">
              {loadError ?? "You don’t have access to this listing."}
            </p>
            <Link
              href="/listings"
              className="inline-flex items-center justify-center rounded-lg bg-illini-orange px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-illini-orange focus:ring-offset-2"
            >
              Back to listings
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto space-y-6 md:space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-illini-blue">Edit listing</h1>
          <Link
            href="/me/listings"
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300"
          >
            Back to my listings
          </Link>
        </div>

        {submitError && (
          <p className="text-sm text-red-600">{submitError}</p>
        )}

        <form className="space-y-6 md:space-y-8" onSubmit={handleSubmit}>
          <FormSection title="Basic Info">
            <div className="space-y-1">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:border-illini-orange"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="monthly_rent" className="block text-sm font-medium text-gray-700">
                  Monthly rent
                </label>
                <input
                  id="monthly_rent"
                  type="number"
                  min={0}
                  required
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:border-illini-orange"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="total_bedrooms" className="block text-sm font-medium text-gray-700">
                  Total bedrooms
                </label>
                <input
                  id="total_bedrooms"
                  type="number"
                  min={1}
                  required
                  value={totalBedrooms}
                  onChange={(e) => setTotalBedrooms(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:border-illini-orange"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="lease_type" className="block text-sm font-medium text-gray-700">
                  Lease type
                </label>
                <select
                  id="lease_type"
                  required
                  value={leaseType}
                  onChange={(e) => setLeaseType(e.target.value as any)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:border-illini-orange"
                >
                  <option value="">Select lease type</option>
                  <option value="SUBLEASE">Sublease</option>
                  <option value="LEASE_TAKEOVER">Lease takeover</option>
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="room_type" className="block text-sm font-medium text-gray-700">
                  Room type
                </label>
                <select
                  id="room_type"
                  required
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value as any)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:border-illini-orange"
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
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                  Start date
                </label>
                <input
                  id="start_date"
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:border-illini-orange"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                  End date
                </label>
                <input
                  id="end_date"
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:border-illini-orange"
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="Location">
            <div className="space-y-1">
              <label htmlFor="exact_address" className="block text-sm font-medium text-gray-700">
                Exact address
              </label>
              <input
                id="exact_address"
                type="text"
                required
                value={exactAddress}
                onChange={(e) => setExactAddress(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:border-illini-orange"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="nearby_landmark" className="block text-sm font-medium text-gray-700">
                Nearby landmark
              </label>
              <input
                id="nearby_landmark"
                type="text"
                required
                value={nearbyLandmark}
                onChange={(e) => setNearbyLandmark(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:border-illini-orange"
              />
            </div>
          </FormSection>

          <FormSection title="Unit Details">
            <div className="space-y-1">
              <label htmlFor="gender_preference" className="block text-sm font-medium text-gray-700">
                Gender preference
              </label>
              <select
                id="gender_preference"
                required
                value={genderPreference}
                onChange={(e) => setGenderPreference(e.target.value as any)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:border-illini-orange"
              >
                <option value="">No preference / any</option>
                <option value="ANY">Any</option>
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={furnished}
                  onChange={(e) => setFurnished(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-200 text-illini-orange focus:ring-illini-orange"
                />
                Furnished
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={utilitiesIncluded}
                  onChange={(e) => setUtilitiesIncluded(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-200 text-illini-orange focus:ring-illini-orange"
                />
                Utilities included
              </label>
            </div>
          </FormSection>

          <FormSection title="Description">
            <div className="space-y-1">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[96px] w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:border-illini-orange"
              />
            </div>
          </FormSection>

          <FormSection title="Photos">
            <PhotoUploader
              listingId={id}
              initialPhotos={photos}
              onChange={setPhotos}
            />
          </FormSection>

          <div className="flex justify-between pt-4">
            <Link
              href="/me/listings"
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300"
            >
              Back to my listings
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-lg bg-illini-orange px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-shadow hover:shadow-md disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:ring-offset-2"
            >
              {submitting ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}

