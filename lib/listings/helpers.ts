import type {
  GenderPreference,
  LeaseType,
  Listing as ListingModel,
  ListingStatus,
  ListingPhoto as ListingPhotoModel,
  Role,
  RoomType,
  User,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

// --- Write helpers: error type and payload types ---

export type ListingErrorCode =
  | "ACTIVE_LIMIT_REACHED"
  | "NOT_OWNER"
  | "NOT_FOUND"
  | "INVALID_STATE"
  | "VALIDATION_ERROR";

export class ListingError extends Error {
  readonly status: 400 | 403 | 404;
  readonly code: ListingErrorCode;

  constructor(options: {
    status: 400 | 403 | 404;
    code: ListingErrorCode;
    message: string;
  }) {
    super(options.message);
    this.status = options.status;
    this.code = options.code;
    this.name = "ListingError";
  }
}

/** Caller must pass verified, profile-complete, not-banned user. */
export type ListingOwner = Pick<User, "id">;

/** For softDeleteListing: owner or admin. */
export type ListingOwnerOrAdmin = Pick<User, "id" | "role">;

export interface CreateListingPayload {
  title: string;
  monthly_rent: number;
  lease_type: LeaseType;
  start_date: Date;
  end_date: Date;
  exact_address: string;
  nearby_landmark: string;
  total_bedrooms: number;
  total_bathrooms: number;
  room_type: RoomType;
  furnished: boolean;
  utilities_included: boolean;
  open_to_negotiation: boolean;
  gender_preference: GenderPreference;
  description: string;
}

export type UpdateListingPayload = Partial<CreateListingPayload>;

function validateCreatePayload(payload: CreateListingPayload): void {
  if (
    payload.title == null ||
    payload.monthly_rent == null ||
    payload.lease_type == null ||
    payload.start_date == null ||
    payload.end_date == null ||
    payload.exact_address == null ||
    payload.nearby_landmark == null ||
    payload.total_bedrooms == null ||
    payload.total_bathrooms == null ||
    payload.room_type == null ||
    payload.furnished == null ||
    payload.utilities_included == null ||
    payload.open_to_negotiation == null ||
    payload.gender_preference == null ||
    payload.description == null
  ) {
    throw new ListingError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Missing required listing fields.",
    });
  }
  if (payload.end_date <= payload.start_date) {
    throw new ListingError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "end_date must be after start_date.",
    });
  }
  if (payload.title.length > 100) {
    throw new ListingError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "title must be at most 100 characters.",
    });
  }
  if (payload.nearby_landmark.length > 80) {
    throw new ListingError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "nearby_landmark must be at most 80 characters.",
    });
  }
  if (payload.description.length > 1000) {
    throw new ListingError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "description must be at most 1000 characters.",
    });
  }
  if (!Number.isInteger(payload.monthly_rent) || payload.monthly_rent < 1) {
    throw new ListingError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "monthly_rent must be a positive integer.",
    });
  }
  if (!Number.isInteger(payload.total_bedrooms) || payload.total_bedrooms < 1) {
    throw new ListingError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "total_bedrooms must be a positive integer.",
    });
  }
  if (!Number.isInteger(payload.total_bathrooms) || payload.total_bathrooms < 1) {
    throw new ListingError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "total_bathrooms must be a positive integer.",
    });
  }
}

function validateUpdatePayload(payload: UpdateListingPayload): void {
  if (payload.start_date != null && payload.end_date != null && payload.end_date <= payload.start_date) {
    throw new ListingError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "end_date must be after start_date.",
    });
  }
  if (payload.title != null && payload.title.length > 100) {
    throw new ListingError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "title must be at most 100 characters.",
    });
  }
  if (payload.nearby_landmark != null && payload.nearby_landmark.length > 80) {
    throw new ListingError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "nearby_landmark must be at most 80 characters.",
    });
  }
  if (payload.description != null && payload.description.length > 1000) {
    throw new ListingError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "description must be at most 1000 characters.",
    });
  }
  if (payload.monthly_rent != null && (!Number.isInteger(payload.monthly_rent) || payload.monthly_rent < 1)) {
    throw new ListingError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "monthly_rent must be a positive integer.",
    });
  }
  if (payload.total_bedrooms != null && (!Number.isInteger(payload.total_bedrooms) || payload.total_bedrooms < 1)) {
    throw new ListingError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "total_bedrooms must be a positive integer.",
    });
  }
  if (payload.total_bathrooms != null && (!Number.isInteger(payload.total_bathrooms) || payload.total_bathrooms < 1)) {
    throw new ListingError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "total_bathrooms must be a positive integer.",
    });
  }
}

