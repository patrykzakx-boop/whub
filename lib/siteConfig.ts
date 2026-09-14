export const CONTACT_EMAIL = "weldhub@fastmail.com";

export const SITE_NAME = "WeldHub";
export const SITE_DESCRIPTION =
  "Znajdź wykonawcę usług spawalniczych i ślusarskich albo dodaj zlecenie i porównaj otrzymane oferty.";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://whub-indol.vercel.app"
).replace(/\/$/, "");

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}
