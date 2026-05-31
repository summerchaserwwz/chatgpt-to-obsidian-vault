import { describe, expect, it } from "vitest";
import { demoConversations } from "../data/demo";
import { formatConversationMarkdown } from "./format-conversation";

describe("formatConversationMarkdown", () => {
  it("only includes selected messages in the transcript", () => {
    const conversation = demoConversations[0];
    const markdown = formatConversationMarkdown({
      conversation,
      exportedAt: "2026-05-29T14:30:00+08:00",
      sourceHash: "sha256:test",
      selection: {
        conversationId: conversation.id,
        selectedMessageIds: [conversation.messages[0].id],
        templateId: "source_archive",
        exportFormat: "markdown",
        includeFrontmatter: true,
        includeSourceLink: true,
        includeTranscript: true,
        tags: ["ai/chatgpt"],
        pathTemplate: "AI/{safeTitle}.md",
        writePolicy: "update"
      }
    });

    expect(markdown).toContain("selected_message_count: 1");
    expect(markdown).toContain(conversation.messages[0].markdown);
    expect(markdown).not.toContain(conversation.messages[1].markdown);
  });
});
