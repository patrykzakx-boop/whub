import { describe, expect, it } from "vitest";
import {
  formatOfferPrice,
  parseOfferPrice,
  sortOffersByPrice,
} from "@/lib/offerPricing";

describe("offer pricing", () => {
  it("accepts a positive PLN amount with at most two decimal places", () => {
    expect(parseOfferPrice("4500")).toBe(4500);
    expect(parseOfferPrice("4500,50")).toBe(4500.5);
    expect(parseOfferPrice("0")).toBeNull();
    expect(parseOfferPrice("od 4500 zł")).toBeNull();
  });

  it("formats a numeric price and keeps a legacy text fallback", () => {
    expect(formatOfferPrice(4500)).toContain("4");
    expect(formatOfferPrice(null, "od 4 000 zł")).toBe("od 4 000 zł");
  });

  it("sorts priced offers and keeps offers without a number at the end", () => {
    const offers = [
      { id: 1, price_amount: null, created_at: "2026-10-08T10:00:00Z" },
      { id: 2, price_amount: 5200, created_at: "2026-10-08T09:00:00Z" },
      { id: 3, price_amount: "4500", created_at: "2026-10-08T08:00:00Z" },
    ];

    expect(sortOffersByPrice(offers, "price-asc").map(({ id }) => id)).toEqual([
      3, 2, 1,
    ]);
    expect(sortOffersByPrice(offers, "price-desc").map(({ id }) => id)).toEqual([
      2, 3, 1,
    ]);
  });
});
