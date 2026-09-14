import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ustaw nowe hasło",
  robots: { index: false, follow: false },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
