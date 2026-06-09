"use client";

/* eslint-disable @next/next/no-img-element */

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

type RequestGalleryProps = {
  imageUrls: string[];
  title: string;
};

export default function RequestGallery({
  imageUrls,
  title,
}: RequestGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (imageUrls.length === 0) {
    return null;
  }

  const selectedImage = imageUrls[selectedIndex];
  const hasMultipleImages = imageUrls.length > 1;

  const showPreviousImage = () => {
    setSelectedIndex((currentIndex) =>
      currentIndex === 0 ? imageUrls.length - 1 : currentIndex - 1
    );
  };

  const showNextImage = () => {
    setSelectedIndex((currentIndex) =>
      currentIndex === imageUrls.length - 1 ? 0 : currentIndex + 1
    );
  };

  return (
    <section className="mt-6">
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-black">
        <img
          src={selectedImage}
          alt={`${title} - zdjęcie ${selectedIndex + 1}`}
          className="h-[500px] w-full object-contain"
        />

        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={showPreviousImage}
              aria-label="Poprzednie zdjęcie"
              className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-700 bg-black/60 text-white transition hover:border-orange-500 hover:bg-black/80"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={showNextImage}
              aria-label="Następne zdjęcie"
              className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-700 bg-black/60 text-white transition hover:border-orange-500 hover:bg-black/80"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="absolute bottom-4 right-4 rounded-full border border-slate-700 bg-black/70 px-3 py-1 text-sm text-white">
              {selectedIndex + 1} / {imageUrls.length}
            </div>
          </>
        )}
      </div>

      {hasMultipleImages && (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {imageUrls.map((imageUrl, index) => {
            const isSelected = selectedIndex === index;

            return (
              <button
                key={`${imageUrl}-${index}`}
                type="button"
                onClick={() => setSelectedIndex(index)}
                aria-label={`Pokaż zdjęcie ${index + 1}`}
                className={`flex h-24 items-center justify-center overflow-hidden rounded-2xl border bg-black transition ${
                  isSelected
                    ? "border-orange-500 ring-2 ring-orange-500/30"
                    : "border-slate-800 hover:border-orange-500"
                }`}
              >
                <img
                  src={imageUrl}
                  alt={`${title} - miniatura ${index + 1}`}
                  className="max-h-full max-w-full object-contain"
                />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}