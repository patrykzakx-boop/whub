export const MAX_REQUEST_IMAGES = 6;
export const MAX_REQUEST_IMAGE_BYTES = 5 * 1024 * 1024;

const allowedImageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export type RequestImageMetadata = {
  contentType?: string;
  size?: number;
};

export function validateRequestImageMetadata(input: RequestImageMetadata) {
  const contentType = input.contentType?.trim().toLowerCase() || "";
  const extension = allowedImageTypes.get(contentType);

  if (!extension) {
    throw new Error("Dozwolone są zdjęcia JPG, PNG i WebP.");
  }

  if (
    !Number.isSafeInteger(input.size) ||
    Number(input.size) <= 0 ||
    Number(input.size) > MAX_REQUEST_IMAGE_BYTES
  ) {
    throw new Error("Zdjęcie może mieć maksymalnie 5 MB.");
  }

  return { contentType, extension, size: Number(input.size) };
}

export function isAllowedRequestImageType(contentType: string) {
  return allowedImageTypes.has(contentType.trim().toLowerCase());
}
