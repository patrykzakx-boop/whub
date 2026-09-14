import type { NextConfig } from "next";

const supabaseHostname = (() => {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
        "https://bhgezpszfqosxztedsbz.supabase.co"
    ).hostname;
  } catch {
    return "bhgezpszfqosxztedsbz.supabase.co";
  }
})();

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHostname,
        pathname: "/storage/v1/object/**",
      },
    ],
  },
};

export default nextConfig;
