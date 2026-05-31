import { describe, expect, it, vi } from "vitest";
import { extractSidebarConversationsDeep } from "./extract-sidebar-conversations";

type FakeLink = {
  href: string;
  textContent: string;
  parentElement: FakeScrollRoot | null;
  getAttribute: (name: string) => string | null;
  querySelector: () => null;
  closest: () => null;
  matches: (selector: string) => boolean;
};

class FakeScrollRoot {
  scrollTop = 0;
  scrollHeight = 1_200;
  clientHeight = 320;
  parentElement = null;

  constructor(private readonly advance: () => void) {}

  scrollBy() {
    this.scrollTop += 320;
    this.advance();
  }
}

describe("extractSidebarConversationsDeep", () => {
  it("accumulates links across virtualized sidebar scroll positions", async () => {
    vi.stubGlobal("window", {
      location: { href: "https://chatgpt.com/" },
      setTimeout: (callback: () => void) => {
        callback();
        return 0;
      }
    });

    let page = 0;
    const scrollRoot = new FakeScrollRoot(() => {
      page = Math.min(page + 1, 2);
    });

    const pages = [
      [
        createLink("https://chatgpt.com/c/a", "First", scrollRoot),
        createLink("https://chatgpt.com/c/b", "Second", scrollRoot)
      ],
      [
        createLink("https://chatgpt.com/c/b", "Second", scrollRoot),
        createLink("https://chatgpt.com/c/c", "Third", scrollRoot)
      ],
      [
        createLink("https://chatgpt.com/c/c", "Third", scrollRoot),
        createLink("https://chatgpt.com/c/d", "Fourth", scrollRoot)
      ]
    ];

    const fakeDocument = {
      querySelectorAll: (selector: string) => selector.includes("/c/") || selector.includes("history-item") ? pages[page] : [],
      querySelector: (selector: string) => {
        if (selector.includes("/c/") || selector.includes("history-item")) return pages[page][0];
        if (selector === "nav") return scrollRoot;
        return null;
      }
    } as unknown as Document;

    const summaries = await extractSidebarConversationsDeep(fakeDocument);

    expect(summaries.map((summary) => summary.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("extracts sidebar conversations from data-href history items", () => {
    vi.stubGlobal("window", {
      location: { href: "https://chatgpt.com/" },
      setTimeout: (callback: () => void) => {
        callback();
        return 0;
      }
    });

    const scrollRoot = new FakeScrollRoot(() => undefined);
    const item = createHistoryItem("/c/data-id", "Data href title", scrollRoot);
    const fakeDocument = {
      querySelectorAll: () => [item],
      querySelector: (selector: string) => selector === "nav" ? scrollRoot : item
    } as unknown as Document;

    const summaries = extractSidebarConversationsDeep(fakeDocument);

    return expect(summaries).resolves.toMatchObject([
      {
        id: "data-id",
        title: "Data href title",
        url: "https://chatgpt.com/c/data-id"
      }
    ]);
  });
});

function createLink(href: string, textContent: string, parentElement: FakeScrollRoot): FakeLink {
  return {
    href,
    textContent,
    parentElement,
    getAttribute: (name: string) => name === "href" ? href : null,
    querySelector: () => null,
    closest: () => null,
    matches: (selector: string) => selector.startsWith("a[")
  };
}

function createHistoryItem(href: string, textContent: string, parentElement: FakeScrollRoot): FakeLink {
  return {
    href,
    textContent,
    parentElement,
    getAttribute: (name: string) => name === "data-href" ? href : null,
    querySelector: () => null,
    closest: () => null,
    matches: () => false
  };
}
