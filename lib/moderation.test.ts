import { describe, expect, it } from "vitest";
import { parseModerationAction, parseReportInput } from "./moderation";

describe("moderation input", () => {
  it("accepts a valid abuse report", () => {
    expect(parseReportInput({ targetType: "company", targetId: 12, reason: "Spam" }))
      .toEqual({ targetType: "company", targetId: 12, reason: "Spam", details: null });
  });

  it("rejects an invalid target", () => {
    expect(() => parseReportInput({ targetType: "user", targetId: 1, reason: "Spam" }))
      .toThrow("Nieprawidłowy rodzaj");
  });

  it("only accepts known admin actions", () => {
    expect(() => parseModerationAction({ action: "delete_everything", targetId: 1 }))
      .toThrow("Nieprawidłowa operacja");
  });
});
