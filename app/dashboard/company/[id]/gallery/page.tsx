"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Company = {
  id: string;
  name: string;
  owner_id: string;
};

type CompanyImage = {
  id: string;
  company_id: string;
  image_url: string;
  created_at?: string;
};

const STORAGE_BUCKET = "company_images";
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

export default function CompanyGalleryPage() {
  const params = useParams<{ id: string }>();

  const [company, setCompany] = useState<Company | null>(null);
  const [images, setImages] = useState<CompanyImage[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadGallery = async () => {
      const id = params?.id;

      if (!id) {
        setErrorMessage("Brak identyfikatora firmy.");
        setLoading(false);
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.href = "/login";
        return;
      }

      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("id,name,owner_id")
        .eq("id", id)
        .eq("owner_id", user.id)
        .maybeSingle();

      if (companyError || !companyData) {
        setErrorMessage(
          getSupabaseErrorMessage(
            companyError,
            "Nie znaleziono firmy albo nie masz dostępu do galerii."
          )
        );
        setLoading(false);
        return;
      }

      const { data: imagesData, error: imagesError } = await supabase
        .from("company_images")
        .select("*")
        .eq("company_id", id)
        .order("created_at", { ascending: false });

      if (imagesError) {
        setErrorMessage(
          getSupabaseErrorMessage(imagesError, "Nie udało się pobrać zdjęć.")
        );
      }

      setCompany(companyData);
      setImages(imagesData || []);
      setLoading(false);
    };

    loadGallery();
  }, [params?.id]);

  const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    const validFiles = files.filter((file) => {
      return file.type.startsWith("image/") && file.size <= MAX_IMAGE_SIZE;
    });

    if (validFiles.length !== files.length) {
      setErrorMessage("Niektóre pliki pominięto. Dodawaj tylko zdjęcia do 8 MB.");
    } else {
      setErrorMessage("");
    }

    setSelectedFiles(validFiles);
    setMessage("");
  };

  const uploadImages = async () => {
    if (!company || selectedFiles.length === 0) return;

    setUploading(true);
    setMessage("");
    setErrorMessage("");

    const uploadedImages: CompanyImage[] = [];

    for (const file of selectedFiles) {
      const fileExt = file.name.split(".").pop() || "jpg";
      const filePath = `${company.id}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file);

      if (uploadError) {
        setErrorMessage(
          getSupabaseErrorMessage(uploadError, "Nie udało się wysłać zdjęcia.")
        );
        setUploading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      const { data: imageData, error: insertError } = await supabase
        .from("company_images")
        .insert({
          company_id: company.id,
          image_url: publicUrlData.publicUrl,
        })
        .select("*")
        .single();

      if (insertError) {
        await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
        setErrorMessage(
          getSupabaseErrorMessage(
            insertError,
            "Zdjęcie zostało wysłane, ale nie udało się zapisać go w galerii."
          )
        );
        setUploading(false);
        return;
      }

      uploadedImages.push(imageData);
    }

    setImages((current) => [...uploadedImages, ...current]);
    setSelectedFiles([]);
    setMessage("Zdjęcia zostały dodane do galerii.");
    setUploading(false);
  };

  const deleteImage = async (image: CompanyImage) => {
    const confirmed = window.confirm("Usunąć to zdjęcie z galerii?");

    if (!confirmed) return;

    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("company_images")
      .delete()
      .eq("id", image.id)
      .eq("company_id", image.company_id);

    if (error) {
      setErrorMessage(
        getSupabaseErrorMessage(error, "Nie udało się usunąć zdjęcia.")
      );
      return;
    }

    const storagePath = getStoragePath(image.image_url);

    if (storagePath) {
      await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    }

    setImages((current) => current.filter((item) => item.id !== image.id));
    setMessage("Zdjęcie zostało usunięte.");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070a] text-white">
        Ładowanie galerii...
      </main>
    );
  }

  if (!company) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070a] px-4 text-white">
        <div className="max-w-md rounded-3xl border border-slate-800 bg-[#0d1218] p-8 text-center">
          <h1 className="text-2xl font-semibold">Nie można otworzyć galerii</h1>
          <p className="mt-3 text-gray-400">{errorMessage}</p>
          <Link
            href="/dashboard#companies"
            className="mt-6 inline-flex rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white"
          >
            Wróć do panelu
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#05070a] px-4 py-5 text-white lg:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 border-b border-slate-800/80 pb-4">
          <Link
            href="/dashboard#companies"
            className="mb-4 inline-flex text-sm text-gray-500 transition hover:text-white"
          >
            ← Powrót do firm
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-orange-400">
                Galeria firmy
              </div>

              <h1 className="mt-1.5 text-2xl font-semibold text-white">
                {company.name}
              </h1>

              <p className="mt-1.5 max-w-2xl text-sm text-gray-500">
                Dodawaj zdjęcia realizacji widoczne na publicznym profilu.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/company/${company.id}`}
                className="rounded-xl px-4 py-2.5 text-sm text-gray-400 transition hover:bg-[#0d1218] hover:text-white"
              >
                Profil
              </Link>

              <Link
                href={`/dashboard/company/${company.id}/edit`}
                className="rounded-xl px-4 py-2.5 text-sm text-gray-400 transition hover:bg-[#0d1218] hover:text-white"
              >
                Edytuj
              </Link>
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-800/90 bg-[#0d1218] p-4 lg:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold">Zdjęcia realizacji</h2>
              <p className="mt-1 text-sm text-gray-500">
                {images.length === 1
                  ? "1 zdjęcie w galerii"
                  : `${images.length} zdjęć w galerii`}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-800 px-5 py-2.5 text-sm font-semibold text-gray-300 transition hover:border-slate-600 hover:text-white">
                Wybierz zdjęcia
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFilesChange}
                  className="sr-only"
                />
              </label>

              <button
                type="button"
                onClick={uploadImages}
                disabled={uploading || selectedFiles.length === 0}
                className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading
                  ? "Dodawanie..."
                  : selectedFiles.length > 0
                    ? `Dodaj (${selectedFiles.length})`
                    : "Dodaj"}
              </button>
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-300">
              {selectedFiles.map((file) => (
                <span
                  key={`${file.name}-${file.size}`}
                  className="max-w-full truncate rounded-full border border-slate-800 bg-[#070b10] px-3 py-1"
                >
                  {file.name}
                </span>
              ))}
            </div>
          )}

          {message && (
            <div className="mt-4 rounded-xl border border-slate-800 bg-[#070b10] p-3 text-sm text-gray-300">
              {message}
            </div>
          )}

          {errorMessage && (
            <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
              {errorMessage}
            </div>
          )}
        </section>

        <section className="mt-5">
          {images.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-black"
                >
                  <img
                    src={image.image_url}
                    alt={company.name}
                    className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-105 group-hover:opacity-85"
                  />

                  <button
                    type="button"
                    onClick={() => deleteImage(image)}
                    className="absolute right-3 top-3 rounded-full border border-red-500/40 bg-black/70 px-3 py-1 text-xs font-semibold text-red-200 opacity-100 backdrop-blur transition hover:bg-red-500 hover:text-white sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    Usuń
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-[#0d1218] p-8 text-center text-gray-400">
              Brak zdjęć. Dodaj realizacje, żeby pokazać je na profilu firmy.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function getStoragePath(publicUrl: string) {
  const marker = `/${STORAGE_BUCKET}/`;
  const markerIndex = publicUrl.indexOf(marker);

  if (markerIndex === -1) return null;

  return decodeURIComponent(publicUrl.slice(markerIndex + marker.length));
}

function getSupabaseErrorMessage(error: unknown, fallback: string) {
  if (error) console.error(error);
  return fallback;
}
