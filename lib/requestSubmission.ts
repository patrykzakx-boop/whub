import { REQUEST_CATEGORIES } from "@/lib/requestCategories";

export type CreateRequestInput = {
  title?: string;
  category?: string;
  description?: string;
  city?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  requestType?: string;
  companyId?: string | number | null;
  imageUrls?: string[];
  website?: string;
};

export type ValidatedRequestInput = {
  title: string;
  category: string;
  description: string;
  city: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  requestType: "individual" | "asap";
  companyId: number | null;
  imageUrls: string[];
};

const MAX_IMAGES = 6;
const allowedCategories = new Set(REQUEST_CATEGORIES.map((item) => item.value));

export function validateRequestSubmission(
  input: CreateRequestInput,
  supabaseUrl: string
): ValidatedRequestInput {
  if (input.website?.trim()) {
    throw new Error("Nie udało się wysłać formularza.");
  }

  const title = cleanRequiredText(input.title, 160);
  const description = cleanRequiredText(input.description, 10_000);
  const city = cleanRequiredText(input.city, 160);
  const category = input.category?.trim() || "Inne";
  const customerEmail = cleanOptionalText(input.customerEmail, 320);

  if (!title || !description || !city) {
    throw new Error("Uzupełnij tytuł, opis projektu i lokalizację.");
  }

  if (!allowedCategories.has(category)) {
    throw new Error("Wybrana kategoria zapytania jest nieprawidłowa.");
  }

  if (customerEmail && !isEmailAddress(customerEmail)) {
    throw new Error("Adres email jest nieprawidłowy.");
  }

  return {
    title,
    category,
    description,
    city,
    customerName: cleanOptionalText(input.customerName, 160),
    customerPhone: cleanOptionalText(input.customerPhone, 80),
    customerEmail,
    requestType: input.requestType === "asap" ? "asap" : "individual",
    companyId: parseCompanyId(input.companyId),
    imageUrls: validateImageUrls(input.imageUrls, supabaseUrl),
  };
}

function cleanRequiredText(value: string | undefined, maxLength: number) {
  return (value || "").trim().slice(0, maxLength);
}

function cleanOptionalText(value: string | undefined, maxLength: number) {
  const cleaned = (value || "").trim().slice(0, maxLength);
  return cleaned || null;
}

function parseCompanyId(value: CreateRequestInput["companyId"]) {
  if (value === null || value === undefined || value === "") return null;

  const companyId = Number(value);
  if (!Number.isSafeInteger(companyId) || companyId <= 0) {
    throw new Error("Identyfikator firmy jest nieprawidłowy.");
  }

  return companyId;
}

function validateImageUrls(value: string[] | undefined, supabaseUrl: string) {
  if (!value) return [];
  if (!Array.isArray(value) || value.length > MAX_IMAGES) {
    throw new Error("Możesz dodać maksymalnie 6 zdjęć.");
  }

  const allowedOrigin = new URL(supabaseUrl).origin;
  const allowedPathPattern =
    /^\/storage\/v1\/object\/public\/request_images\/requests\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp)$/i;

  return value.map((value) => {
    const imageUrl = new URL(value);

    if (
      imageUrl.origin !== allowedOrigin ||
      !allowedPathPattern.test(imageUrl.pathname) ||
      imageUrl.search ||
      imageUrl.hash ||
      imageUrl.username ||
      imageUrl.password
    ) {
      throw new Error("Adres jednego ze zdjęć jest nieprawidłowy.");
    }

    return imageUrl.toString();
  });
}

function isEmailAddress(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
