"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AddRequestPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const [requestType, setRequestType] = useState("individual");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);

  const MAX_IMAGES = 6;

  const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");

      const MAX_WIDTH = 1600;

      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH) {
        height = (height * MAX_WIDTH) / width;
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          resolve(
            new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, ".webp"),
              {
                type: "image/webp",
              }
            )
          );
        },
        "image/webp",
        0.8
      );
    };

    img.src = URL.createObjectURL(file);
  });
};
  const uploadImages = async () => {
    const uploadedUrls: string[] = [];

    for (const image of images) {
      const compressedImage = await compressImage(image);
      console.log("Original:", Math.round(image.size / 1024), "KB");
      console.log("Compressed:", Math.round(compressedImage.size / 1024), "KB");

      const fileName = `${Date.now()}-${crypto.randomUUID()}-${compressedImage.name}`;

      const { error: uploadError } = await supabase.storage
        .from("request_images")
        .upload(fileName, compressedImage);

      if (uploadError) {
        console.error(uploadError);
        throw new Error("Błąd uploadu zdjęcia");
      }

      const { data } = supabase.storage
        .from("request_images")
        .getPublicUrl(fileName);

      uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async () => {
    let imageUrls: string[] = [];
    try {
      setLoading(true);

      if (images.length > 0) {
        imageUrls = await uploadImages();
      }

      const requestData = {
        title,
        category,
        description,
        city,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        request_type: requestType,
        status: "active",
        image_url: imageUrls[0] ?? null,
      };

      const { error } = await supabase.from("requests").insert({
        ...requestData,
        image_urls: imageUrls,
      });

      if (
        error &&
        (error.message.includes("image_urls") ||
          error.message.includes("schema cache"))
      ) {
        const { error: fallbackError } = await supabase
          .from("requests")
          .insert(requestData);

        if (fallbackError) {
          console.error(fallbackError);
          alert("Błąd podczas zapisu");
          return;
        }

        alert(
          "Zapytanie zostało dodane. Kilka zdjęć będzie widoczne po dodaniu kolumny image_urls w Supabase."
        );
        window.location.href = "/requests";
        return;
      }

      if (error) {
        console.error(error);
        alert("Błąd podczas zapisu");
        return;
      }

      alert("Zapytanie zostało dodane");
 window.location.href = "/requests";
    } catch (err) {
      console.error(err);
      alert("Wystąpił błąd");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#05070a]">
      <div className="mx-auto max-w-4xl px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">
            Dodaj zapytanie
          </h1>

          <p className="mt-3 text-gray-400">
            Opisz czego potrzebujesz, a zainteresowani wykonawcy
            odezwą się do Ciebie z ofertą.
          </p>
        </div>

        {/* Korzyści */}
        <div className="mb-8 flex flex-wrap gap-3">
          <div className="rounded-full border border-slate-700 bg-[#0d1218] px-4 py-2 text-sm text-gray-300">
            ✓ Dodanie zapytania jest darmowe
          </div>

          <div className="rounded-full border border-slate-700 bg-[#0d1218] px-4 py-2 text-sm text-gray-300">
            ✓ Otrzymasz odpowiedzi od wykonawców
          </div>

          <div className="rounded-full border border-slate-700 bg-[#0d1218] px-4 py-2 text-sm text-gray-300">
            ✓ Sam wybierasz firmę
          </div>
        </div>

        <div className="space-y-6">

          {/* Tytuł */}
          <div className="rounded-3xl border border-slate-800 bg-[#0d1218] p-6">
            <label className="mb-3 block text-lg font-semibold text-white">
              Tytuł zlecenia
            </label>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Np. Balustrada balkonowa 8m"
              className="w-full rounded-xl border border-slate-700 bg-[#05070a] p-3 text-white placeholder:text-gray-500 outline-none focus:border-orange-500"
            />
          </div>

          {/* Kategoria */}
          <div className="rounded-3xl border border-slate-800 bg-[#0d1218] p-6">
            <label className="mb-3 block text-lg font-semibold text-white">
              Kategoria
            </label>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-[#05070a] p-3 text-white outline-none focus:border-orange-500"
            >
              <option value="">Wybierz kategorię</option>
              <option>Balustrady</option>
              <option>Bramy i ogrodzenia</option>
              <option>Schody stalowe</option>
              <option>Konstrukcje stalowe</option>
              <option>Spawanie aluminium</option>
              <option>Mobilny spawacz</option>
              <option>Naprawa</option>
              <option>Inne</option>
            </select>
          </div>

          {/* Opis */}
          <div className="rounded-3xl border border-slate-800 bg-[#0d1218] p-6">
            <label className="mb-2 block text-lg font-semibold text-white">
              Opis projektu
            </label>

            <textarea
              rows={8}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opisz szczegóły projektu..."
              className="w-full rounded-2xl border border-slate-700 bg-[#05070a] p-4 text-white placeholder:text-gray-500 outline-none focus:border-orange-500"
            />
          </div>

          {/* Zdjęcia */}
         <div className="rounded-3xl border border-slate-800 bg-[#0d1218] p-6">
  <label className="mb-2 block text-lg font-semibold text-white">
    Zdjęcia projektu
  </label>

  <p className="mb-5 text-sm text-gray-400">
    Dodaj do {MAX_IMAGES} zdjęć projektu, miejsca montażu lub inspiracji.
  </p>

  <label
    htmlFor="image-upload"
    className="
      inline-flex
      cursor-pointer
      rounded-xl
      bg-orange-500
      px-5
      py-3
      font-medium
      text-white
      transition
      hover:bg-orange-600
    "
  >
    + Dodaj zdjęcie
  </label>

  <input
    id="image-upload"
    type="file"
    accept="image/*"
    multiple
    className="hidden"
    onChange={(e) => {
      const selectedImages = Array.from(e.target.files ?? []);
      setImages((currentImages) =>
        [...currentImages, ...selectedImages].slice(0, MAX_IMAGES)
      );
      e.target.value = "";
    }}
  />

  {images.length > 0 && (
    <div className="mt-4 grid gap-3">
      {images.map((image, index) => (
        <div
          key={`${image.name}-${image.lastModified}-${index}`}
          className="flex items-center justify-between gap-3 rounded-xl border border-slate-700 bg-[#05070a] p-3"
        >
          <p className="truncate text-sm text-green-400">
            ✓ {index + 1}. {image.name}
          </p>

          <button
            type="button"
            onClick={() =>
              setImages((currentImages) =>
                currentImages.filter((_, imageIndex) => imageIndex !== index)
              )
            }
            className="shrink-0 text-sm text-gray-400 transition hover:text-red-400"
          >
            Usuń
          </button>
        </div>
      ))}
    </div>
  )}
</div>

          {/* Lokalizacja */}
          <div className="rounded-3xl border border-slate-800 bg-[#0d1218] p-6">
            <label className="mb-3 block text-lg font-semibold text-white">
              Lokalizacja
            </label>

            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Np. Kraków"
              className="w-full rounded-xl border border-slate-700 bg-[#05070a] p-3 text-white placeholder:text-gray-500 outline-none focus:border-orange-500"
            />
          </div>

          {/* Kontakt */}
          <div className="rounded-3xl border border-slate-800 bg-[#0d1218] p-6">
            <label className="mb-4 block text-lg font-semibold text-white">
              Dane kontaktowe
            </label>

            <div className="grid gap-4">

              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Imię i nazwisko"
                className="rounded-xl border border-slate-700 bg-[#05070a] p-3 text-white placeholder:text-gray-500 outline-none focus:border-orange-500"
              />

              <div className="grid gap-4 md:grid-cols-2">

                <input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Telefon"
                  className="rounded-xl border border-slate-700 bg-[#05070a] p-3 text-white placeholder:text-gray-500 outline-none focus:border-orange-500"
                />

                <input
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Email"
                  className="rounded-xl border border-slate-700 bg-[#05070a] p-3 text-white placeholder:text-gray-500 outline-none focus:border-orange-500"
                />

              </div>

            </div>
          </div>

          {/* Typ zlecenia */}
          <div className="rounded-3xl border border-slate-800 bg-[#0d1218] p-6">
            <label className="mb-4 block text-lg font-semibold text-white">
              Typ zlecenia
            </label>

            <div className="grid gap-3 md:grid-cols-3">

              <button
                type="button"
                onClick={() => setRequestType("individual")}
                className={`rounded-2xl p-4 text-center text-white transition ${
                  requestType === "individual"
                    ? "border border-orange-500 bg-orange-500/10"
                    : "border border-slate-700"
                }`}
              >
                Klient indywidualny
              </button>

              <button
                type="button"
                onClick={() => setRequestType("company")}
                className={`rounded-2xl p-4 text-center text-white transition ${
                  requestType === "company"
                    ? "border border-orange-500 bg-orange-500/10"
                    : "border border-slate-700"
                }`}
              >
                Firma
              </button>

              <button
                type="button"
                onClick={() => setRequestType("asap")}
                className={`rounded-2xl p-4 text-center text-white transition ${
                  requestType === "asap"
                    ? "border border-red-500 bg-red-500/10"
                    : "border border-slate-700"
                }`}
              >
                ASAP
              </button>

            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-2xl bg-orange-500 py-4 text-lg font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? "Zapisywanie..." : "Opublikuj zapytanie"}
          </button>

        </div>
      </div>
    </main>
  );
}