export type ListingSort = "newest" | "price_asc";

export interface ListingFilters {
  min_rent?: number;
  max_rent?: number;
  start_date?: Date;
  end_date?: Date;
  room_type?: RoomType;
  furnished?: boolean;
  utilities_included?: boolean;
  lease_type?: LeaseType;
  total_bedrooms?: number;
  total_bathrooms?: number;
  keyword?: string;
  sort?: ListingSort;
  page?: number;
  page_size?: number;
  /** When true (admin only), include TAKEN listings. */
  include_taken?: boolean;
}

export type PublicListing = {
  id: string;
  title: string;
  monthly_rent: number;
  start_date: Date;
  end_date: Date;
  nearby_landmark: string;
  lease_type: LeaseType;
  room_type: RoomType;
  total_bedrooms: number;
  total_bathrooms: number;
  furnished: boolean;
  utilities_included: boolean;
  open_to_negotiation: boolean;
  owner_username: string;
  thumbnail_url: string | null;
};

export type PublicListingDetail = PublicListing;

export type VerifiedListing = {
  id: string;
  title: string;
  monthly_rent: number;
  lease_type: LeaseType;
  start_date: Date;
  end_date: Date;
  exact_address: string;
  nearby_landmark: string;
  total_bedrooms: number;
  total_bathrooms: number;
  room_type: RoomType;
  furnished: boolean;
  utilities_included: boolean;
  open_to_negotiation: boolean;
  gender_preference: GenderPreference;
  description: string;
  status: ListingStatus;
  created_at: Date;
  updated_at: Date;
  photos: {
    id: string;
    image_url: string;
    display_order: number;
  }[];
  owner_first_name: string | null;
  owner_last_name: string | null;
  owner_profile_picture_url: string | null;
  owner_username: string;
  verified_badge: true;
};

export type VerifiedListingDetail = VerifiedListing;

export type VerifiedViewer = Pick<User, "id" | "role" | "is_banned">;

function buildWhereClause(filters: ListingFilters) {
  const where: Record<string, unknown> = {
    status: filters.include_taken
      ? { in: ["ACTIVE", "TAKEN"] as ListingStatus[] }
      : ("ACTIVE" as ListingStatus),
  };

  if (typeof filters.min_rent === "number") {
    where.monthly_rent = {
      ...(where.monthly_rent as Record<string, number> | undefined),
      gte: filters.min_rent,
    };
  }

  if (typeof filters.max_rent === "number") {
    where.monthly_rent = {
      ...(where.monthly_rent as Record<string, number> | undefined),
      lte: filters.max_rent,
      ...(typeof (where.monthly_rent as Record<string, number> | undefined)?.gte === "number"
        ? { gte: (where.monthly_rent as Record<string, number>).gte }
        : {}),
    };
  }

  if (filters.start_date) {
    where.start_date = { gte: filters.start_date };
  }

  if (filters.end_date) {
    where.end_date = { lte: filters.end_date };
  }

  if (filters.room_type) {
    where.room_type = filters.room_type;
  }

  if (typeof filters.furnished === "boolean") {
    where.furnished = filters.furnished;
  }

  if (typeof filters.utilities_included === "boolean") {
    where.utilities_included = filters.utilities_included;
  }

  if (filters.lease_type) {
    where.lease_type = filters.lease_type;
  }

  if (typeof filters.total_bedrooms === "number") {
    where.total_bedrooms = filters.total_bedrooms >= 5
      ? { gte: filters.total_bedrooms }
      : filters.total_bedrooms;
  }

  if (typeof filters.total_bathrooms === "number") {
    where.total_bathrooms = filters.total_bathrooms >= 4
      ? { gte: filters.total_bathrooms }
      : filters.total_bathrooms;
  }

  if (filters.keyword && filters.keyword.trim().length > 0) {
    const keyword = filters.keyword.trim();
    where.OR = [
      {
        title: {
          contains: keyword,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: keyword,
          mode: "insensitive",
        },
      },
    ];
  }

  return where;
}

function buildOrderBy(sort?: ListingSort) {
  if (sort === "price_asc") {
    return { monthly_rent: "asc" as const };
  }

  // Default: newest first
  return { created_at: "desc" as const };
}

