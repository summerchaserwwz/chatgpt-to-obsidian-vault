import { formatFrontmatter } from "./frontmatter";
import { getTemplate } from "./templates";
import type { Conversation, ExportSelection } from "../shared/types";

type FormatInput = {
  conversation: Conversation;
  selection: ExportSelection;
  exportedAt: string;
  sourceHash: string;
};

export function formatConversationMarkdown({ conversation, selection, exportedAt, sourceHash }: FormatInput): string {
  const selected = conversation.messages.filter((message) => selection.selectedMessageIds.includes(message.id));
  const template = getTemplate(selection.templateId);
  const parts: string[] = [];

  if (selection.includeFrontmatter) {
    parts.push(
      formatFrontmatter({
        source: "chatgpt",
        title: conversation.title,
        conversation_id: conversation.id ?? "unknown",
        source_url: conversation.url,
        created_at: conversation.createdAt,
        exported_at: exportedAt,
        model: conversation.model,
        message_count: conversation.messages.length,
        selected_message_count: selected.length,
        template: selection.templateId,
        write_policy: selection.writePolicy,
        source_hash: sourceHash,
        chatvault_status: conversation.status ?? "new",
        tags: selection.tags
      })
    );
  }

  parts.push(`# ${conversation.title}`);

  if (selection.includeSourceLink) {
    parts.push(
      [
        "## Source",
        "",
        `- ChatGPT: ${conversation.url}`,
        `- Conversation ID: \`${conversation.id ?? "unknown"}\``,
        `- Export template: ${template.name}`,
        `- Selected messages: ${selected.length} / ${conversation.messages.length}`
      ].join("\n")
    );
  }

  if (selection.templateId === "decision_record") {
    parts.push("## Decision Context\n\n- Background:\n- Options considered:\n- Decision:\n- Follow-up:");
  }

  if (selection.templateId === "research_note") {
    parts.push("## Research Notes\n\n- Findings:\n- Sources to verify:\n- Open questions:");
  }

  if (selection.templateId === "coding_debug") {
    parts.push("## Debug Log\n\n- Symptom:\n- Hypothesis:\n- Change:\n- Verification:");
  }

  if (selection.includeTranscript) {
    const transcript = selected.map((message, index) => {
      const role = labelRole(message.role);
      return [`## ${index + 1}. ${role}`, "", message.markdown.trim(), "", `Message ID: \`${message.id}\``].join("\n");
    });
    parts.push(["## Transcript", "", ...transcript].join("\n"));
  }

  return `${parts.join("\n\n")}\n`;
}

function labelRole(role: string): string {
  if (role === "user") return "User";
  if (role === "assistant") return "Assistant";
  if (role === "system") return "System";
  if (role === "tool") return "Tool";
  return "Unknown";
}
