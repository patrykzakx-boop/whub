"use client";

import { LoadScript } from "@react-google-maps/api";

export default function GoogleTest() {
  return (
    <LoadScript
      googleMapsApiKey={
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
      }
      libraries={["places"]}
    >
      <div className="rounded-xl border border-green-500 bg-green-500/10 p-4 text-green-400">
        ✓ Google Maps API załadowane poprawnie
      </div>
    </LoadScript>
  );
}