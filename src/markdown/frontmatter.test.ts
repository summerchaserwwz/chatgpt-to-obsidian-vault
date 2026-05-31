import { describe, expect, it } from "vitest";
import { formatFrontmatter } from "./frontmatter";

describe("formatFrontmatter", () => {
  it("renders flat yaml fields and tag arrays", () => {
    const frontmatter = formatFrontmatter({
      source: "chatgpt",
      title: 'A "quoted" title',
      message_count: 3,
      tags: ["ai/chatgpt", "source"]
    });

    expect(frontmatter).toContain('title: "A \\"quoted\\" title"');
    expect(frontmatter).toContain("tags:\n  - ai/chatgpt\n  - source");
  });
});
