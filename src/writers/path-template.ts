import type { Conversation } from "../shared/types";
import { safeTitle } from "../shared/sanitize";

export function renderPathTemplate(template: string, conversation: Conversation, date = new Date()): string {
  const yyyy = String(date.getFullYear());
  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const replacements: Record<string, string> = {
    yyyy,
    MM,
    dd,
    "yyyy-MM-dd": `${yyyy}-${MM}-${dd}`,
    safeTitle: safeTitle(conversation.title),
    conversationId: conversation.id ?? "unknown"
  };

  const rendered = template.replace(/\{([^}]+)\}/g, (_, key: string) => replacements[key] ?? "unknown");
  return rendered
    .split("/")
    .map((part) => safeTitle(part))
    .filter(Boolean)
    .join("/");
}
