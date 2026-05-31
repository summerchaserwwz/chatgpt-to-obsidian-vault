import { formatConversationMarkdown } from "../markdown/format-conversation";
import type { Conversation, ConversationMessage, ExportFormat, ExportSelection } from "../shared/types";

export type ExportFormatDefinition = {
  id: ExportFormat;
  label: string;
  extension: string;
  mimeType: string;
  description: string;
};

export type FormattedExport = {
  content: string;
  extension: string;
  mimeType: string;
};

type FormatInput = {
  conversation: Conversation;
  selection: ExportSelection;
  exportedAt: string;
  sourceHash: string;
};

export const exportFormatOptions: ExportFormatDefinition[] = [
  {
    id: "markdown",
    label: "Markdown",
    extension: "md",
    mimeType: "text/markdown;charset=utf-8",
    description: "Obsidian 优先，保留 frontmatter 和模板结构。"
  },
  {
    id: "text",
    label: "Text",
    extension: "txt",
    mimeType: "text/plain;charset=utf-8",
    description: "纯文本转写，适合复制、检索和长期归档。"
  },
  {
    id: "json",
    label: "JSON",
    extension: "json",
    mimeType: "application/json;charset=utf-8",
    description: "结构化数据，适合二次处理和自动化。"
  },
  {
    id: "csv",
    label: "CSV",
    extension: "csv",
    mimeType: "text/csv;charset=utf-8",
    description: "按消息拆成表格行，适合表格工具分析。"
  },
  {
    id: "html",
    label: "HTML",
    extension: "html",
    mimeType: "text/html;charset=utf-8",
    description: "可浏览的单文件文档，适合保留阅读层级。"
  },
  {
    id: "word",
    label: "Word",
    extension: "doc",
    mimeType: "application/msword;charset=utf-8",
    description: "Word 可打开的 HTML 文档，适合编辑和交付。"
  }
];

export function getExportFormat(format: ExportFormat): ExportFormatDefinition {
  return exportFormatOptions.find((option) => option.id === format) ?? exportFormatOptions[0];
}

export function formatConversationExport(input: FormatInput): FormattedExport {
  const format = getExportFormat(input.selection.exportFormat);
  if (format.id === "markdown") {
    return {
      content: formatConversationMarkdown(input),
      extension: format.extension,
      mimeType: format.mimeType
    };
  }

  if (format.id === "text") {
    return { content: formatText(input), extension: format.extension, mimeType: format.mimeType };
  }

  if (format.id === "json") {
    return { content: formatJson(input), extension: format.extension, mimeType: format.mimeType };
  }

  if (format.id === "csv") {
    return { content: formatCsv(input), extension: format.extension, mimeType: format.mimeType };
  }

  if (format.id === "word") {
    return { content: formatHtml(input, true), extension: format.extension, mimeType: format.mimeType };
  }

  return { content: formatHtml(input, false), extension: format.extension, mimeType: format.mimeType };
}

export function applyExportExtension(path: string, format: ExportFormat): string {
  const { extension } = getExportFormat(format);
  const slashIndex = path.lastIndexOf("/");
  const dotIndex = path.lastIndexOf(".");
  if (dotIndex > slashIndex) {
    return `${path.slice(0, dotIndex)}.${extension}`;
  }
  return `${path}.${extension}`;
}

function selectedMessages(conversation: Conversation, selection: ExportSelection): ConversationMessage[] {
  return conversation.messages.filter((message) => selection.selectedMessageIds.includes(message.id));
}

function formatText({ conversation, selection, exportedAt, sourceHash }: FormatInput): string {
  const selected = selectedMessages(conversation, selection);
  const lines = [
    conversation.title,
    "",
    `Source: ${conversation.url}`,
    `Conversation ID: ${conversation.id ?? "unknown"}`,
    `Exported at: ${exportedAt}`,
    `Source hash: ${sourceHash}`,
    `Selected messages: ${selected.length}/${conversation.messages.length}`,
    "",
    "Transcript",
    "=========="
  ];

  for (const [index, message] of selected.entries()) {
    lines.push("", `${index + 1}. ${labelRole(message.role)}`, message.plainText.trim(), `Message ID: ${message.id}`);
  }

  return `${lines.join("\n")}\n`;
}

