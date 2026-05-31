import { describe, expect, it } from "vitest";
import { safeTitle } from "./sanitize";

describe("safeTitle", () => {
  it("removes unsafe filename characters and trims whitespace", () => {
    expect(safeTitle(' ChatGPT: "Vault" / Export? ')).toBe("ChatGPT Vault Export");
  });

  it("falls back for empty titles", () => {
    expect(safeTitle("   ")).toBe("Untitled ChatGPT Conversation");
  });
});
