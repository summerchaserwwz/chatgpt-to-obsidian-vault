import { describe, expect, it } from "vitest";
import { demoConversations } from "../data/demo";
import type { ExportFormat, ExportSelection } from "../shared/types";
import { applyExportExtension, formatConversationExport } from "./export-formats";

const conversation = demoConversations[0];

function selection(exportFormat: ExportFormat): ExportSelection {
  return {
    conversationId: conversation.id,
    selectedMessageIds: [conversation.messages[0].id],
    templateId: "source_archive",
    exportFormat,
    includeFrontmatter: true,
    includeSourceLink: true,
    includeTranscript: true,
    tags: ["ai/chatgpt"],
    pathTemplate: "AI/{safeTitle}.md",
    writePolicy: "update"
  };
}

describe("formatConversationExport", () => {
  it("formats plain text exports from selected messages", () => {
    const result = formatConversationExport({
      conversation,
      selection: selection("text"),
      exportedAt: "2026-05-31T12:00:00+08:00",
      sourceHash: "sha256:test"
    });

    expect(result.mimeType).toContain("text/plain");
    expect(result.content).toContain("Transcript");
    expect(result.content).toContain(conversation.messages[0].plainText);
    expect(result.content).not.toContain(conversation.messages[1].plainText);
  });

  it("formats structured JSON exports", () => {
    const result = formatConversationExport({
      conversation,
      selection: selection("json"),
      exportedAt: "2026-05-31T12:00:00+08:00",
      sourceHash: "sha256:test"
    });
    const parsed = JSON.parse(result.content);

    expect(parsed.exportFormat).toBe("json");
    expect(parsed.selectedMessageCount).toBe(1);
    expect(parsed.messages[0].id).toBe(conversation.messages[0].id);
  });

  it("formats CSV and browser-readable documents", () => {
    const csv = formatConversationExport({
      conversation,
      selection: selection("csv"),
      exportedAt: "2026-05-31T12:00:00+08:00",
      sourceHash: "sha256:test"
    });
    const html = formatConversationExport({
      conversation,
      selection: selection("html"),
      exportedAt: "2026-05-31T12:00:00+08:00",
      sourceHash: "sha256:test"
    });
    const word = formatConversationExport({
      conversation,
      selection: selection("word"),
      exportedAt: "2026-05-31T12:00:00+08:00",
      sourceHash: "sha256:test"
    });

    expect(csv.content).toContain('"conversation_id","title","source_url"');
    expect(html.content).toContain("<!doctype html>");
    expect(word.extension).toBe("doc");
    expect(word.mimeType).toContain("application/msword");
  });
});

describe("applyExportExtension", () => {
  it("replaces existing file extensions with the selected export extension", () => {
    expect(applyExportExtension("AI/demo.md", "json")).toBe("AI/demo.json");
    expect(applyExportExtension("AI/demo", "word")).toBe("AI/demo.doc");
  });
});
