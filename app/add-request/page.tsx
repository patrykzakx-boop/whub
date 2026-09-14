"use client";

import { useEffect, useState } from "react";
import TurnstileWidget from "@/components/security/TurnstileWidget";
import { supabase } from "@/lib/supabaseClient";
import { REQUEST_CATEGORIES } from "@/lib/requestCategories";
import {
  isAllowedRequestImageType,
  MAX_REQUEST_IMAGE_BYTES,
  MAX_REQUEST_IMAGES,
} from "@/lib/requestImages";

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
  const [website, setWebsite] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const MAX_IMAGES = MAX_REQUEST_IMAGES;

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
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

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
            URL.revokeObjectURL(objectUrl);

            if (!blob) {
              reject(new Error("Nie udało się przygotować zdjęcia."));
              return;
            }

            resolve(
              new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), {
                type: "image/webp",
              })
            );
          },
          "image/webp",
          0.8
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Nie udało się odczytać wybranego zdjęcia."));
      };

      img.src = objectUrl;
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

      if (compressedImage.size > MAX_REQUEST_IMAGE_BYTES) {
        throw new Error("Po kompresji zdjęcie nadal ma więcej niż 5 MB.");
      }

      const signResponse = await fetch("/api/request-images/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: compressedImage.type,
          size: compressedImage.size,
        }),
      });
      const signedUpload = (await signResponse.json().catch(() => null)) as
        | { path?: string; token?: string; publicUrl?: string; error?: string }
        | null;

      if (
        !signResponse.ok ||
        !signedUpload?.path ||
        !signedUpload.token ||
        !signedUpload.publicUrl
      ) {
        throw new Error(
          signedUpload?.error || "Nie udało się przygotować uploadu zdjęcia."
        );
      }

      const { error: uploadError } = await supabase.storage
        .from("request_images")
        .uploadToSignedUrl(
          signedUpload.path,
          signedUpload.token,
          compressedImage,
          { contentType: compressedImage.type, cacheControl: "3600" }
        );

      if (uploadError) {
        throw new Error(uploadError.message || "Błąd uploadu zdjęcia");
      }

      uploadedUrls.push(signedUpload.publicUrl);
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

      if (!captchaToken) {
        setErrorMessage("Potwierdź, że nie jesteś robotem.");
        return;
      }

      if (images.length > 0) {
        imageUrls = await uploadImages();
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionData.session?.access_token
            ? { Authorization: `Bearer ${sessionData.session.access_token}` }
            : {}),
        },
        body: JSON.stringify({
          title,
          category,
          description,
          city,
          customerName,
          customerPhone,
          customerEmail,
          requestType,
          companyId: targetCompanyId || null,
          imageUrls,
          website,
          captchaToken,
        }),
      });
      setCaptchaResetKey((current) => current + 1);
      const insertedRequest = (await response.json().catch(() => null)) as
        | { id?: string | number; access_token?: string; error?: string }
        | null;

      if (!response.ok || !insertedRequest?.id || !insertedRequest.access_token) {
        setErrorMessage(
          insertedRequest?.error || "Nie udało się zapisać zapytania."
        );
        return;
      }

      const token = insertedRequest.access_token;
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
          <div role="alert" aria-live="assertive" className="mb-6 rounded-3xl border border-red-500/40 bg-red-500/10 p-5 text-sm text-red-200">
            {errorMessage}
          </div>
        )}

        {accessLink && (
          <div role="status" aria-live="polite" className="mb-6 rounded-3xl border border-slate-800 bg-[#0d1218] p-5 text-sm text-gray-300">
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
              aria-label="Tytuł zlecenia"
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
              aria-label="Kategoria zlecenia"
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
              aria-label="Opis projektu"
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

      if (
        selectedImages.some(
          (image) =>
            !isAllowedRequestImageType(image.type) ||
            image.size > 20 * 1024 * 1024
        )
      ) {
        setErrorMessage(
          "Wybierz zdjęcia JPG, PNG lub WebP, każde o rozmiarze do 20 MB."
        );
        e.target.value = "";
        return;
      }

      setErrorMessage("");
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
              aria-label="Lokalizacja zlecenia"
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
                aria-label="Imię i nazwisko"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Imię i nazwisko"
                className="rounded-xl border border-slate-700 bg-[#05070a] p-3 text-white placeholder:text-gray-500 outline-none focus:border-orange-500"
              />

              <div className="grid gap-4 md:grid-cols-2">

                <input
                  aria-label="Numer telefonu"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Telefon"
                  className="rounded-xl border border-slate-700 bg-[#05070a] p-3 text-white placeholder:text-gray-500 outline-none focus:border-orange-500"
                />

                <input
                  aria-label="Adres e-mail"
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
                aria-pressed={requestType === "individual"}
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
                aria-pressed={requestType === "asap"}
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
          <div className="hidden" aria-hidden="true">
            <label htmlFor="website">Strona internetowa</label>
            <input
              id="website"
              name="website"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="rounded-3xl border border-slate-800 bg-[#0d1218] p-6">
            <TurnstileWidget
              action="request_create"
              onTokenChange={setCaptchaToken}
              resetKey={captchaResetKey}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !captchaToken}
            aria-busy={loading}
            className="w-full rounded-2xl bg-orange-500 py-4 text-lg font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? "Zapisywanie..." : "Opublikuj zapytanie"}
          </button>

        </div>
      </div>
    </main>
  );
}
