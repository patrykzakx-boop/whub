export type RequestCategory = {
  value: string;
  label: string;
  imageSrc: string;
  aliases: string[];
  serviceIds: string[];
  materialIds?: string[];
  requiresMobileService?: boolean;
};

export const REQUEST_CATEGORIES: RequestCategory[] = [
  {
    value: "Balustrady",
    label: "Balustrady",
    imageSrc: "/icons/Balustrades.png",
    aliases: ["balustrady", "balustrada", "balustrad"],
    serviceIds: ["balustrady"],
  },
  {
    value: "Bramy i ogrodzenia",
    label: "Bramy i ogrodzenia",
    imageSrc: "/icons/Gates.png",
    aliases: ["bramy", "brama", "ogrodzenia", "ogrodzenie"],
    serviceIds: ["bramy"],
  },
  {
    value: "Schody stalowe",
    label: "Schody stalowe",
    imageSrc: "/icons/Stairs.png",
    aliases: ["schody stalowe", "schody", "schod"],
    serviceIds: ["schody"],
  },
  {
    value: "Konstrukcje stalowe",
    label: "Konstrukcje stalowe",
    imageSrc: "/icons/SteelStructures.png",
    aliases: [
      "konstrukcje stalowe",
      "konstrukcje",
      "konstrukcja",
      "hale",
      "wiaty",
      "zadaszenia",
      "zbiorniki",
    ],
    serviceIds: ["konstrukcje", "hale", "wiaty", "zbiorniki"],
  },
  {
    value: "Naprawy",
    label: "Naprawy",
    imageSrc: "/icons/Job.png",
    aliases: ["naprawy", "naprawa", "regeneracje", "regeneracja", "awaria"],
    serviceIds: ["naprawy"],
  },
  {
    value: "Spawanie aluminium",
    label: "Spawanie aluminium",
    imageSrc: "/icons/Aluminium.png",
    aliases: ["spawanie aluminium", "aluminium", "alumini"],
    serviceIds: [],
    materialIds: ["aluminium"],
  },
  {
    value: "Mobilny spawacz",
    label: "Mobilny spawacz",
    imageSrc: "/icons/MobileWelder.png",
    aliases: ["mobilny spawacz", "mobilny", "dojazd"],
    serviceIds: [],
    requiresMobileService: true,
  },
  {
    value: "Inne",
    label: "Inne",
    imageSrc: "/icons/Job.png",
    aliases: ["inne", "inny", "pozostale", "pozostałe"],
    serviceIds: [],
  },
];

export function getRequestCategoryLabel(category?: string | null) {
  return getRequestCategory(category)?.label || category || "Bez kategorii";
}

export function getRequestCategoryImage(category?: string | null) {
  return getRequestCategory(category)?.imageSrc || "/icons/Job.png";
}

export function getRequestCategoryMatch(category?: string | null) {
  const requestCategory = getRequestCategory(category);

  return {
    serviceIds: requestCategory?.serviceIds || [],
    materialIds: requestCategory?.materialIds || [],
    requiresMobileService: requestCategory?.requiresMobileService || false,
  };
}

export function companyMatchesRequestCategory(
  company: {
    services?: string[] | null;
    materials?: string[] | null;
    mobile_service?: boolean | null;
  },
  category?: string | null
) {
  const match = getRequestCategoryMatch(category);

  const matchesServices =
    match.serviceIds.length === 0 ||
    match.serviceIds.some((serviceId) => company.services?.includes(serviceId));

  const matchesMaterials =
    match.materialIds.length === 0 ||
    match.materialIds.some((materialId) => company.materials?.includes(materialId));

  const matchesMobile =
    !match.requiresMobileService ||
    company.mobile_service === true;

  return matchesServices && matchesMaterials && matchesMobile;
}

export function getRequestCategory(category?: string | null) {
  const normalizedCategory = normalizeCategory(category);

  if (!normalizedCategory) return null;

  return REQUEST_CATEGORIES.find((item) => {
    const normalizedValue = normalizeCategory(item.value);
    const normalizedLabel = normalizeCategory(item.label);
    const normalizedAliases = item.aliases.map((alias) => normalizeCategory(alias));

    return (
      normalizedCategory === normalizedValue ||
      normalizedCategory === normalizedLabel ||
      normalizedAliases.some((alias) => normalizedCategory.includes(alias))
    );
  });
}

function normalizeCategory(value?: string | null) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
