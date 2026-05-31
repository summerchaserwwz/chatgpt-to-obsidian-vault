import { describe, expect, it } from "vitest";
import { demoConversations } from "../data/demo";
import { renderPathTemplate } from "./path-template";

describe("renderPathTemplate", () => {
  it("renders Obsidian path tokens", () => {
    const path = renderPathTemplate(
      "AI/ChatGPT/{yyyy}/{MM}/{yyyy-MM-dd} - {safeTitle}.md",
      demoConversations[0],
      new Date("2026-05-29T10:00:00+08:00")
    );

    expect(path).toBe("AI/ChatGPT/2026/05/2026-05-29 - ChatGPT to Obsidian Vault 产品定义.md");
  });
});
