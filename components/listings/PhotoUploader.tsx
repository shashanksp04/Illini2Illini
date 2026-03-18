"use client";

import { useEffect, useState } from "react";

export type ListingPhoto = {
  id?: string;
  image_url: string;
  display_order: number;
};

type PhotoUploaderProps = {
  listingId: string;
  initialPhotos?: ListingPhoto[];
  onChange?: (photos: ListingPhoto[]) => void;
};

export function PhotoUploader({ listingId, initialPhotos = [], onChange }: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<ListingPhoto[]>(initialPhotos);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPhotos(initialPhotos);
  }, [initialPhotos]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFiles(event.target.files);
    setError(null);
  }

  async function handleUpload() {
    if (!selectedFiles || selectedFiles.length === 0) {
      setError("Select one or more images to upload.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const files = Array.from(selectedFiles);
      let currentPhotos = [...photos];

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`/api/listings/${listingId}/photos`, {
          method: "POST",
          body: formData,
        });
        const json = (await res.json()) as { ok?: boolean; data?: { photos: ListingPhoto[] }; error?: { message?: string } };
        if (!res.ok || !json.ok) {
          const message =
            json?.error?.message ?? "Failed to upload photos. Please try again.";
          setError(message);
          return;
        }
        currentPhotos = (json.data?.photos ?? []) as ListingPhoto[];
        setPhotos(currentPhotos);
        if (onChange) {
          onChange(currentPhotos);
        }
      }

      setSelectedFiles(null);
    } catch {
      setError("Failed to upload photos. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(photoId: string) {
    setError(null);
    setDeletingPhotoId(photoId);
    try {
      const res = await fetch(`/api/listings/${listingId}/photos/${photoId}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { ok?: boolean; data?: { photos: ListingPhoto[] }; error?: { message?: string } };
      if (!res.ok || !json.ok) {
        setError(json?.error?.message ?? "Failed to delete photo. Please try again.");
        return;
      }
      const nextPhotos = (json.data?.photos ?? []) as ListingPhoto[];
      setPhotos(nextPhotos);
      if (onChange) {
        onChange(nextPhotos);
      }
    } catch {
      setError("Failed to delete photo. Please try again.");
    } finally {
      setDeletingPhotoId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-6 transition-all duration-200 hover:border-accent/40 hover:bg-accent-light/30">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm">
            <span className="text-lg text-gray-400" aria-hidden>&uarr;</span>
          </div>
          <div>
            <label
              htmlFor="listing_photos"
              className="cursor-pointer text-sm font-medium text-accent hover:underline"
            >
              Choose files
            </label>
            <p className="mt-0.5 text-xs text-gray-500">
              JPEG, PNG, or WEBP &middot; Min 1, max 8 photos
            </p>
          </div>
          <input
            id="listing_photos"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="sr-only"
          />
          {selectedFiles && selectedFiles.length > 0 && (
            <p className="text-xs text-gray-600">
              {selectedFiles.length} {selectedFiles.length === 1 ? "file" : "files"} selected
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-3 py-2">
          <p className="text-xs text-red-600" role="alert">{error}</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleUpload}
        disabled={uploading || !selectedFiles || selectedFiles.length === 0}
        className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-button transition-all duration-200 hover:bg-accent-hover hover:shadow-button-hover disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
      >
        {uploading ? "Uploading..." : "Upload photos"}
      </button>

      {photos.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            {photos.length} {photos.length === 1 ? "photo" : "photos"} uploaded
          </p>
          <div className="grid grid-cols-4 gap-2">
            {photos.map((photo) => (
              <div
                key={photo.id ?? `${photo.image_url}-${photo.display_order}`}
                className="group relative overflow-hidden rounded-xl bg-gray-100 shadow-card"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.image_url}
                  alt="Listing photo"
                  className="aspect-square w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 rounded-xl" />
                {photo.id && (
                  <button
                    type="button"
                    onClick={() => handleDelete(photo.id!)}
                    disabled={photos.length <= 1 || deletingPhotoId !== null}
                    aria-label="Delete photo"
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500/90 text-white shadow-sm transition-all duration-200 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-1"
                  >
                    <span className="text-sm font-bold leading-none" aria-hidden>&times;</span>
                  </button>
                )}
              </div>
            ))}
            {photos.length < 8 && (
              <button
                type="button"
                onClick={() => document.getElementById("listing_photos")?.click()}
                className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 hover:border-accent hover:bg-accent-light transition-all duration-200"
              >
                <span className="text-lg text-gray-400" aria-hidden>+</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
