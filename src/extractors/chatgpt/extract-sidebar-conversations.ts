import type { ConversationSummary } from "../../shared/types";

const sidebarScrollLimit = 180;
const sidebarScrollDelayMs = 120;
const conversationUrlPattern = /\/c\/([^/?#]+)/;
const conversationCandidateSelector = [
  'a[href*="/c/"]',
  '[href*="/c/"]',
  '[data-href*="/c/"]',
  '[data-url*="/c/"]',
  '[data-testid*="history-item"]',
  '[data-testid*="conversation"]',
  '[data-dd-action-name*="conversation"]',
  '[role="link"]'
].join(",");

export function extractSidebarConversations(documentRef: Document = document): ConversationSummary[] {
  const candidates = [...documentRef.querySelectorAll<HTMLElement>(conversationCandidateSelector)];
  const seen = new Set<string>();

  return candidates.reduce<ConversationSummary[]>((items, candidate) => {
    const href = getConversationHref(candidate);
    if (!href) return items;

    const url = new URL(href, window.location.href).toString();
    const id = url.match(conversationUrlPattern)?.[1] ?? null;
    const title = getConversationTitle(candidate, id);
    if (!id || !title || seen.has(id)) return items;
    seen.add(id);
    items.push({
      source: "chatgpt",
      id,
      url,
      title,
      status: "new"
    });
    return items;
  }, []);
}

export async function extractSidebarConversationsDeep(documentRef: Document = document): Promise<ConversationSummary[]> {
  const scrollRoot = findSidebarScrollRoot(documentRef);
  if (!scrollRoot) return extractSidebarConversations(documentRef);

  const originalTop = scrollRoot.scrollTop;
  const seen = new Map<string, ConversationSummary>();
  const seenCounts: number[] = [];
  let stableIterations = 0;

  scrollRoot.scrollTop = 0;
  await wait(sidebarScrollDelayMs);

  for (let index = 0; index < sidebarScrollLimit; index += 1) {
    collectSidebarSummaries(seen, extractSidebarConversations(documentRef));
    seenCounts.push(seen.size);

    const before = scrollRoot.scrollTop;
    scrollRoot.scrollBy({ top: Math.max(320, Math.floor(scrollRoot.clientHeight * 0.82)), behavior: "instant" });
    await wait(sidebarScrollDelayMs);

    const after = scrollRoot.scrollTop;
    const isCountStable = seenCounts.length >= 2 && seenCounts[seenCounts.length - 1] === seenCounts[seenCounts.length - 2];
    const isScrollStable = after === before;
    stableIterations = isCountStable && isScrollStable ? stableIterations + 1 : 0;
    if (stableIterations >= 3) break;
  }

  scrollRoot.scrollTop = originalTop;
  collectSidebarSummaries(seen, extractSidebarConversations(documentRef));
  return [...seen.values()];
}

function collectSidebarSummaries(target: Map<string, ConversationSummary>, summaries: ConversationSummary[]): void {
  for (const summary of summaries) {
    const key = summary.id ?? summary.url;
    if (!key || target.has(key)) continue;
    target.set(key, summary);
  }
}

function findSidebarScrollRoot(documentRef: Document): HTMLElement | null {
  const firstConversationLink = documentRef.querySelector<HTMLElement>(conversationCandidateSelector);
  const candidates = [
    firstConversationLink ? closestScrollable(firstConversationLink) : null,
    documentRef.querySelector<HTMLElement>("nav"),
    documentRef.querySelector<HTMLElement>("aside"),
    documentRef.querySelector<HTMLElement>("[data-testid*='sidebar']"),
    documentRef.querySelector<HTMLElement>("[class*='sidebar']")
  ].filter(Boolean) as HTMLElement[];

  return candidates
    .filter((element) => element.scrollHeight > element.clientHeight + 24)
    .sort((a, b) => (b.scrollHeight - b.clientHeight) - (a.scrollHeight - a.clientHeight))[0] ?? null;
}

function getConversationHref(element: HTMLElement): string | null {
  const direct = [
    element.getAttribute("href"),
    element.getAttribute("data-href"),
    element.getAttribute("data-url")
  ].find((value) => value && conversationUrlPattern.test(value));
  if (direct) return direct;

  const anchor = safeMatches(element, 'a[href*="/c/"]')
    ? element
    : element.querySelector<HTMLElement>('a[href*="/c/"]') ?? element.closest<HTMLElement>('a[href*="/c/"]');
  return anchor?.getAttribute("href") ?? null;
}

function getConversationTitle(element: HTMLElement, id: string | null): string {
  const title = [
    element.getAttribute("aria-label"),
    element.getAttribute("title"),
    element.querySelector<HTMLElement>("[class*='title' i], [class*='heading' i], strong, b")?.textContent,
    element.textContent
  ].find((value) => value && normalizeTitle(value));

  return normalizeTitle(title ?? "") || (id ? `ChatGPT Conversation ${id}` : "");
}

function normalizeTitle(value: string): string {
  return value.replace(/\s+/g, " ").replace(/\b(more|options|rename|archive|delete)\b/gi, "").trim();
}

function safeMatches(element: Element, selector: string): boolean {
  try {
    return element.matches(selector);
  } catch {
    return false;
  }
}

function closestScrollable(element: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = element;
  while (current) {
    if (current.scrollHeight > current.clientHeight + 24) return current;
    current = current.parentElement;
  }
  return null;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
