import type { Conversation, ConversationMessage } from "../../shared/types";

const messageSelectors = [
  "[data-message-author-role]",
  'article[data-testid^="conversation-turn-"]',
  '[data-testid^="conversation-turn-"]',
  ".group\\/conversation-turn",
  "[data-message-id]",
  '[data-testid*="message"]'
];

const contentSelectors = [
  ".markdown, .prose, [class*='markdown'], [class*='prose']",
  "[data-message-content], [data-testid*='content']",
  ".whitespace-pre-wrap, [class*='whitespace']"
];

type MessageCandidateSet = {
  strategy: string;
  nodes: HTMLElement[];
};

export function extractCurrentConversation(documentRef: Document = document): Conversation | null {
  const url = window.location.href;
  const title = extractTitle(documentRef);
  const candidateSet = findMessageNodes(documentRef);
  const warnings: string[] = [];

  if (candidateSet.nodes.length === 0) {
    warnings.push("No ChatGPT message containers matched known selectors.");
    return null;
  }

  const seen = new Set<string>();
  const messages = candidateSet.nodes.flatMap((node, index) => {
    const message = extractMessage(node, index, candidateSet.strategy);
    if (!message) return [];

    const signature = normalizeText(`${message.role}:${message.plainText}`).slice(0, 240);
    if (seen.has(signature)) return [];
    seen.add(signature);
    return [message];
  });

  if (messages.length === 0) {
    warnings.push("Message containers were found, but all extracted messages were empty.");
    return null;
  }

  const unreliableCount = messages.filter((message) => message.role === "unknown").length;
  if (unreliableCount > 0) {
    warnings.push(`${unreliableCount} message roles could not be identified reliably.`);
  }

  return {
    source: "chatgpt",
    id: extractConversationId(url),
    url,
    title,
    updatedAt: new Date().toISOString(),
    model: inferModel(documentRef),
    messageCount: messages.length,
    status: "new",
    messages,
    extraction: {
      strategy: candidateSet.strategy,
      warnings
    }
  };
}

function findMessageNodes(documentRef: Document): MessageCandidateSet {
  for (const selector of messageSelectors) {
    const nodes = topLevelElements([...documentRef.querySelectorAll<HTMLElement>(selector)]).filter(isValidMessageNode);
    if (nodes.length > 0) {
      return { strategy: selector, nodes };
    }
  }

  const headingNodes = findRoleHeadingMessageNodes(documentRef);
  if (headingNodes.length > 0) {
    return { strategy: "role-heading", nodes: headingNodes };
  }

  const container = documentRef.querySelector<HTMLElement>("[role='main'], main, [class*='conversation'], [class*='chat']");
  if (!container) return { strategy: "none", nodes: [] };

  return {
    strategy: "main-direct-children",
    nodes: topLevelElements([...container.querySelectorAll<HTMLElement>(":scope > article, :scope > section, :scope > div")]).filter(isValidMessageNode)
  };
}

function findRoleHeadingMessageNodes(documentRef: Document): HTMLElement[] {
  const headings = [...documentRef.querySelectorAll<HTMLElement>("main h1, main h2, main h3, main h4, main h5, main h6, main [class*='sr-only']")]
    .filter((element) => roleFromText(element.textContent || "") !== null);
  const nodes = headings.flatMap((heading) => {
    const node = closestMessageBlockFromHeading(heading);
    return node ? [node] : [];
  });

  return topLevelElements(nodes).filter(isValidMessageNode);
}