function buildPagination(filters: ListingFilters) {
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const pageSize = filters.page_size && filters.page_size > 0 ? filters.page_size : 20;

  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

function mapPublicListing(row: ListingModel & { owner: User; photos?: ListingPhotoModel[] }): PublicListing {
  const sorted = row.photos?.slice().sort((a, b) => a.display_order - b.display_order);
  return {
    id: row.id,
    title: row.title,
    monthly_rent: row.monthly_rent,
    start_date: row.start_date,
    end_date: row.end_date,
    nearby_landmark: row.nearby_landmark,
    lease_type: row.lease_type,
    room_type: row.room_type,
    total_bedrooms: row.total_bedrooms,
    total_bathrooms: row.total_bathrooms,
    furnished: row.furnished,
    utilities_included: row.utilities_included,
    open_to_negotiation: row.open_to_negotiation,
    owner_username: row.owner.username,
    thumbnail_url: sorted?.[0]?.image_url ?? null,
  };
}

function mapVerifiedListing(
  row: ListingModel & { owner: User; photos: ListingPhotoModel[] }
): VerifiedListing {
  return {
    id: row.id,
    title: row.title,
    monthly_rent: row.monthly_rent,
    lease_type: row.lease_type,
    start_date: row.start_date,
    end_date: row.end_date,
    exact_address: row.exact_address,
    nearby_landmark: row.nearby_landmark,
    total_bedrooms: row.total_bedrooms,
    total_bathrooms: row.total_bathrooms,
    room_type: row.room_type,
    furnished: row.furnished,
    utilities_included: row.utilities_included,
    open_to_negotiation: row.open_to_negotiation,
    gender_preference: row.gender_preference,
    description: row.description,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    photos: row.photos
      .slice()
      .sort((a, b) => a.display_order - b.display_order)
      .map((photo) => ({
        id: photo.id,
        image_url: photo.image_url,
        display_order: photo.display_order,
      })),
    owner_first_name: row.owner.first_name,
    owner_last_name: row.owner.last_name,
    owner_profile_picture_url: row.owner.profile_picture_url,
    owner_username: row.owner.username,
    verified_badge: true,
  };
}

export async function getPublicListings(filters: ListingFilters): Promise<PublicListing[]> {
  const where = buildWhereClause(filters);
  const orderBy = buildOrderBy(filters.sort);
  const pagination = buildPagination(filters);

  const listings = await prisma.listing.findMany({
    where,
    orderBy,
    ...pagination,
    include: {
      owner: true,
      photos: true,
    },
  });

  return listings.map(mapPublicListing);
}

export async function getVerifiedListings(
  filters: ListingFilters,
  _viewer: VerifiedViewer
): Promise<VerifiedListing[]> {
  const where = buildWhereClause(filters);
  const orderBy = buildOrderBy(filters.sort);
  const pagination = buildPagination(filters);

  const listings = await prisma.listing.findMany({
    where,
    orderBy,
    ...pagination,
    include: {
      owner: true,
      photos: true,
    },
  });

  return listings.map(mapVerifiedListing);
}

export async function getListingPublic(id: string): Promise<PublicListingDetail | null> {
  const listing = await prisma.listing.findFirst({
    where: {
      id,
      status: "ACTIVE",
    },
    include: {
      owner: true,
      photos: true,
    },
  });

  if (!listing) {
    return null;
  }

  return mapPublicListing(listing);
}

export async function getListingVerified(
  id: string,
  _viewer: VerifiedViewer
): Promise<VerifiedListingDetail | null> {
  const listing = await prisma.listing.findFirst({
    where: {
      id,
      status: "ACTIVE",
    },
    include: {
      owner: true,
      photos: true,
    },
  });

  if (!listing) {
    return null;
  }

  return mapVerifiedListing(listing);
}

// --- Write helpers (TASKS 3.2 PART B) ---

export async function createListing(
  user: ListingOwner,
  payload: CreateListingPayload
): Promise<ListingModel> {
  validateCreatePayload(payload);

  const activeCount = await prisma.listing.count({
    where: {
      owner_id: user.id,
      status: "ACTIVE",
    },
  });
  if (activeCount >= 3) {
    throw new ListingError({
      status: 403,
      code: "ACTIVE_LIMIT_REACHED",
      message: "Maximum 3 active listings per user.",
    });
  }

  const listing = await prisma.listing.create({
    data: {
      owner_id: user.id,
      title: payload.title,
      monthly_rent: payload.monthly_rent,
      lease_type: payload.lease_type,
      start_date: payload.start_date,
      end_date: payload.end_date,
      exact_address: payload.exact_address,
      nearby_landmark: payload.nearby_landmark,
      total_bedrooms: payload.total_bedrooms,
      total_bathrooms: payload.total_bathrooms,
      room_type: payload.room_type,
      furnished: payload.furnished,
      utilities_included: payload.utilities_included,
      open_to_negotiation: payload.open_to_negotiation,
      gender_preference: payload.gender_preference,
      description: payload.description,
      status: "ACTIVE",
    },
  });
  return listing;
}

export async function updateListing(
  user: ListingOwner,
  listingId: string,
  payload: UpdateListingPayload
): Promise<ListingModel> {
  validateUpdatePayload(payload);

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });
  if (!listing) {
    throw new ListingError({
      status: 404,
      code: "NOT_FOUND",
      message: "Listing not found.",
    });
  }
  if (listing.owner_id !== user.id) {
    throw new ListingError({
      status: 403,
      code: "NOT_OWNER",
      message: "Only the owner can update this listing.",
    });
  }

  const updated = await prisma.listing.update({
    where: { id: listingId },
    data: {
      ...(payload.title !== undefined && { title: payload.title }),
      ...(payload.monthly_rent !== undefined && { monthly_rent: payload.monthly_rent }),
      ...(payload.lease_type !== undefined && { lease_type: payload.lease_type }),
      ...(payload.start_date !== undefined && { start_date: payload.start_date }),
      ...(payload.end_date !== undefined && { end_date: payload.end_date }),
      ...(payload.exact_address !== undefined && { exact_address: payload.exact_address }),
      ...(payload.nearby_landmark !== undefined && { nearby_landmark: payload.nearby_landmark }),
      ...(payload.total_bedrooms !== undefined && { total_bedrooms: payload.total_bedrooms }),
      ...(payload.total_bathrooms !== undefined && { total_bathrooms: payload.total_bathrooms }),
      ...(payload.room_type !== undefined && { room_type: payload.room_type }),
      ...(payload.furnished !== undefined && { furnished: payload.furnished }),
      ...(payload.utilities_included !== undefined && { utilities_included: payload.utilities_included }),
      ...(payload.open_to_negotiation !== undefined && { open_to_negotiation: payload.open_to_negotiation }),
      ...(payload.gender_preference !== undefined && { gender_preference: payload.gender_preference }),
      ...(payload.description !== undefined && { description: payload.description }),
    },
  });
  return updated;
}

