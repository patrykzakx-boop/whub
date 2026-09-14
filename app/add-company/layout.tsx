import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dodaj firmę",
  robots: { index: false, follow: false },
};

export default function AddCompanyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
