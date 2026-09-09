"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { REQUEST_CATEGORIES } from "@/lib/requestCategories";

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
  const [errorMessage, setErrorMessage] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [targetCompanyName, setTargetCompanyName] = useState("");
  const [targetCompanyId, setTargetCompanyId] = useState("");
  const [accessLink, setAccessLink] = useState("");

  const MAX_IMAGES = 6;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const companyName = params.get("companyName") || "";
      const companyId = params.get("companyId") || "";
      const type = params.get("type") || "";

      setTargetCompanyId(companyId);

      if (type === "asap") {
        setRequestType("asap");
      }

      if (!companyName) return;

      setTargetCompanyName(companyName);
      setTitle((currentTitle) =>
        currentTitle || `Zapytanie do ${companyName}`
      );
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

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
  const sendRequestLinkEmail = async ({
    email,
    title,
    accessLink,
  }: {
    email: string;
    title: string;
    accessLink: string;
  }) => {
    const response = await fetch("/api/send-request-link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        title,
        accessLink,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      return {
        ok: false,
        error: data?.error || "Nie udało się wysłać maila z prywatnym linkiem.",
      };
    }

    return { ok: true };
  };

  const sendCompanyRequestNotification = async (
    requestId: string | number,
    accessToken: string
  ) => {
    const response = await fetch("/api/send-company-request-notification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestId,
        accessToken,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      return {
        ok: false,
        error:
          data?.error ||
          "Nie udało się wysłać powiadomienia do firmy.",
      };
    }

    return { ok: true };
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
        throw new Error(uploadError.message || "Błąd uploadu zdjęcia");
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
      setErrorMessage("");

      if (!title.trim() || !description.trim() || !city.trim()) {
        setErrorMessage("Uzupełnij tytuł, opis projektu i lokalizację.");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const accessToken = crypto.randomUUID();

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
        customer_id: user?.id ?? null,
        access_token: accessToken,
        request_type: requestType,
        company_id: targetCompanyId ? Number(targetCompanyId) : null,
        status: "new",
        contractor_status: "new",
        image_url: imageUrls[0] ?? null,
      };

      const { data: insertedRequest, error } = await supabase
        .from("requests")
        .insert({
          ...requestData,
          image_urls: imageUrls,
        })
        .select("id, access_token")
        .single();

      if (
        error &&
        (error.message.includes("image_urls") ||
          error.message.includes("customer_id") ||
          error.message.includes("access_token") ||
          error.message.includes("contractor_status") ||
          error.message.includes("schema cache"))
      ) {
        const { data: fallbackRequest, error: fallbackError } = await supabase
          .from("requests")
          .insert({
            ...requestData,
            customer_id: undefined,
            access_token: undefined,
            contractor_status: undefined,
          })
          .select("id")
          .single();

        if (fallbackError) {
          setErrorMessage(fallbackError.message || "Błąd podczas zapisu zapytania.");
          return;
        }

        alert(
          "Zapytanie zostało dodane, ale prywatny link będzie dostępny po dodaniu kolumny access_token w Supabase."
        );
        window.location.href = fallbackRequest?.id ? "/request/" + fallbackRequest.id : "/requests";
        return;
      }

      if (error) {
        setErrorMessage(error.message || "Błąd podczas zapisu zapytania.");
        return;
      }

      const token = insertedRequest?.access_token || accessToken;
      const nextAccessLink = "/request-access/" + token;
      const fullAccessLink = window.location.origin + nextAccessLink;

      setAccessLink(nextAccessLink);

      if (customerEmail.trim()) {
        const emailResult = await sendRequestLinkEmail({
          email: customerEmail.trim(),
          title: title.trim(),
          accessLink: fullAccessLink,
        });

        if (!emailResult.ok) {
          console.warn(emailResult.error);
        }
      }

      if (targetCompanyId && insertedRequest?.id) {
        const notificationResult = await sendCompanyRequestNotification(
          insertedRequest.id,
          token
        );

        if (!notificationResult.ok) {
          console.warn(notificationResult.error);
        }
      }

      window.location.href = nextAccessLink;
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Wystąpił błąd podczas wysyłania zapytania.");
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
            {targetCompanyName
              ? `Opisz czego potrzebujesz, a firma ${targetCompanyName} otrzyma kontekst zapytania.`
              : "Opisz czego potrzebujesz, a zainteresowani wykonawcy odezwą się do Ciebie z ofertą."}
          </p>
        </div>

        {targetCompanyName && (
          <div className="mb-6 rounded-3xl border border-orange-500/30 bg-orange-500/10 p-5 text-orange-100">
            Zapytanie kierowane do: <span className="font-semibold">{targetCompanyName}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 rounded-3xl border border-red-500/40 bg-red-500/10 p-5 text-sm text-red-200">
            {errorMessage}
          </div>
        )}

        {accessLink && (
          <div className="mb-6 rounded-3xl border border-slate-800 bg-[#0d1218] p-5 text-sm text-gray-300">
            Prywatny link do zlecenia: <span className="text-orange-400">{accessLink}</span>
          </div>
        )}

        {/* Korzyści */}
        <div className="mb-8 flex flex-wrap gap-3">
          <div className="rounded-full border border-slate-700 bg-[#0d1218] px-4 py-2 text-sm text-gray-300">
            ✓ Dodanie zapytania jest darmowe
          </div>

          <div className="rounded-full border border-slate-700 bg-[#0d1218] px-4 py-2 text-sm text-gray-300">
            ✓ Otrzymasz prywatny link do odpowiedzi
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
              {REQUEST_CATEGORIES.map((requestCategory) => (
                <option
                  key={requestCategory.value}
                  value={requestCategory.value}
                >
                  {requestCategory.label}
                </option>
              ))}
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

          {/* Priorytet */}
          <div className="rounded-3xl border border-slate-800 bg-[#0d1218] p-6">
            <label className="mb-4 block text-lg font-semibold text-white">
              Priorytet
            </label>

            <p className="mb-4 text-sm leading-6 text-gray-400">
              Wybierz pilne, jeśli zależy Ci na szybkiej odpowiedzi lub chodzi o awarię.
            </p>

            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setRequestType("individual")}
                className={`rounded-2xl p-4 text-center text-white transition ${
                  requestType === "individual"
                    ? "border border-orange-500 bg-orange-500/10"
                    : "border border-slate-700"
                }`}
              >
                Standardowe
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
                Pilne / awaria
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