export async function markTaken(user: ListingOwner, listingId: string): Promise<ListingModel> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });
  if (!listing) {
    throw new ListingError({
      status: 404,
      code: "NOT_FOUND",
      message: "Listing not found.",
    });
  }
  if (listing.owner_id !== user.id) {
    throw new ListingError({
      status: 403,
      code: "NOT_OWNER",
      message: "Only the owner can mark this listing as taken.",
    });
  }
  if (listing.status !== "ACTIVE") {
    throw new ListingError({
      status: 403,
      code: "INVALID_STATE",
      message: "Only an active listing can be marked as taken.",
    });
  }

  const updated = await prisma.listing.update({
    where: { id: listingId },
    data: { status: "TAKEN" },
  });
  return updated;
}

export async function softDeleteListing(
  userOrAdmin: ListingOwnerOrAdmin,
  listingId: string
): Promise<ListingModel> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });
  if (!listing) {
    throw new ListingError({
      status: 404,
      code: "NOT_FOUND",
      message: "Listing not found.",
    });
  }
  const isOwner = listing.owner_id === userOrAdmin.id;
  const isAdmin = userOrAdmin.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    throw new ListingError({
      status: 403,
      code: "NOT_OWNER",
      message: "Only the owner or an admin can delete this listing.",
    });
  }

  const updated = await prisma.listing.update({
    where: { id: listingId },
    data: { status: "DELETED" },
  });
  return updated;
}

export async function expireListingsJob(): Promise<{ expiredCount: number }> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const result = await prisma.listing.updateMany({
    where: {
      status: "ACTIVE",
      end_date: { lt: today },
    },
    data: { status: "EXPIRED" },
  });
  return { expiredCount: result.count };
}

