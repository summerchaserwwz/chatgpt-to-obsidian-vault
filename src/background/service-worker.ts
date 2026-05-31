import type { Conversation, ConversationSummary, WriteResult } from "../shared/types";

const scanAllDelayMs = 450;
const tabLoadTimeoutMs = 25_000;

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel?.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => undefined);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "scan-current-tab") {
    scanCurrentTab().then(sendResponse).catch((error) => {
      sendResponse({
        ok: false,
        reason: error instanceof Error ? error.message : "Scan failed."
      });
    });
    return true;
  }

  if (message?.type === "scan-all-conversations") {
    scanAllConversations({
      limit: typeof message.limit === "number" ? message.limit : undefined,
      urls: Array.isArray(message.urls)
        ? (message.urls as unknown[]).filter((url): url is string => typeof url === "string")
        : undefined
    }).then(sendResponse).catch((error) => {
      sendResponse({
        ok: false,
        conversations: [],
        failures: [],
        reason: error instanceof Error ? error.message : "Scan all failed."
      });
    });
    return true;
  }

  if (message?.type === "download-markdown") {
    downloadMarkdown(message.path, message.markdown).then(sendResponse).catch((error) => {
      sendResponse({
        ok: false,
        path: message.path,
        status: "failed",
        reason: error instanceof Error ? error.message : "Download failed."
      });
    });
    return true;
  }

  return false;
});

async function scanCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    return { ok: false, reason: "No active tab was found." };
  }

  if (!isChatGptTab(tab.url)) {
    return { ok: false, reason: "Open a chatgpt.com conversation tab before scanning." };
  }

  return extractFromTab(tab.id);
}

async function scanAllConversations(options: { limit?: number; urls?: string[] } = {}) {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab?.id) {
    return { ok: false, conversations: [], summaries: [], failures: [], reason: "No active tab was found." };
  }

  if (!isChatGptTab(activeTab.url)) {
    return { ok: false, conversations: [], summaries: [], failures: [], reason: "Open a chatgpt.com conversation tab before scanning all." };
  }

  const seed = await extractFromTab(activeTab.id);
  const deepSidebar = await extractDeepSidebarFromTab(activeTab.id);
  const discoveredSummaries = uniqueSummaries([
    ...(deepSidebar.summaries ?? []),
    ...(seed.summaries ?? []),
    ...(seed.conversation ? [conversationToSummary(seed.conversation)] : [])
  ]).filter((summary) => isChatGptTab(summary.url));
  const targetUrls = new Set(options.urls ?? []);
  const requestedSummaries = targetUrls.size > 0
    ? discoveredSummaries.filter((summary) => targetUrls.has(summary.url))
    : discoveredSummaries;
  const limit = options.limit && options.limit > 0 ? Math.floor(options.limit) : undefined;
  const summaries = typeof limit === "number" ? requestedSummaries.slice(0, limit) : requestedSummaries;

  const conversations: Conversation[] = [];
  const failures: Array<{ url: string; title: string; reason: string }> = [];

  const seedConversation = seed.conversation;
  if (seedConversation && summaries.some((summary) => sameConversation(summary, seedConversation))) {
    conversations.push(seedConversation);
  }

  if (summaries.length === 0) {
    return {
      ok: false,
      conversations,
        summaries: discoveredSummaries,
        failures,
        reason: [
          "No sidebar conversation URLs were discovered.",
        seed.reason ? `Current-page scan: ${seed.reason}` : "",
        deepSidebar.reason ? `Sidebar scan: ${deepSidebar.reason}` : ""
      ].filter(Boolean).join(" ")
    };
  }

  for (const summary of summaries) {
    if (seed.conversation?.id && summary.id === seed.conversation.id) continue;

    let tabId: number | undefined;
    try {
      const tab = await chrome.tabs.create({
        active: false,
        url: summary.url,
        windowId: activeTab.windowId
      });
      tabId = tab.id;
      if (!tabId) throw new Error("Created tab has no id.");

      await waitForTabLoad(tabId, tabLoadTimeoutMs);
      await delay(scanAllDelayMs);
      const extracted = await extractFromTab(tabId);
      if (extracted.conversation) {
        conversations.push(extracted.conversation);
      } else {
        failures.push({ url: summary.url, title: summary.title, reason: extracted.reason ?? "No conversation extracted." });
      }
    } catch (error) {
      failures.push({
        url: summary.url,
        title: summary.title,
        reason: error instanceof Error ? error.message : "Conversation scan failed."
      });
    } finally {
      if (tabId) {
        chrome.tabs.remove(tabId).catch(() => undefined);
      }
      await delay(scanAllDelayMs);
    }
  }

  return {
    ok: conversations.length > 0,
    conversations,
    summaries: discoveredSummaries,
    requested: summaries.length,
    failures,
    reason: `Scanned ${conversations.length}/${summaries.length} ChatGPT conversations.`
  };
}

