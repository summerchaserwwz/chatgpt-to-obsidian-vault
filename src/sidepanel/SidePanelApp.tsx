import { useEffect, useMemo, useState } from "react";
import type { Conversation, ConversationStatus, ConversationSummary, ExportFormat, ExportSelection, ExportTemplateId, WriteResult } from "../shared/types";
import { createSourceHash } from "../shared/hash";
import { clampText } from "../shared/sanitize";
import { applyExportExtension, exportFormatOptions, formatConversationExport, getExportFormat } from "../exporters/export-formats";
import { exportTemplates } from "../markdown/templates";
import { renderPathTemplate } from "../writers/path-template";
import { downloadMarkdown } from "../writers/downloads-writer-client";
import { FileSystemAccessWriter } from "../writers/file-system-access-writer";
import { computeSavePlan } from "../writers/save-plan";
import { readExportIndex, upsertExportIndex } from "../storage/export-index-store";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Clipboard,
  Database,
  Download,
  FileText,
  FolderOpen,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UploadCloud
} from "../ui/icons";

const defaultPathTemplate = "AI/ChatGPT/{yyyy}/{MM}/{yyyy-MM-dd} - {safeTitle}.md";
const scanLimitOptions = [10, 25, 50] as const;

type FilterKey = "all" | "new" | "updated" | "conflict";
type ScanMode = "recent" | "selected" | "all";

type PreviewState = {
  content: string;
  targetPath: string;
  sourceHash: string;
  mimeType: string;
};

type Toast = {
  tone: "success" | "warning" | "danger";
  message: string;
};