function closestMessageBlockFromHeading(heading: HTMLElement): HTMLElement | null {
  const headingText = normalizeText(heading.textContent || "");
  let current = heading.parentElement;
  let best: HTMLElement | null = null;
  let depth = 0;

  while (current && depth < 7 && !safeMatches(current, "main, body")) {
    const text = normalizeText(current.textContent || "");
    const roleHeadingCount = current.querySelectorAll("h1, h2, h3, h4, h5, h6, [class*='sr-only']")
      ? [...current.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6, [class*='sr-only']")]
          .filter((element) => roleFromText(element.textContent || "") !== null).length
      : 0;

    if (text.length > headingText.length + 8 && roleHeadingCount <= 1) {
      best = current;
    }

    current = current.parentElement;
    depth += 1;
  }

  return best;
}

function extractMessage(node: HTMLElement, index: number, selector: string): ConversationMessage | null {
  const role = normalizeRole(
    node.dataset.messageAuthorRole ||
    node.getAttribute("data-author") ||
    node.getAttribute("data-sender"),
    node,
    index
  );
  const contentRoot = selectContentRoot(node);
  const markdown = serializeMessageContent(contentRoot);
  const plainText = normalizeText(contentRoot.innerText || contentRoot.textContent || markdown);
  const warnings: string[] = [];

  if (!markdown || normalizeText(markdown).length < minimumContentLength(contentRoot)) {
    return null;
  }

  if (role === "unknown") warnings.push("Message role inferred as unknown.");

  return {
    id: node.dataset.messageId || node.getAttribute("data-message-id") || `message-${index + 1}`,
    role,
    markdown,
    plainText,
    attachments: extractAttachments(contentRoot),
    sourceNodeHint: node.dataset.messageAuthorRole || selector,
    extractionWarnings: warnings,
    value: markdown.length > 120 || role === "user" ? "high" : "optional"
  };
}

function selectContentRoot(messageNode: HTMLElement): HTMLElement {
  const candidates = [messageNode];

  for (const selector of contentSelectors) {
    if (safeMatches(messageNode, selector)) candidates.push(messageNode);
    candidates.push(...messageNode.querySelectorAll<HTMLElement>(selector));
  }

  return candidates
    .filter(Boolean)
    .sort((a, b) => meaningfulScore(b) - meaningfulScore(a))[0] || messageNode;
}

function meaningfulScore(element: HTMLElement): number {
  return normalizeText(element.textContent || "").length +
    element.querySelectorAll("pre, code-block, table, img, canvas, video, audio, annotation, script[type^='math/tex']").length * 200;
}

function isValidMessageNode(node: HTMLElement): boolean {
  const textLength = normalizeText(node.textContent || "").length;
  const richCount = node.querySelectorAll("pre, code-block, table, img, canvas, video, audio, annotation, script[type^='math/tex']").length;

  if (textLength < 5 && richCount === 0) return false;
  if (textLength > 200_000) return false;
  if (safeMatches(node, "nav, aside, header, footer, form, menu")) return false;
  if (node.querySelector("textarea, input[type='text'], [contenteditable='true']") && !node.hasAttribute("data-message-author-role")) return false;
  if (/\b(typing|loading|spinner)\b/i.test(className(node))) return false;
  return true;
}

function serializeMessageContent(element: HTMLElement): string {
  const clone = element.cloneNode(true) as HTMLElement;

  removeUiElements(clone);
  processCards(clone);
  processCodeBlocks(clone);
  processMath(clone);
  processMedia(clone);
  processLinks(clone);
  processTables(clone);

  return cleanMarkdown(serializeMarkdownChildren(clone));
}

function removeUiElements(clone: HTMLElement): void {
  const uiSelector = [
    "button",
    "svg",
    "style",
    "script:not([type^='math/tex'])",
    "textarea",
    "input",
    "[contenteditable='true']",
    "[class*='regenerate']",
    "[class*='copy-button']",
    "[data-testid*='copy']",
    "[data-test-id*='copy']",
    "[aria-label*='Copy']",
    "[aria-label*='copy']",
    "[aria-label*='More']",
    "[aria-label*='more']"
  ].join(",");

  clone.querySelectorAll(uiSelector).forEach((item) => item.remove());
}

function processCodeBlocks(clone: HTMLElement): void {
  topLevelElements([...clone.querySelectorAll<HTMLElement>("pre, code-block, [data-testid*='code-block'], [data-test-id*='code-block']")]).forEach((block) => {
    const { lang, code } = extractCodeBlock(block);
    block.replaceWith(createTextNode(block, `\n\n\`\`\`${lang}\n${code}\n\`\`\`\n\n`));
  });
}

function extractCodeBlock(block: HTMLElement): { lang: string; code: string } {
  const cloned = block.cloneNode(true) as HTMLElement;
  const lang = detectLanguage(cloned);

  cloned.querySelectorAll("button, svg, [aria-label*='Copy'], [aria-label*='copy'], [class*='sticky'], [class*='code-header'], [data-testid*='copy'], [data-test-id*='copy'], [slot='header']")
    .forEach((item) => item.remove());

  const cmContent = cloned.querySelector<HTMLElement>(".cm-content");
  if (cmContent) {
    const cmLines = [...cmContent.querySelectorAll<HTMLElement>(".cm-line")];
    if (cmLines.length > 0) {
      return { lang, code: normalizeCodeText(cmLines.map((line) => line.textContent || "").join("\n")) };
    }
    return { lang, code: normalizeCodeText(textWithBreaks(cmContent)) };
  }

  const codeElement = safeMatches(cloned, "code") ? cloned : cloned.querySelector<HTMLElement>("code");
  return { lang, code: normalizeCodeText(textWithBreaks(codeElement || cloned)) };
}

function detectLanguage(block: HTMLElement): string {
  const codeElement = safeMatches(block, "code") ? block : block.querySelector<HTMLElement>("code");
  const sources = [
    codeElement ? className(codeElement) : "",
    block.getAttribute("data-language"),
    block.getAttribute("language"),
    block.getAttribute("lang"),
    codeElement?.getAttribute("data-language"),
    codeElement?.getAttribute("language"),
    codeElement?.getAttribute("lang"),
    block.getAttribute("aria-label")
  ].filter(Boolean).map(String);

  for (const source of sources) {
    const languageMatch = source.match(/language-([a-zA-Z0-9_+#.-]+)/);
    if (languageMatch) return languageMatch[1].toLowerCase();
    if (/^[a-zA-Z0-9_+#.-]{1,24}$/.test(source) && !/^(code|copy|download)$/i.test(source)) {
      return source.toLowerCase();
    }
  }

  const header = block.querySelector<HTMLElement>("[class*='sticky'], [class*='code-header'], [data-testid*='code'], [data-test-id*='code'], .code-language, .code-lang, [slot='header']");
  const headerText = normalizeText(header?.innerText || header?.textContent || "").replace(/\b(copy|code|download|run)\b/gi, "").trim();
  return headerText && headerText.length < 32 && !headerText.includes("\n") ? headerText.toLowerCase() : "";
}

function processMath(clone: HTMLElement): void {
  const processed = new Set<Element>();

  clone.querySelectorAll("annotation").forEach((annotation) => {
    const encoding = (annotation.getAttribute("encoding") || "").toLowerCase();
    if (!encoding.includes("tex") && !encoding.includes("latex")) return;

    const tex = annotation.textContent?.trim();
    if (!tex) return;

    const displayRoot = annotation.closest(".katex-display, mjx-container[display='true'], [display='block']");
    const mathRoot = displayRoot || annotation.closest(".katex") || annotation.closest("mjx-container") || annotation.closest("math");
    if (!mathRoot || processed.has(mathRoot)) return;

    processed.add(mathRoot);
    mathRoot.replaceWith(createTextNode(mathRoot, displayRoot ? `\n\n$$${tex}$$\n\n` : `$${tex}$`));
  });

  clone.querySelectorAll<HTMLScriptElement>("script[type^='math/tex']").forEach((script) => {
    const tex = script.textContent?.trim();
    if (!tex) return;
    script.replaceWith(createTextNode(script, /mode=display/.test(script.type) ? `\n\n$$${tex}$$\n\n` : `$${tex}$`));
  });
}

function processMedia(clone: HTMLElement): void {
  clone.querySelectorAll<HTMLElement>("img, canvas, video, audio").forEach((item) => {
    const tag = item.tagName.toLowerCase();
    const alt = normalizeText(item.getAttribute("alt") || item.getAttribute("aria-label") || item.getAttribute("title") || "");
    const label = tag === "img" && alt ? `[Image: ${alt}]`
      : tag === "img" ? "[Image]"
      : tag === "canvas" ? "[Canvas or chart]"
      : tag === "video" ? "[Video]"
      : tag === "audio" ? "[Audio]"
      : "[Media]";
    item.replaceWith(createTextNode(item, label));
  });
}

function processLinks(clone: HTMLElement): void {
  clone.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((link) => {
    if (link.closest("pre, code, code-block")) return;
    const href = String(link.href || link.getAttribute("href") || "").trim();
    if (isUnsafeHref(href)) return;

    const text = normalizeText(link.textContent || "") || href;
    link.replaceWith(createTextNode(link, `[${escapeMarkdownLinkText(text)}](${escapeMarkdownUrl(href)})`));
  });
}

function processTables(clone: HTMLElement): void {
  topLevelElements([...clone.querySelectorAll<HTMLTableElement>("table")]).forEach((table) => {
    table.replaceWith(createTextNode(table, `\n\n${tableToMarkdown(table)}\n\n`));
  });
}

function processCards(clone: HTMLElement): void {
  const cards = topLevelElements([...clone.querySelectorAll<HTMLElement>("*")].filter((element) => {
    const kind = cardSignal(element);
    if (!kind) return false;
    if (safeMatches(element, "[data-message-author-role]")) return false;
    if (element.closest("pre, code, code-block, table")) return false;
    if (element.querySelector("pre, code-block, table")) return false;

    const text = normalizeText(element.innerText || element.textContent || "");
    const label = cardLabel(element);
    return Boolean(label || text) && text.length <= 240;
  }));

  cards.forEach((card) => {
    const kind = cardSignal(card);
    const label = cardLabel(card);
    card.replaceWith(createTextNode(card, label ? `[${kind}: ${label}]` : `[${kind}]`));
  });
}

function cardSignal(element: HTMLElement): "Artifact" | "File" | "" {
  const signal = [
    element.tagName,
    className(element),
    element.getAttribute("data-testid"),
    element.getAttribute("data-test-id"),
    element.getAttribute("aria-label"),
    element.getAttribute("role")
  ].filter(Boolean).join(" ").toLowerCase();

  if (/\b(artifact|canvas-preview|generated-file|download-card|attachment|file-card)\b/.test(signal)) {
    return signal.includes("artifact") || signal.includes("canvas-preview") ? "Artifact" : "File";
  }
  if (/(^|[\s_-])(attachment|file)([\s_-]|$)/.test(signal)) return "File";
  return "";
}

function cardLabel(element: HTMLElement): string {
  const candidates = [
    element.getAttribute("aria-label"),
    element.getAttribute("title"),
    element.getAttribute("download"),
    element.getAttribute("data-filename"),
    element.innerText || element.textContent
  ].filter(Boolean).map((value) => normalizeText(value || ""));

  return (candidates.find((value) => value && value.length <= 180) || "")
    .replace(/\b(open|download|preview|file|attachment|artifact)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function serializeMarkdownChildren(element: Element, context: { listType?: string; index?: number; depth?: number } = {}): string {
  return [...element.childNodes].map((node, index) => serializeMarkdownNode(node, { ...context, index })).join("");
}

function serializeMarkdownNode(node: ChildNode, context: { listType?: string; index?: number; depth?: number } = {}): string {
  if (node.nodeType === Node.TEXT_NODE) {
    const value = node.nodeValue || "";
    if (value.includes("```") || value.includes("| ---") || /^\s*\[[^\]]+\]/.test(value)) return value;
    return value.replace(/[ \t\r\n]+/g, " ");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const element = node as HTMLElement;
  const tag = element.tagName.toLowerCase();
  if (["script", "style", "button", "svg"].includes(tag)) return "";
  if (tag === "br") return "\n";

  if (/^h[1-6]$/.test(tag)) {
    const content = serializeMarkdownChildren(element, context).trim();
    return content ? `\n\n${"#".repeat(Number(tag.slice(1)))} ${content}\n\n` : "";
  }

  if (tag === "p") {
    const content = serializeMarkdownChildren(element, context).trim();
    return content ? `\n\n${content}\n\n` : "";
  }

  if (tag === "blockquote") {
    const content = serializeMarkdownChildren(element, context).trim();
    return content ? `\n\n${content.split("\n").map((line) => `> ${line.trim()}`).join("\n")}\n\n` : "";
  }

  if (tag === "ul" || tag === "ol") {
    const children = [...element.children].filter((child) => child.tagName.toLowerCase() === "li");
    return `\n${children.map((child, index) => serializeMarkdownNode(child, { ...context, listType: tag, index, depth: context.depth || 0 })).join("")}\n`;
  }

  if (tag === "li") {
    const depth = context.depth || 0;
    const marker = context.listType === "ol" ? `${(context.index || 0) + 1}. ` : "- ";
    const indent = "  ".repeat(depth);
    const content = serializeMarkdownChildren(element, { ...context, depth: depth + 1 }).trim();
    return content ? `${indent}${marker}${content.replace(/\n+/g, `\n${indent}  `)}\n` : "";
  }

  if (["strong", "b"].includes(tag)) {
    const content = serializeMarkdownChildren(element, context).trim();
    return content ? `**${content}**` : "";
  }

  if (["em", "i"].includes(tag)) {
    const content = serializeMarkdownChildren(element, context).trim();
    return content ? `*${content}*` : "";
  }

  if (tag === "code") {
    const content = textWithBreaks(element).replace(/\\/g, "\\\\").replace(/`/g, "\\`").trim();
    return content ? `\`${content}\`` : "";
  }

  const content = serializeMarkdownChildren(element, context);
  return ["div", "section", "article", "main", "span"].includes(tag) ? content : content;
}

function tableToMarkdown(table: HTMLTableElement): string {
  const rows = [...table.querySelectorAll("tr")]
    .map((row) => [...row.children]
      .filter((cell) => ["TH", "TD"].includes(cell.tagName))
      .map((cell) => tableCellText(cell as HTMLElement)))
    .filter((row) => row.length > 0);

  if (rows.length === 0) return normalizeText(table.innerText || table.textContent || "");

  const width = Math.max(...rows.map((row) => row.length));
  const normalizedRows = rows.map((row) => row.concat(Array(Math.max(0, width - row.length)).fill(" ")));
  const header = normalizedRows[0];
  const separator = header.map(() => "---");
  const body = normalizedRows.slice(1);

  return [
    `| ${header.join(" | ")} |`,
    `| ${separator.join(" | ")} |`,
    ...body.map((row) => `| ${row.join(" | ")} |`)
  ].join("\n");
}

function tableCellText(cell: HTMLElement): string {
  return normalizeText(cell.innerText || cell.textContent || "").replace(/\\/g, "\\\\").replace(/\|/g, "\\|") || " ";
}

function extractAttachments(node: HTMLElement): ConversationMessage["attachments"] {
  const images = [...node.querySelectorAll<HTMLImageElement>("img")].map((image) => ({
    type: "image" as const,
    url: image.currentSrc || image.src,
    alt: image.alt
  }));
  const links = [...node.querySelectorAll<HTMLAnchorElement>("a[href]")].map((link) => ({
    type: "link" as const,
    url: link.href,
    filename: link.textContent?.trim() || link.href
  }));
  return [...images, ...links];
}

function extractTitle(documentRef: Document): string {
  const selectors = ["main h1:not([class*='hidden'])", "[class*='conversation-title']", "[data-testid*='conversation-title']"];
  for (const selector of selectors) {
    const title = documentRef.querySelector(selector)?.textContent?.trim();
    if (title && !/^(chatgpt|new chat|untitled|chat)$/i.test(title)) return title;
  }

  const title = documentRef.title.replace("ChatGPT", "").replace("|", "").trim();
  return title || "Untitled ChatGPT Conversation";
}

function normalizeRole(role: string | undefined | null, element: HTMLElement, index: number): ConversationMessage["role"] {
  const lower = role?.toLowerCase();
  if (lower === "user" || lower === "assistant" || lower === "system" || lower === "tool") return lower;
  if (lower === "model" || lower === "bot" || lower === "chatgpt") return "assistant";

  const signal = [className(element), element.getAttribute("aria-label"), element.getAttribute("data-testid"), element.getAttribute("data-test-id")]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (/\b(user|human|query)\b/.test(signal)) return "user";
  if (/\b(assistant|model|response|chatgpt)\b/.test(signal)) return "assistant";

  const headingRole = roleFromText(element.textContent || "");
  if (headingRole) return headingRole;
  const childHeadingRole = [...element.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6, [class*='sr-only']")]
    .map((heading) => roleFromText(heading.textContent || ""))
    .find(Boolean);
  if (childHeadingRole) return childHeadingRole;

  return index % 2 === 0 ? "user" : "assistant";
}

function roleFromText(text: string): ConversationMessage["role"] | null {
  const normalized = normalizeText(text).replace(/[:：]\s*$/, "").toLowerCase();
  if (/^(你说|you said|you)$/.test(normalized)) return "user";
  if (/^(chatgpt 说|chatgpt said|assistant|chatgpt)$/.test(normalized)) return "assistant";
  return null;
}

function minimumContentLength(element: HTMLElement): number {
  return element.querySelector("pre, code-block, table, img, canvas, video, audio") ? 3 : 10;
}

function topLevelElements<T extends Element>(elements: T[]): T[] {
  return elements.filter((element) => !elements.some((other) => other !== element && other.contains(element)));
}

function textWithBreaks(element: Element): string {
  if (element instanceof HTMLElement && element.innerText.trim()) {
    return element.innerText.replace(/\u00a0/g, " ").replace(/\n{3,}/g, "\n\n").trimEnd();
  }
  return collectTextWithBreaks(element).replace(/\n{3,}/g, "\n\n").trimEnd();
}

function collectTextWithBreaks(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue || "";
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const element = node as HTMLElement;
  const tag = element.tagName.toLowerCase();
  if (tag === "br") return "\n";
  if (["script", "style", "button", "svg"].includes(tag)) return "";

  const isBlock = ["div", "p", "li", "tr", "section", "article"].includes(tag);
  return `${isBlock ? "\n" : ""}${[...node.childNodes].map(collectTextWithBreaks).join("")}${isBlock ? "\n" : ""}`;
}

function normalizeText(text: string): string {
  return text.replace(/\u00a0/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function normalizeCodeText(text: string): string {
  return text.replace(/\r\n?/g, "\n").replace(/^\n+/, "").replace(/\n+$/, "");
}

function cleanMarkdown(markdown: string): string {
  return markdown
    .split(/(```[\s\S]*?```)/g)
    .map((part) => part.startsWith("```")
      ? part
      : part
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n[ \t]+/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&"))
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function createTextNode(reference: Element, value: string): Text {
  return reference.ownerDocument.createTextNode(value);
}

function className(element: Element): string {
  const value = element.getAttribute("class");
  if (!value) return "";
  return value;
}

function safeMatches(element: Element, selector: string): boolean {
  try {
    return element.matches(selector);
  } catch {
    return false;
  }
}

function escapeMarkdownLinkText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/([\[\]])/g, "\\$1");
}

function escapeMarkdownUrl(value: string): string {
  return value.replace(/\\/g, "%5C").replace(/\)/g, "%29");
}

function isUnsafeHref(href: string): boolean {
  const lower = href.trim().toLowerCase();
  return !lower || lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:") || lower.startsWith("#");
}

function extractConversationId(url: string): string | null {
  const match = url.match(/\/c\/([^/?#]+)/);
  return match?.[1] ?? null;
}

function inferModel(documentRef: Document): string | undefined {
  const text = documentRef.body.innerText;
  const match = text.match(/\bGPT-[45][\w.-]*/i);
  return match?.[0];
}
