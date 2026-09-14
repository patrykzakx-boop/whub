import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prywatny dostęp do zlecenia",
  robots: { index: false, follow: false, noarchive: true },
};

export default function RequestAccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
