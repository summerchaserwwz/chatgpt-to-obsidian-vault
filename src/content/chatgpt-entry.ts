import { extractCurrentConversation } from "../extractors/chatgpt/extract-current-conversation";
import { extractSidebarConversations, extractSidebarConversationsDeep } from "../extractors/chatgpt/extract-sidebar-conversations";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "extract-chatgpt-page") {
    const conversation = extractCurrentConversation();
    const summaries = extractSidebarConversations();
    sendResponse({ conversation, summaries });
    return true;
  }

  if (message?.type === "extract-chatgpt-sidebar-deep") {
    extractSidebarConversationsDeep()
      .then((summaries) => sendResponse({ summaries }))
      .catch((error) => sendResponse({
        summaries: extractSidebarConversations(),
        reason: error instanceof Error ? error.message : "Deep sidebar scan failed."
      }));
    return true;
  }

  return false;
});

const marker = "chatvault-extension-ready";
if (!document.documentElement.dataset[marker]) {
  document.documentElement.dataset[marker] = "true";
}
