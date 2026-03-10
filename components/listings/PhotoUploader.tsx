\"use client\";

import { useState } from \"react\";

export type ListingPhoto = {
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
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFiles(event.target.files);
    setError(null);
  }

  async function handleUpload() {
    if (!selectedFiles || selectedFiles.length === 0) {
      setError(\"Select one or more images to upload.\");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(selectedFiles).forEach((file) => {
        formData.append(\"files\", file);
      });
      const res = await fetch(`/api/listings/${listingId}/photos`, {
        method: \"POST\",
        body: formData,
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json.ok) {
        const message =
          json?.error?.message ?? \"Failed to upload photos. Please try again.\";
        setError(message);
        return;
      }
      const nextPhotos = (json.data?.photos ?? []) as ListingPhoto[];
      setPhotos(nextPhotos);
      if (onChange) {
        onChange(nextPhotos);
      }
      setSelectedFiles(null);
    } catch {
      setError(\"Failed to upload photos. Please try again.\");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className=\"space-y-4\">
      <div className=\"space-y-2\">
        <label
          htmlFor=\"listing_photos\"
          className=\"block text-sm font-medium text-gray-800\"
        >
          Photos
        </label>
        <input
          id=\"listing_photos\"
          type=\"file\"
          accept=\"image/*\"
          multiple
          onChange={handleFileChange}
          className=\"w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:border-illini-orange\"
        />
        <p className=\"text-xs text-gray-500\">
          Add at least 1 photo (max 8). JPEG, PNG, or WEBP.
        </p>
        {error && (
          <p className=\"text-xs text-red-600\" role=\"alert\">
            {error}
          </p>
        )}
      </div>

      <button
        type=\"button\"
        onClick={handleUpload}
        disabled={uploading || !selectedFiles || selectedFiles.length === 0}
        className=\"inline-flex items-center justify-center rounded-lg bg-illini-orange px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-shadow hover:shadow-md disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:ring-offset-2\"
      >
        {uploading ? \"Uploading...\" : \"Upload selected photos\"}
      </button>

      {photos.length > 0 && (
        <div className=\"space-y-2\">
          <p className=\"text-sm font-medium text-illini-blue\">Current photos</p>
          <div className=\"grid grid-cols-3 gap-2\">
            {photos.map((photo) => (
              <div
                key={`${photo.image_url}-${photo.display_order}`}
                className=\"overflow-hidden rounded-lg bg-gray-100\"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.image_url}
                  alt=\"Listing photo\"
                  className=\"h-24 w-full object-cover\"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

