import type { WriteResult } from "../shared/types";

export async function downloadMarkdown(path: string, markdown: string, mimeType = "text/markdown;charset=utf-8"): Promise<WriteResult> {
  if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
    const response = await chrome.runtime.sendMessage({ type: "download-markdown", path, markdown, mimeType });
    return response as WriteResult;
  }

  const blob = new Blob([markdown], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = path.split("/").pop() ?? "chatgpt-export.md";
  anchor.click();
  URL.revokeObjectURL(url);
  return { ok: true, path, status: "updated", reason: "Downloaded file preview." };
}
