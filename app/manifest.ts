import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WeldHub - usługi spawalnicze i ślusarskie",
    short_name: "WeldHub",
    description: "Platforma łącząca klientów z wykonawcami usług metalowych.",
    start_url: "/",
    display: "standalone",
    background_color: "#05070a",
    theme_color: "#f97316",
    lang: "pl",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
