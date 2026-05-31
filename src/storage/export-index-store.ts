import type { ExportIndexRecord } from "../shared/types";

const key = "chatvault.exportIndex";

export function readExportIndex(): ExportIndexRecord[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as ExportIndexRecord[]) : [];
  } catch {
    return [];
  }
}

export function upsertExportIndex(record: ExportIndexRecord): void {
  if (typeof localStorage === "undefined") return;
  const records = readExportIndex().filter((item) => item.conversationId !== record.conversationId);
  records.push(record);
  localStorage.setItem(key, JSON.stringify(records));
}
