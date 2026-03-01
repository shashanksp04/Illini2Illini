/**
 * Storage bucket names (BUILD_SPEC). Create these in Supabase Dashboard (TASKS 1.3).
 */
export const BUCKET_PROFILE_PICTURES = "profile-pictures";
export const BUCKET_LISTING_PHOTOS = "listing-photos";

/**
 * Minimal upload constraints (TASKS 1.3). Enforce in storage helpers.
 */
export const MAX_PROFILE_PICTURE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_LISTING_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_LISTING_PHOTOS = 8;

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
