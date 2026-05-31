import { describe, expect, it } from "vitest";
import { demoConversations } from "../data/demo";
import { computeSavePlan } from "./save-plan";

describe("computeSavePlan", () => {
  it("marks unchanged when the source hash matches", () => {
    const plan = computeSavePlan({
      conversation: demoConversations[0],
      targetPath: "AI/demo.md",
      sourceHash: "sha256:same",
      indexRecord: {
        conversationId: demoConversations[0].id ?? "",
        sourceUrl: demoConversations[0].url,
        targetPath: "AI/demo.md",
        title: demoConversations[0].title,
        sourceHash: "sha256:same",
        exportedAt: "2026-05-29T14:30:00+08:00",
        templateId: "source_archive"
      }
    });

    expect(plan.status).toBe("unchanged");
  });

  it("marks conflict when target frontmatter belongs to another conversation", () => {
    const plan = computeSavePlan({
      conversation: demoConversations[0],
      targetPath: "AI/demo.md",
      sourceHash: "sha256:new",
      existingFrontmatterConversationId: "different-id"
    });

    expect(plan.status).toBe("conflict");
  });
});
