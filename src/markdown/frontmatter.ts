type FrontmatterValue = string | number | boolean | string[] | undefined | null;

export function escapeYamlString(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export function formatFrontmatter(fields: Record<string, FrontmatterValue>): string {
  const lines = ["---"];

  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) {
        lines.push(`  - ${String(item)}`);
      }
      continue;
    }

    if (typeof value === "string") {
      lines.push(`${key}: ${escapeYamlString(value)}`);
      continue;
    }

    lines.push(`${key}: ${String(value)}`);
  }

  lines.push("---");
  return lines.join("\n");
}
