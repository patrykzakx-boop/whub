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
  const allowedPathPrefix = "/storage/v1/object/public/request_images/";

  return value.map((value) => {
    const imageUrl = new URL(value);

    if (
      imageUrl.origin !== allowedOrigin ||
      !imageUrl.pathname.startsWith(allowedPathPrefix)
    ) {
      throw new Error("Adres jednego ze zdjęć jest nieprawidłowy.");
    }

    return imageUrl.toString();
  });
}

function isEmailAddress(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
