"use client";

import { useState } from "react";

type Photo = {
  image_url: string;
  display_order: number;
};

export function PhotoCarousel({ photos }: { photos: Photo[] }) {
  const sorted = [...photos].sort((a, b) => a.display_order - b.display_order);
  const [index, setIndex] = useState(0);

  if (sorted.length === 0) return null;

  const current = sorted[index];
  const total = sorted.length;

  function prev() {
    setIndex((i) => (i === 0 ? total - 1 : i - 1));
  }
  function next() {
    setIndex((i) => (i === total - 1 ? 0 : i + 1));
  }

  return (
    <div className="relative overflow-hidden bg-gray-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={current.image_url}
        alt={`Photo ${index + 1} of ${total}`}
        className="h-72 w-full object-cover transition-all duration-300 md:h-[28rem]"
      />

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous photo"
            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-2xl bg-white/90 text-gray-700 shadow-elevated backdrop-blur-sm transition-all duration-200 hover:bg-white hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
          >
            <span className="text-lg leading-none" aria-hidden="true">&#8592;</span>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next photo"
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-2xl bg-white/90 text-gray-700 shadow-elevated backdrop-blur-sm transition-all duration-200 hover:bg-white hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
          >
            <span className="text-lg leading-none" aria-hidden="true">&#8594;</span>
          </button>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
            {sorted.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to photo ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index
                    ? "w-4 bg-white shadow-sm"
                    : "w-1.5 bg-white/50 hover:bg-white/70"
                }`}
              />
            ))}
          </div>

          <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            {index + 1} / {total}
          </span>
        </>
      )}
    </div>
  );
}
