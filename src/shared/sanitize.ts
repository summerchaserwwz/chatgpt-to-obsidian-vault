const unsafeFilenameChars = /[<>:"/\\|?*\u0000-\u001F]/g;

export function safeTitle(input: string): string {
  const normalized = input
    .normalize("NFKC")
    .replace(unsafeFilenameChars, " ")
    .replace(/\s+/g, " ")
    .trim();

  const title = normalized.length > 0 ? normalized : "Untitled ChatGPT Conversation";
  return title.slice(0, 96).replace(/[. ]+$/g, "");
}

export function normalizePathPart(input: string): string {
  return safeTitle(input).replace(/\s+/g, "-");
}

export function clampText(input: string, maxLength: number): string {
  if (input.length <= maxLength) return input;
  return `${input.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}
