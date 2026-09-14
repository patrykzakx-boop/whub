import { describe, expect, it } from "vitest";
import {
  getDashboardOfferHref,
  isOwnRequestOffer,
  OWN_REQUEST_OFFER_ERROR,
} from "@/lib/requestOffers";

describe("request offer access rules", () => {
  it("blokuje ofertę użytkownika na jego własne zlecenie", () => {
    expect(isOwnRequestOffer("user-1", "user-1")).toBe(true);
    expect(OWN_REQUEST_OFFER_ERROR).toBe(
      "Nie możesz wysłać oferty na własne zlecenie."
    );
  });

  it("pozwala odpowiedzieć innemu użytkownikowi i anonimowemu klientowi", () => {
    expect(isOwnRequestOffer("customer-1", "contractor-1")).toBe(false);
    expect(isOwnRequestOffer(null, "contractor-1")).toBe(false);
  });

  it("prowadzi z panelu wykonawcy do trwałego widoku odpowiedzi", () => {
    expect(getDashboardOfferHref(42)).toBe("/dashboard/offers/42");
  });
});
