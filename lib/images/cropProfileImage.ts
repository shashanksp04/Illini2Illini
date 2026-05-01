type CropProfileImageOptions = {
  file: File;
  zoom: number;
  offsetX: number;
  offsetY: number;
  size?: number;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image."));
    img.src = src;
  });
}

export async function cropProfileImage({
  file,
  zoom,
  offsetX,
  offsetY,
  size = 512,
}: CropProfileImageOptions): Promise<File> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Unable to initialize image editor.");
    }

    const safeZoom = Math.min(3, Math.max(1, zoom));
    const normalizedX = Math.max(-100, Math.min(100, offsetX)) / 100;
    const normalizedY = Math.max(-100, Math.min(100, offsetY)) / 100;

    // Start from the largest centered square and zoom inward.
    const minSide = Math.min(image.width, image.height);
    const sourceSize = minSide / safeZoom;

    const maxShiftX = Math.max(0, (image.width - sourceSize) / 2);
    const maxShiftY = Math.max(0, (image.height - sourceSize) / 2);

    const centerX = image.width / 2 + normalizedX * maxShiftX;
    const centerY = image.height / 2 + normalizedY * maxShiftY;

    const sourceX = Math.max(0, Math.min(image.width - sourceSize, centerX - sourceSize / 2));
    const sourceY = Math.max(0, Math.min(image.height - sourceSize, centerY - sourceSize / 2));

    ctx.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error("Failed to generate cropped image."));
      }, "image/jpeg", 0.92);
    });

    const baseName = (file.name || "profile").replace(/\.[^/.]+$/, "");
    return new File([blob], `${baseName}-cropped.jpg`, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
