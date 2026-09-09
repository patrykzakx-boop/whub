"use client";

import { useEffect, useRef } from "react";

type Props = {
  value: string;
  onSelect: (data: {
    address: string;
    city: string;
    region: string;
    lat: number;
    lng: number;
    place_id: string;
  }) => void;
};

type GoogleAddressComponent = {
  types?: string[];
  longText?: string;
};

type GooglePlace = {
  id?: string;
  formattedAddress?: string;
  location?: {
    lat?: () => number;
    lng?: () => number;
  };
  addressComponents?: GoogleAddressComponent[];
  fetchFields: (options: { fields: string[] }) => Promise<void>;
};

type GooglePlaceSelectEvent = Event & {
  placePrediction?: {
    toPlace?: () => GooglePlace | null;
  };
};

type GooglePlacesLibrary = {
  PlaceAutocompleteElement: new () => HTMLElement;
};

type GoogleMapsNamespace = {
  maps?: {
    importLibrary?: (name: "places") => Promise<GooglePlacesLibrary>;
  };
};

export default function GoogleAddressInput({
  value,
  onSelect,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let autocompleteElement: HTMLElement | null = null;

    const initPlaces = async () => {
      if (cancelled) return;

      const google = (window as unknown as { google?: GoogleMapsNamespace }).google;

      if (!google?.maps?.importLibrary || !containerRef.current) {
        attempts += 1;

        if (attempts < 30) {
          setTimeout(initPlaces, 300);
        }

        return;
      }

      const { PlaceAutocompleteElement } =
        await google.maps.importLibrary("places");

      if (cancelled || !containerRef.current) return;

      const autocomplete = new PlaceAutocompleteElement();

      const handleSelect = async (event: Event) => {
        const selectEvent = event as GooglePlaceSelectEvent;
        const place = selectEvent.placePrediction?.toPlace?.();

        if (!place) return;

        await place.fetchFields({
          fields: [
            "id",
            "formattedAddress",
            "location",
            "addressComponents",
          ],
        });

        const components = place.addressComponents || [];

        const city =
          getAddressPart(components, "locality") ||
          getAddressPart(components, "postal_town") ||
          getAddressPart(components, "administrative_area_level_3") ||
          getAddressPart(components, "administrative_area_level_2");

        const rawRegion = getAddressPart(
          components,
          "administrative_area_level_1"
        );

        const region = normalizePolishRegion(rawRegion);

        onSelectRef.current({
          address: place.formattedAddress || "",
          city,
          region,
          lat: place.location?.lat?.() ?? 0,
          lng: place.location?.lng?.() ?? 0,
          place_id: place.id || "",
        });
      };

      autocomplete.addEventListener("gmp-select", handleSelect);

      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(autocomplete);

      autocompleteElement = autocomplete;
    };

    const scriptId = "google-maps-new";

    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");

      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&loading=async&libraries=places&v=beta`;
      script.async = true;
      script.defer = true;

      document.head.appendChild(script);
    }

    initPlaces();

    return () => {
      cancelled = true;
      autocompleteElement?.remove();
    };
  }, []);

  return (
    <div className="space-y-2">
      <div ref={containerRef} />

      {value && (
        <div className="text-sm text-gray-400">
          Wybrany adres: {value}
        </div>
      )}
    </div>
  );
}

function getAddressPart(components: GoogleAddressComponent[], type: string) {
  return (
    components.find((component) => component.types?.includes(type))?.longText ||
    ""
  );
}

function normalizePolishRegion(region: string) {
  const cleaned = region
    .trim()
    .toLowerCase()
    .replace(/^województwo\s+/i, "");

  const regions: Record<string, string> = {
    dolnośląskie: "dolnośląskie",
    "kujawsko-pomorskie": "kujawsko-pomorskie",
    lubelskie: "lubelskie",
    lubuskie: "lubuskie",
    łódzkie: "łódzkie",
    małopolskie: "małopolskie",
    mazowieckie: "mazowieckie",
    opolskie: "opolskie",
    podkarpackie: "podkarpackie",
    podlaskie: "podlaskie",
    pomorskie: "pomorskie",
    śląskie: "śląskie",
    świętokrzyskie: "świętokrzyskie",
    "warmińsko-mazurskie": "warmińsko-mazurskie",
    wielkopolskie: "wielkopolskie",
    zachodniopomorskie: "zachodniopomorskie",
  };

  return regions[cleaned] || cleaned;
}