async function extractFromTab(tabId: number): Promise<{ conversation?: Conversation; summaries?: ConversationSummary[]; reason?: string }> {
  try {
    return await chrome.tabs.sendMessage(tabId, { type: "extract-chatgpt-page" });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unable to reach the ChatGPT content script.";
    if (!reason.includes("Receiving end does not exist")) {
      return { reason };
    }

    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["assets/chatgpt-entry.js"]
      });
      return await chrome.tabs.sendMessage(tabId, { type: "extract-chatgpt-page" });
    } catch (injectError) {
      return {
        reason: injectError instanceof Error
          ? `Could not scan this ChatGPT tab after injecting the content script. ${injectError.message}`
          : "Could not scan this ChatGPT tab after injecting the content script."
      };
    }
  }
}

async function extractDeepSidebarFromTab(tabId: number): Promise<{ summaries: ConversationSummary[]; reason?: string }> {
  try {
    return await chrome.tabs.sendMessage(tabId, { type: "extract-chatgpt-sidebar-deep" });
  } catch (error) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["assets/chatgpt-entry.js"]
      });
      return await chrome.tabs.sendMessage(tabId, { type: "extract-chatgpt-sidebar-deep" });
    } catch (injectError) {
      return {
        summaries: [],
        reason: injectError instanceof Error
          ? `Could not scan the ChatGPT sidebar after injecting the content script. ${injectError.message}`
          : error instanceof Error
            ? error.message
            : "Could not scan the ChatGPT sidebar."
      };
    }
  }
}

function uniqueSummaries(summaries: ConversationSummary[]): ConversationSummary[] {
  const seen = new Set<string>();
  return summaries.filter((summary) => {
    const key = summary.id ?? summary.url;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function conversationToSummary(conversation: Conversation): ConversationSummary {
  return {
    source: conversation.source,
    id: conversation.id,
    url: conversation.url,
    title: conversation.title,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    model: conversation.model,
    messageCount: conversation.messageCount,
    status: conversation.status
  };
}

function sameConversation(summary: ConversationSummary, conversation: ConversationSummary): boolean {
  return Boolean(
    (summary.id && conversation.id && summary.id === conversation.id)
      || summary.url === conversation.url
  );
}

function waitForTabLoad(tabId: number, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = globalThis.setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error(`Timed out waiting for tab ${tabId} to load.`));
    }, timeoutMs);

    const listener = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      if (updatedTabId !== tabId || changeInfo.status !== "complete") return;
      globalThis.clearTimeout(timeout);
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    };

    chrome.tabs.onUpdated.addListener(listener);
    chrome.tabs.get(tabId).then((tab) => {
      if (tab.status === "complete") {
        globalThis.clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }).catch(() => undefined);
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}

function isChatGptTab(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname;
    return host === "chatgpt.com" || host.endsWith(".chatgpt.com") || host === "chat.openai.com";
  } catch {
    return false;
  }
}

async function downloadMarkdown(path: string, markdown: string): Promise<WriteResult> {
  const url = `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`;

  try {
    await chrome.downloads.download({
      url,
      filename: path,
      saveAs: false,
      conflictAction: "overwrite"
    });
    return { ok: true, path, status: "updated", reason: "Markdown sent to browser Downloads." };
  } catch (error) {
    return {
      ok: false,
      path,
      status: "failed",
      reason: error instanceof Error ? error.message : "Download failed."
    };
  }
}
