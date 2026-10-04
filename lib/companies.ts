import { SERVICES } from "@/components/company-form/constants/services";

type ModeratedCompany = {
  status?: string | null;
  moderation_status?: string | null;
};

const SERVICE_IDS = new Set(SERVICES.map((service) => service.id));

export function isCompanyEligibleForOffers(company: ModeratedCompany) {
  return company.status === "published" && company.moderation_status === "approved";
}

export function normalizeCompanyServices(services: string[]) {
  return [...new Set(services.filter((service) => SERVICE_IDS.has(service)))];
}

export function getCompanyServiceTitle(serviceId: string) {
  return SERVICES.find((service) => service.id === serviceId)?.title || serviceId;
}