function formatJson({ conversation, selection, exportedAt, sourceHash }: FormatInput): string {
  const selected = selectedMessages(conversation, selection);
  return `${JSON.stringify(
    {
      source: "chatgpt",
      title: conversation.title,
      conversationId: conversation.id,
      sourceUrl: conversation.url,
      createdAt: conversation.createdAt,
      exportedAt,
      model: conversation.model,
      templateId: selection.templateId,
      exportFormat: selection.exportFormat,
      writePolicy: selection.writePolicy,
      sourceHash,
      messageCount: conversation.messages.length,
      selectedMessageCount: selected.length,
      messages: selected.map((message) => ({
        id: message.id,
        role: message.role,
        authorName: message.authorName,
        createdAt: message.createdAt,
        markdown: message.markdown,
        plainText: message.plainText,
        attachments: message.attachments,
        value: message.value
      }))
    },
    null,
    2
  )}\n`;
}

function formatCsv({ conversation, selection, exportedAt, sourceHash }: FormatInput): string {
  const selected = selectedMessages(conversation, selection);
  const rows = [
    ["conversation_id", "title", "source_url", "exported_at", "source_hash", "message_index", "message_id", "role", "plain_text"],
    ...selected.map((message, index) => [
      conversation.id ?? "unknown",
      conversation.title,
      conversation.url,
      exportedAt,
      sourceHash,
      String(index + 1),
      message.id,
      message.role,
      message.plainText
    ])
  ];

  return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

function formatHtml(input: FormatInput, wordCompatible: boolean): string {
  const { conversation, selection, exportedAt, sourceHash } = input;
  const selected = selectedMessages(conversation, selection);
  const transcript = selected.map((message, index) => `
      <section class="message message-${escapeHtml(message.role)}">
        <h2>${index + 1}. ${escapeHtml(labelRole(message.role))}</h2>
        <pre>${escapeHtml(message.markdown.trim())}</pre>
        <p class="message-id">Message ID: <code>${escapeHtml(message.id)}</code></p>
      </section>`).join("\n");

  const officeXml = wordCompatible
    ? "<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->"
    : "";

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(conversation.title)}</title>
  ${officeXml}
  <style>
    body { color: #111827; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.62; margin: 40px auto; max-width: 860px; padding: 0 24px; }
    h1 { font-size: 30px; line-height: 1.2; }
    h2 { border-bottom: 1px solid #e5e7eb; font-size: 18px; margin-top: 28px; padding-bottom: 6px; }
    .meta { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 16px; }
    .message { margin-top: 24px; }
    pre { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; overflow-wrap: anywhere; padding: 14px; white-space: pre-wrap; }
    .message-id { color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(conversation.title)}</h1>
  <div class="meta">
    <p><strong>Source:</strong> ${escapeHtml(conversation.url)}</p>
    <p><strong>Conversation ID:</strong> ${escapeHtml(conversation.id ?? "unknown")}</p>
    <p><strong>Exported at:</strong> ${escapeHtml(exportedAt)}</p>
    <p><strong>Source hash:</strong> ${escapeHtml(sourceHash)}</p>
    <p><strong>Selected messages:</strong> ${selected.length}/${conversation.messages.length}</p>
  </div>
  ${transcript}
</body>
</html>
`;
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""').replace(/\r?\n/g, "\n")}"`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function labelRole(role: string): string {
  if (role === "user") return "User";
  if (role === "assistant") return "Assistant";
  if (role === "system") return "System";
  if (role === "tool") return "Tool";
  return "Unknown";
}
