export type ConversationSource = "chatgpt";

export type ConversationStatus = "new" | "unchanged" | "updated" | "conflict" | "failed";

export type ConversationSummary = {
  source: ConversationSource;
  id: string | null;
  url: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
  model?: string;
  messageCount?: number;
  status?: ConversationStatus;
};

export type ConversationMessage = {
  id: string;
  role: "user" | "assistant" | "system" | "tool" | "unknown";
  authorName?: string;
  createdAt?: string;
  markdown: string;
  plainText: string;
  attachments: ConversationAttachment[];
  sourceNodeHint?: string;
  extractionWarnings?: string[];
  value?: "high" | "optional";
};

export type ConversationAttachment = {
  type: "image" | "file" | "link";
  url?: string;
  filename?: string;
  alt?: string;
};

export type Conversation = ConversationSummary & {
  messages: ConversationMessage[];
  extraction?: {
    strategy: string;
    warnings: string[];
  };
};

export type ExportTemplateId = "source_archive" | "decision_record" | "research_note" | "coding_debug";

export type WritePolicy = "update" | "copy" | "skip";

export type ExportSelection = {
  conversationId: string | null;
  selectedMessageIds: string[];
  templateId: ExportTemplateId;
  includeFrontmatter: boolean;
  includeSourceLink: boolean;
  includeTranscript: boolean;
  tags: string[];
  pathTemplate: string;
  writePolicy: WritePolicy;
};

export type SavePlanItem = {
  conversation: ConversationSummary;
  targetPath: string;
  sourceHash: string;
  status: ConversationStatus;
  reason: string;
};

export type ExportIndexRecord = {
  conversationId: string;
  sourceUrl: string;
  targetPath: string;
  title: string;
  sourceHash: string;
  exportedAt: string;
  templateId: ExportTemplateId;
};

export type MarkdownExport = {
  markdown: string;
  targetPath: string;
  sourceHash: string;
};

export type PermissionResult = {
  ok: boolean;
  reason: string;
};

export type WriteResult = {
  ok: boolean;
  path: string;
  status: ConversationStatus;
  reason: string;
};
