import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dodaj zlecenie",
  description: "Opisz potrzebną usługę i przekaż zapytanie wykonawcom w WeldHub.",
  alternates: { canonical: "/add-request" },
};

export default function AddRequestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
