import type { Conversation } from "../shared/types";

const cacheKey = "chatvault.conversationCache";
const maxCachedConversations = 80;
const fullContentLimit = 24;

type ConversationCache = {
  cachedAt: string;
  conversations: Conversation[];
};

export function readConversationCache(): Conversation[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<ConversationCache>;
    return Array.isArray(parsed.conversations) ? parsed.conversations : [];
  } catch {
    return [];
  }
}

export function writeConversationCache(conversations: Conversation[]): void {
  if (typeof localStorage === "undefined") return;
  for (let fullContentCount = Math.min(fullContentLimit, conversations.length); fullContentCount >= 0; fullContentCount -= 4) {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(createCachePayload(conversations, fullContentCount)));
      return;
    } catch {
      // Retry with fewer full transcripts; sidebar metadata is more important than crashing the UI.
    }
  }
}

export function clearConversationCache(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(cacheKey);
}

function createCachePayload(conversations: Conversation[], fullContentCount: number): ConversationCache {
  const bounded = conversations.slice(0, maxCachedConversations).map((conversation, index) => {
    if (index < fullContentCount || conversation.messages.length === 0) {
      return conversation;
    }
    return {
      ...conversation,
      messageCount: conversation.messageCount ?? conversation.messages.length,
      messages: [],
      extraction: {
        strategy: "cache-summary",
        warnings: ["Full transcript was not cached because the local cache budget was full. Scan the conversation again before export."]
      }
    };
  });

  return {
    cachedAt: new Date().toISOString(),
    conversations: bounded
  };
}
