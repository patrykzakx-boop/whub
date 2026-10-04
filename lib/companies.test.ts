import { describe, expect, it } from "vitest";
import {
  getCompanyServiceTitle,
  isCompanyEligibleForOffers,
  normalizeCompanyServices,
} from "@/lib/companies";

describe("company publication rules", () => {
  it("allows offers only from published and approved companies", () => {
    expect(
      isCompanyEligibleForOffers({ status: "published", moderation_status: "approved" })
    ).toBe(true);
    expect(
      isCompanyEligibleForOffers({ status: "published", moderation_status: "pending" })
    ).toBe(false);
    expect(
      isCompanyEligibleForOffers({ status: "draft", moderation_status: "approved" })
    ).toBe(false);
  });

  it("keeps unique known service identifiers", () => {
    expect(normalizeCompanyServices(["balustrady", "balustrady", "unknown"])).toEqual([
      "balustrady",
    ]);
    expect(getCompanyServiceTitle("balustrady")).toBe("Balustrady");
  });
});