export function SidePanelApp() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedConversationIds, setSelectedConversationIds] = useState<Set<string>>(new Set());
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());
  const [templateId, setTemplateId] = useState<ExportTemplateId>("source_archive");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("markdown");
  const [pathTemplate, setPathTemplate] = useState(defaultPathTemplate);
  const [writePolicy, setWritePolicy] = useState<ExportSelection["writePolicy"]>("update");
  const [includeFrontmatter, setIncludeFrontmatter] = useState(true);
  const [includeSourceLink, setIncludeSourceLink] = useState(true);
  const [includeTranscript, setIncludeTranscript] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [scanLimit, setScanLimit] = useState<number>(10);
  const [preview, setPreview] = useState<PreviewState>({ content: "", targetPath: "", sourceHash: "", mimeType: "text/markdown;charset=utf-8" });
  const [vaultState, setVaultState] = useState<"missing" | "ready" | "fallback">("fallback");
  const [toast, setToast] = useState<Toast | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [isScanningAll, setIsScanningAll] = useState(false);
  const writer = useMemo(() => new FileSystemAccessWriter(), []);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversationKey(conversation) === activeId) ?? null,
    [activeId, conversations]
  );

  const selection = useMemo<ExportSelection>(
    () => ({
      conversationId: activeConversation?.id ?? null,
      selectedMessageIds: [...selectedMessageIds],
      templateId,
      exportFormat,
      includeFrontmatter,
      includeSourceLink,
      includeTranscript,
      tags: ["ai/chatgpt", "source", "inbox"],
      pathTemplate,
      writePolicy
    }),
    [activeConversation?.id, exportFormat, includeFrontmatter, includeSourceLink, includeTranscript, pathTemplate, selectedMessageIds, templateId, writePolicy]
  );

  useEffect(() => {
    let isMounted = true;

    async function updatePreview() {
      if (!activeConversation) {
        setPreview({ content: "", targetPath: "", sourceHash: "", mimeType: getExportFormat(exportFormat).mimeType });
        return;
      }

      const selectedPayload = activeConversation.messages
        .filter((message) => selectedMessageIds.has(message.id))
        .map((message) => `${message.role}:${message.markdown}`)
        .join("\n");
      const sourceHash = await createSourceHash(`${activeConversation.id ?? activeConversation.url}\n${selectedPayload}`);
      const targetPath = applyExportExtension(renderPathTemplate(pathTemplate, activeConversation), exportFormat);
      const formatted = formatConversationExport({
        conversation: activeConversation,
        selection,
        exportedAt: new Date().toISOString(),
        sourceHash
      });

      if (isMounted) {
        setPreview({ content: formatted.content, targetPath, sourceHash, mimeType: formatted.mimeType });
      }
    }

    updatePreview();
    return () => {
      isMounted = false;
    };
  }, [activeConversation, exportFormat, pathTemplate, selectedMessageIds, selection]);

  const filteredConversations = conversations.filter((conversation) => {
    const matchesQuery = conversation.title.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "all" || conversation.status === filter;
    return matchesQuery && matchesFilter;
  });

  const savePlan = activeConversation
    ? computeSavePlan({
        conversation: activeConversation,
        targetPath: preview.targetPath,
        sourceHash: preview.sourceHash,
        indexRecord: readExportIndex().find((record) =>
          record.conversationId === activeConversation.id
            && record.targetPath === preview.targetPath
            && record.exportFormat === exportFormat
        )
      })
    : null;

  function activateConversation(conversation: Conversation) {
    setActiveId(conversationKey(conversation));
    setSelectedMessageIds(new Set(conversation.messages.map((message) => message.id)));
  }

  function toggleConversation(conversation: Conversation) {
    if (!conversation.id) return;
    const next = new Set(selectedConversationIds);
    if (next.has(conversation.id)) {
      next.delete(conversation.id);
    } else {
      next.add(conversation.id);
    }
    setSelectedConversationIds(next);
  }

  function toggleMessage(messageId: string) {
    const next = new Set(selectedMessageIds);
    if (next.has(messageId)) {
      next.delete(messageId);
    } else {
      next.add(messageId);
    }
    setSelectedMessageIds(next);
  }

  async function scanCurrentTab() {
    if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
      setToast({ tone: "warning", message: "当前不是扩展运行环境，请在 Chrome 扩展侧边栏里扫描真实 ChatGPT 页面。" });
      return;
    }

    const response = await chrome.runtime.sendMessage({ type: "scan-current-tab" });
    if (response?.conversation) {
      const scanned = response.conversation as Conversation;
      const sidebarConversations = mapSidebarSummaries(response.summaries ?? [], [scanned]);
      setConversations((current) => mergeConversations([scanned, ...sidebarConversations], current));
      setActiveId(conversationKey(scanned));
      setSelectedConversationIds(new Set(scanned.id && scanned.messages.length > 0 ? [scanned.id] : []));
      setSelectedMessageIds(new Set(scanned.messages.map((message) => message.id)));
      setToast({ tone: "success", message: `已扫描当前 ChatGPT 会话，并读取 ${sidebarConversations.length} 个侧边栏摘要。` });
      return;
    }

    setToast({ tone: "warning", message: response?.reason ?? "当前标签页没有可读取的 ChatGPT 会话。" });
  }

  async function scanConversations(mode: ScanMode) {
    if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
      setToast({ tone: "warning", message: "当前不是扩展运行环境，请在 Chrome 扩展侧边栏里扫描真实 ChatGPT 页面。" });
      return;
    }

    const selectedUrls = conversations
      .filter((conversation) => conversation.id && selectedConversationIds.has(conversation.id))
      .map((conversation) => conversation.url);
    if (mode === "selected" && selectedUrls.length === 0) {
      setToast({ tone: "warning", message: "请先在左侧选择要扫描全文的会话。" });
      return;
    }

    setIsScanningAll(true);
    setToast({
      tone: "warning",
      message: mode === "selected"
        ? `正在扫描选中的 ${selectedUrls.length} 个会话全文，请保持当前 ChatGPT 标签页打开。`
        : mode === "recent"
          ? `正在扫描最近 ${scanLimit} 个侧边栏会话全文。`
          : "正在逐个打开全部侧边栏会话并扫描全文，这会比较久。"
    });
    try {
      const response = await chrome.runtime.sendMessage({
        type: "scan-all-conversations",
        limit: mode === "recent" ? scanLimit : undefined,
        urls: mode === "selected" ? selectedUrls : undefined
      });
      const scanned = (response?.conversations ?? []) as Conversation[];
      const sidebarConversations = mapSidebarSummaries(response?.summaries ?? [], scanned);
      if (scanned.length === 0) {
        const summaryCount = response?.summaries?.length ?? 0;
        const failureCount = response?.failures?.length ?? 0;
        const reason = response?.reason
          ?? "后台没有返回扫描结果。请在 chrome://extensions 重载这个 unpacked 扩展后再试。";
        setConversations((current) => mergeConversations(sidebarConversations, current));
        setToast({
          tone: "warning",
          message: summaryCount > 0 || failureCount > 0
            ? `${reason} 已发现 ${summaryCount} 个侧栏会话，${failureCount} 个全文扫描失败。`
            : reason
        });
        return;
      }

      setConversations((current) => mergeConversations([...scanned, ...sidebarConversations], current));
      setActiveId(conversationKey(scanned[0]));
      setSelectedConversationIds((current) => new Set([...current, ...scanned.flatMap((conversation) => conversation.id ? [conversation.id] : [])]));
      setSelectedMessageIds(new Set(scanned[0].messages.map((message) => message.id)));

      const failureCount = response?.failures?.length ?? 0;
      const requestedCount = response?.requested ?? (mode === "recent" ? scanLimit : mode === "selected" ? selectedUrls.length : scanned.length);
      setToast({
        tone: failureCount > 0 ? "warning" : "success",
        message: failureCount > 0
          ? `已扫描 ${scanned.length}/${requestedCount} 个会话全文，${failureCount} 个失败。`
          : `已扫描 ${scanned.length}/${requestedCount} 个会话全文。`
      });
    } catch (error) {
      setToast({
        tone: "danger",
        message: error instanceof Error ? error.message : "批量扫描失败。"
      });
    } finally {
      setIsScanningAll(false);
    }
  }

  function selectFilteredConversations() {
    setSelectedConversationIds(new Set(filteredConversations.flatMap((conversation) => conversation.id ? [conversation.id] : [])));
  }

  function selectExportableConversations() {
    setSelectedConversationIds(new Set(conversations.flatMap((conversation) => conversation.id && conversation.messages.length > 0 ? [conversation.id] : [])));
  }

  function clearConversationSelection() {
    setSelectedConversationIds(new Set());
  }

  async function chooseVault() {
    const result = await writer.chooseDirectory();
    setVaultState(result.ok ? "ready" : "missing");
    setToast({ tone: result.ok ? "success" : "warning", message: result.reason });
  }

  async function copyExport() {
    if (!preview.content) return;
    await navigator.clipboard.writeText(preview.content);
    setToast({ tone: "success", message: `${getExportFormat(exportFormat).label} 已复制。` });
  }

  async function writeActiveConversation() {
    if (!activeConversation) {
      setToast({ tone: "warning", message: "请先从 ChatGPT 当前页面扫描真实会话。" });
      return;
    }
    setIsWriting(true);
    try {
      const result = vaultState === "ready"
        ? await writer.writeMarkdown(preview.targetPath, preview.content)
        : await downloadMarkdown(preview.targetPath, preview.content, preview.mimeType);
      finalizeWrite(activeConversation, result, preview.sourceHash);
    } catch (error) {
      setToast({
        tone: "danger",
        message: error instanceof Error ? error.message : "文件写入失败。"
      });
    } finally {
      setIsWriting(false);
    }
  }

  async function writeSelectedBatch() {
    if (!activeConversation) {
      setToast({ tone: "warning", message: "请先扫描真实 ChatGPT 会话。" });
      return;
    }
    setIsWriting(true);
    try {
      const targets = conversations.filter((conversation) => conversation.id && selectedConversationIds.has(conversation.id));
      const exportableTargets = targets.filter((conversation) => conversation.messages.length > 0);
      const results: WriteResult[] = [];

      if (exportableTargets.length === 0) {
        setToast({ tone: "warning", message: "所选项目只有侧边栏摘要。请先打开对应 ChatGPT 会话并 Scan，再导出全文。" });
        return;
      }

      for (const conversation of exportableTargets) {
        const messageIds = conversation.id === activeConversation.id
          ? [...selectedMessageIds]
          : conversation.messages.map((message) => message.id);
        const batchSelection = { ...selection, conversationId: conversation.id, selectedMessageIds: messageIds };
        const sourceHash = await createSourceHash(
          conversation.messages
            .filter((message) => messageIds.includes(message.id))
            .map((message) => message.markdown)
            .join("\n")
        );
        const targetPath = applyExportExtension(renderPathTemplate(pathTemplate, conversation), batchSelection.exportFormat);
        const formatted = formatConversationExport({
          conversation,
          selection: batchSelection,
          exportedAt: new Date().toISOString(),
          sourceHash
        });
        const result = vaultState === "ready"
          ? await writer.writeMarkdown(targetPath, formatted.content)
          : await downloadMarkdown(targetPath, formatted.content, formatted.mimeType);
        finalizeWrite(conversation, result, sourceHash);
        results.push(result);
      }

      setToast({
        tone: results.every((result) => result.ok) ? "success" : "warning",
        message: `已处理 ${results.length} 个 ${getExportFormat(exportFormat).label} 文件。`
      });
    } catch (error) {
      setToast({
        tone: "danger",
        message: error instanceof Error ? error.message : "批量写入失败。"
      });
    } finally {
      setIsWriting(false);
    }
  }

  function finalizeWrite(conversation: Conversation, result: WriteResult, sourceHash: string) {
    if (result.ok && conversation.id) {
      upsertExportIndex({
        conversationId: conversation.id,
        sourceUrl: conversation.url,
        targetPath: result.path,
        title: conversation.title,
        sourceHash,
        exportedAt: new Date().toISOString(),
        templateId,
        exportFormat
      });
    }

    setConversations((current) =>
      current.map((item) =>
        item.id === conversation.id
          ? { ...item, status: result.ok ? result.status : "failed" }
          : item
      )
    );
    setToast({ tone: result.ok ? "success" : "danger", message: result.reason });
  }

  const selectedTurnCount = activeConversation ? selectedMessageIds.size : 0;
  const statusCounts = countStatuses(conversations);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <Archive size={18} />
          </div>
          <div>
            <p className="eyebrow">Local-first extension</p>
            <h1>ChatGPT to Obsidian Vault</h1>
          </div>
        </div>
        <div className="topbar-actions">
          <VaultStatus state={vaultState} />
          <button className="secondary-button" type="button" onClick={chooseVault}>
            <FolderOpen size={16} />
            Choose Vault
          </button>
          <button className="secondary-button" type="button" onClick={scanCurrentTab}>
            <RefreshCw size={16} />
            Scan
          </button>
          <label className="scan-limit">
            <span>Recent</span>
            <select value={scanLimit} onChange={(event) => setScanLimit(Number(event.target.value))}>
              {scanLimitOptions.map((count) => <option value={count} key={count}>{count}</option>)}
            </select>
          </label>
          <button className="secondary-button" type="button" onClick={() => scanConversations("recent")} disabled={isScanningAll || isWriting}>
            <Download size={16} />
            {isScanningAll ? "Scanning" : "Scan Recent"}
          </button>
          <button className="secondary-button" type="button" onClick={() => scanConversations("selected")} disabled={isScanningAll || isWriting || selectedConversationIds.size === 0}>
            <RefreshCw size={16} />
            Scan Selected
          </button>
          <button className="secondary-button subtle-action" type="button" onClick={() => scanConversations("all")} disabled={isScanningAll || isWriting}>
            <Database size={16} />
            All
          </button>
          <button className="primary-button" type="button" onClick={writeActiveConversation} disabled={isWriting || !activeConversation || selectedTurnCount === 0}>
            <UploadCloud size={16} />
            Write Vault
          </button>
        </div>
      </header>

      {toast ? (
        <div className={`toast toast-${toast.tone}`} role="status">
          {toast.tone === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {toast.message}
        </div>
      ) : null}

      <main className="workspace">
        <section className="panel left-panel" aria-label="会话列表">
          <PanelHeader eyebrow="Step 1" title="会话列表" meta={`${selectedConversationIds.size} selected`} />
          <label className="search-box">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索会话" />
          </label>
          <div className="segmented" role="tablist" aria-label="过滤会话">
            {[
              ["all", "全部"],
              ["new", "新文件"],
              ["updated", "更新"],
              ["conflict", "确认"]
            ].map(([key, label]) => (
              <button
                className={filter === key ? "active" : ""}
                key={key}
                type="button"
                onClick={() => setFilter(key as FilterKey)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="selection-toolbar" aria-label="批量选择会话">
            <button type="button" onClick={selectFilteredConversations}>全选当前</button>
            <button type="button" onClick={selectExportableConversations}>只选可导出</button>
            <button type="button" onClick={clearConversationSelection}>清空</button>
          </div>
          <div className="conversation-list">
            {filteredConversations.length === 0 ? (
              <EmptyState
                title="还没有真实 ChatGPT 会话"
                body="打开一个 chatgpt.com 会话标签页，然后点击 Scan。这里不会再自动展示示例数据。"
              />
            ) : filteredConversations.map((conversation) => (
              <article
                className={`conversation-row ${conversationKey(conversation) === activeId ? "is-active" : ""}`}
                key={conversationKey(conversation)}
                onClick={() => activateConversation(conversation)}
              >
                <input
                  aria-label={`选择 ${conversation.title}`}
                  checked={Boolean(conversation.id && selectedConversationIds.has(conversation.id))}
                  onChange={() => toggleConversation(conversation)}
                  onClick={(event) => event.stopPropagation()}
                  type="checkbox"
                />
                <div className="row-main">
                  <h3>{conversation.title}</h3>
                <p>
                  {conversation.model ?? "Unknown model"} · {conversation.messageCount ?? conversation.messages.length} turns
                  {conversation.messages.length === 0 ? " · summary only" : ""}
                </p>
                </div>
                <StatusChip status={conversation.status ?? "new"} />
              </article>
            ))}
          </div>
        </section>

        <section className="panel middle-panel" aria-label="选择要导出的对话内容">
          <PanelHeader eyebrow="Step 2" title="选择要导出的对话内容" meta={activeConversation ? `${selectedTurnCount}/${activeConversation.messages.length} turns` : "waiting"} />
          {!activeConversation ? (
            <EmptyState
              title="等待真实页面扫描"
              body="请先在 Chrome 中切到 ChatGPT 对话页，再回到扩展点击 Scan。"
            />
          ) : (
            <>
              <div className="active-summary">
                <FileText size={18} />
                <div>
                  <h2>{activeConversation.title}</h2>
                  <p>{activeConversation.url}</p>
                </div>
              </div>
              <ExtractionDiagnostics conversation={activeConversation} />
              <div className="inline-actions">
                <button type="button" onClick={() => setSelectedMessageIds(new Set(activeConversation.messages.filter((message) => message.value === "high").map((message) => message.id)))}>
                  <ShieldCheck size={15} />
                  只选高价值
                </button>
                <button type="button" onClick={() => setSelectedMessageIds(new Set(activeConversation.messages.map((message) => message.id)))}>
                  <CheckCircle2 size={15} />
                  全选
                </button>
              </div>
              <div className="progress-track" aria-label="已选择对话比例">
                <span style={{ width: `${Math.round((selectedTurnCount / Math.max(1, activeConversation.messages.length)) * 100)}%` }} />
              </div>
              <div className="turn-list">
                {activeConversation.messages.length === 0 ? (
                  <EmptyState
                    title="这是侧边栏摘要，不是全文"
                    body="左侧勾选它后点 Scan Selected，或用 Scan Recent 批量打开最近几条并抽取全文。"
                  />
                ) : activeConversation.messages.map((message) => (
                  <article className={`turn-card ${selectedMessageIds.has(message.id) ? "selected" : ""}`} key={message.id}>
                    <label className="turn-check">
                      <input checked={selectedMessageIds.has(message.id)} onChange={() => toggleMessage(message.id)} type="checkbox" />
                      <span>{message.role === "assistant" ? "Assistant" : message.role === "user" ? "User" : "Other"}</span>
                    </label>
                    <p>{clampText(message.plainText, 240)}</p>
                    <div className="turn-meta">
                      <span>{message.value === "high" ? "高价值" : "可选"}</span>
                      <code>{message.id}</code>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="panel right-panel" aria-label="模板与预览">
          <PanelHeader eyebrow="Step 3" title="模板与预览" meta={savePlan?.status ?? "waiting"} />
          <div className="format-grid" aria-label="导出格式">
            {exportFormatOptions.map((format) => (
              <button
                className={`format-card ${exportFormat === format.id ? "selected" : ""}`}
                key={format.id}
                type="button"
                onClick={() => setExportFormat(format.id)}
              >
                <FileText size={15} />
                <strong>{format.label}</strong>
                <span>.{format.extension}</span>
              </button>
            ))}
          </div>
          <p className="template-help">{getExportFormat(exportFormat).description}</p>

          <div className="template-grid">
            {exportTemplates.map((template) => (
              <button
                className={`template-card ${templateId === template.id ? "selected" : ""}`}
                key={template.id}
                type="button"
                onClick={() => setTemplateId(template.id)}
              >
                <Database size={16} />
                <strong>{template.name}</strong>
                <span>{template.description}</span>
                <small>{template.bestFor}</small>
              </button>
            ))}
          </div>
          <p className="template-help">模板主要影响 Markdown 的组织方式；TXT、JSON、CSV、HTML、Word 会按所选消息输出，不改写原始内容。</p>

          <label className="field-label">
            Target path
            <input value={pathTemplate} onChange={(event) => setPathTemplate(event.target.value)} />
          </label>

          <label className="field-label">
            Write policy
            <select value={writePolicy} onChange={(event) => setWritePolicy(event.target.value as ExportSelection["writePolicy"])}>
              <option value="update">覆盖更新源文件</option>
              <option value="copy">保留旧文件，写入副本</option>
              <option value="skip">已存在则跳过</option>
            </select>
          </label>

          <div className="options-row" aria-label="导出选项">
            <Toggle checked={includeFrontmatter} label="Frontmatter" onChange={setIncludeFrontmatter} />
            <Toggle checked={includeSourceLink} label="Source" onChange={setIncludeSourceLink} />
            <Toggle checked={includeTranscript} label="Transcript" onChange={setIncludeTranscript} />
          </div>

          <div className="save-plan">
            <SlidersHorizontal size={16} />
            <div>
              <strong>{preview.targetPath}</strong>
              <span>{savePlan?.reason ?? "扫描真实 ChatGPT 会话后生成保存计划。"}</span>
              <em>{vaultState === "ready" ? "将直接写入已授权 Vault 文件夹。" : "当前会保存到浏览器 Downloads。点击 Choose Vault 后可直接写入 Obsidian Vault。"}</em>
            </div>
          </div>

          <div className="preview-header">
            <span>{getExportFormat(exportFormat).label} preview</span>
            <button type="button" onClick={copyExport}>
              <Clipboard size={15} />
              Copy
            </button>
          </div>
          <textarea className="markdown-preview" readOnly value={preview.content || "未扫描真实 ChatGPT 会话。"} />

          <div className="batch-bar">
            <div>
              <strong>{statusCounts.updated + statusCounts.new}</strong>
              <span>ready</span>
            </div>
            <div>
              <strong>{statusCounts.unchanged}</strong>
              <span>skips</span>
            </div>
            <div>
              <strong>{statusCounts.conflict + statusCounts.failed}</strong>
              <span>review</span>
            </div>
            <button className="secondary-button" type="button" onClick={chooseVault}>
              <FolderOpen size={15} />
              Choose Vault
            </button>
            <button className="secondary-button" type="button" onClick={writeSelectedBatch} disabled={isWriting || !activeConversation || selectedConversationIds.size === 0}>
              <Download size={15} />
              Batch
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state">
      <FileText size={22} />
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

function ExtractionDiagnostics({ conversation }: { conversation: Conversation }) {
  const warnings = [
    ...(conversation.extraction?.warnings ?? []),
    ...conversation.messages.flatMap((message) => message.extractionWarnings ?? [])
  ];

  return (
    <div className={`diagnostics ${warnings.length > 0 ? "has-warning" : ""}`}>
      <div>
        <span>Extractor</span>
        <strong>{conversation.extraction?.strategy ?? (conversation.messages.length > 0 ? "legacy" : "sidebar-summary")}</strong>
      </div>
      <div>
        <span>Diagnostics</span>
        <strong>{warnings.length > 0 ? `${warnings.length} warning${warnings.length === 1 ? "" : "s"}` : "clean"}</strong>
      </div>
      {warnings.length > 0 ? <p>{warnings.slice(0, 2).join(" ")}</p> : null}
    </div>
  );
}

function PanelHeader({ eyebrow, title, meta }: { eyebrow: string; title: string; meta: string }) {
  return (
    <div className="panel-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      <span>{meta}</span>
    </div>
  );
}

function StatusChip({ status }: { status: ConversationStatus }) {
  return <span className={`status-chip status-${status}`}>{status}</span>;
}

function VaultStatus({ state }: { state: "missing" | "ready" | "fallback" }) {
  const label = state === "ready" ? "Vault ready" : state === "missing" ? "Need permission" : "Downloads fallback";
  return (
    <div className={`vault-status vault-${state}`}>
      {state === "ready" ? <CheckCircle2 size={15} /> : <ShieldCheck size={15} />}
      {label}
    </div>
  );
}

function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: (value: boolean) => void }) {
  return (
    <label className="toggle">
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
      <span>{label}</span>
    </label>
  );
}

function countStatuses(conversations: Conversation[]) {
  return conversations.reduce(
    (counts, conversation) => {
      const status = conversation.status ?? "new";
      counts[status] += 1;
      return counts;
    },
    { new: 0, unchanged: 0, updated: 0, conflict: 0, failed: 0 } satisfies Record<ConversationStatus, number>
  );
}

function mapSidebarSummaries(summaries: ConversationSummary[], scanned: Conversation[]): Conversation[] {
  const scannedKeys = new Set(scanned.map(conversationKey));
  return summaries
    .filter((summary) => !scannedKeys.has(conversationKey(summary)))
    .map((summary) => ({
      ...summary,
      messageCount: summary.messageCount ?? 0,
      messages: [],
      extraction: {
        strategy: "sidebar-summary",
        warnings: ["Only sidebar metadata is available. Open and scan the conversation to export full messages."]
      }
    }));
}

function mergeConversations(incoming: Conversation[], current: Conversation[]): Conversation[] {
  const merged = new Map<string, Conversation>();
  for (const item of current) {
    merged.set(conversationKey(item), item);
  }
  for (const item of incoming) {
    const key = conversationKey(item);
    const existing = merged.get(key);
    merged.set(key, existing && existing.messages.length > item.messages.length ? existing : item);
  }
  return [...merged.values()];
}

function conversationKey(conversation: ConversationSummary): string {
  return conversation.id ?? conversation.url;
}
