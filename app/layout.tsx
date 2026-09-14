import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/siteConfig";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: "WeldHub - usługi spawalnicze i ślusarskie",
    template: "%s | WeldHub",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "usługi spawalnicze",
    "spawacz",
    "ślusarz",
    "spawanie",
    "konstrukcje stalowe",
    "zlecenia spawalnicze",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pl_PL",
    url: "/",
    siteName: SITE_NAME,
    title: "WeldHub - znajdź wykonawcę",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "WeldHub - znajdź wykonawcę",
    description: SITE_DESCRIPTION,
  },
  formatDetection: { email: false, address: false, telephone: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#05070a] text-white">
        <a
          href="#main-content"
          className="sr-only z-[100] rounded-lg bg-orange-500 px-4 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Przejdź do treści
        </a>
        <Navbar />
        <div id="main-content" tabIndex={-1} className="min-w-0 flex-1 outline-none">
          {children}
        </div>
      </body>
    </html>
  );
}
