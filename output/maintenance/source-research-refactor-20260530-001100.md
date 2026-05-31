# Source Research Refactor: ChatGPT Export Robustness

Date: 2026-05-30 00:11 Asia/Shanghai

## Scope

User reported that validating one real conversation is not enough and asked to reference similar projects, read source code, and improve the whole plugin.

This pass focused on ChatGPT extraction robustness, side-panel honesty, and export safety. It did not claim fixture/demo data as real ChatGPT validation.

## Referenced Projects

Read local clones under `/tmp/chat-exporter-research`:

- `chatgpt-chat-exporter`
  - Key file: `/tmp/chat-exporter-research/chatgpt-chat-exporter/src/extraction-engine.js`
  - Adopted patterns: selector cascade, content-root scoring, DOM-to-Markdown handling for code, tables, links, math, media, and artifact/file cards.
- `ChatVault`
  - Key file: `/tmp/chat-exporter-research/ChatVault/content.js`
  - Adopted patterns: current ChatGPT root selector fallback, clear extraction errors/partial-state diagnostics, sidebar/conversation distinction, long-chat safety thinking.
- `ai-chat-exporter`
  - Key file: `/tmp/chat-exporter-research/ai-chat-exporter/ai-chat-exporter.user.js`
  - Adopted product lesson: export UX needs visible selection/outline state and explicit user-facing formatting controls.

Clone failure:

- `kylnor/ChatCollector` failed earlier because GitHub credentials were unavailable in this host session.

## Implemented Changes

### Extractor

Updated `/Users/summer/Documents/chatgpt-to-obsidian-vault/src/extractors/chatgpt/extract-current-conversation.ts`:

- Added a robust selector cascade:
  - `[data-message-author-role]`
  - `article[data-testid^="conversation-turn-"]`
  - `[data-testid^="conversation-turn-"]`
  - `.group\\/conversation-turn`
  - `[data-message-id]`
  - `[data-testid*="message"]`
- Added richer content-root selection based on text and rich element score.
- Added Markdown serialization for headings, paragraphs, blockquotes, lists, bold, italic, inline code.
- Preserved richer ChatGPT content:
  - fenced code blocks and CodeMirror lines
  - Markdown tables
  - KaTeX/MathJax annotations and `math/tex` scripts
  - links with escaped Markdown text/URLs
  - images, canvas, video, audio placeholders
  - artifact/file card placeholders
- Added extraction strategy and warning metadata.
- Replaced global `document.createTextNode` usage with `ownerDocument.createTextNode`.

### Shared Types

Updated `/Users/summer/Documents/chatgpt-to-obsidian-vault/src/shared/types.ts`:

- Added `Conversation.extraction`.
- Added `ConversationMessage.extractionWarnings`.

### Side Panel

Updated `/Users/summer/Documents/chatgpt-to-obsidian-vault/src/sidepanel/SidePanelApp.tsx` and styles:

- Removed misleading dev-preview fallback text that claimed local demo use.
- Scan now merges current conversation with ChatGPT sidebar summaries.
- Sidebar-only items are shown as `summary only` and cannot be batch-selected for export.
- Added visible extraction diagnostics:
  - extractor strategy
  - warning count
  - first warnings when present
- Empty/full-text distinction is explicit: sidebar summaries require opening that conversation and scanning before export.

## Verification

Commands run:

```bash
node scripts/run-quality.mjs
node scripts/package-extension.mjs
```

Results:

- no emoji check: pass
- typecheck: pass
- Vitest: 5 files, 7 tests, pass
- Vite build: pass
- dist verification: pass
- package regenerated: `/Users/summer/Documents/chatgpt-to-obsidian-vault/release/chatgpt-to-obsidian-vault-0.1.0.zip`

Package contents verified with `unzip -l`:

- `manifest.json`
- `sidepanel.html`
- `options.html`
- `assets/sidepanel.js`
- `assets/styles.css`
- `assets/options.js`
- `assets/chatgpt-entry.js`
- `assets/service-worker.js`
- `assets/styles.js`

## Preview Status

Started local static server for built `dist`:

```bash
http://127.0.0.1:4177/sidepanel.html
```

Codex in-app Browser DOM confirmed the side-panel rendered:

- title: `ChatGPT to Obsidian Vault`
- no fake/demo conversation rows
- empty state says to scan a real ChatGPT page
- three-column workflow rendered
- template controls rendered

Screenshot capture through the in-app Browser timed out, so no screenshot artifact is claimed here.

## Real Browser Status

Previously verified before this refactor:

- Real URL: `https://chatgpt.com/c/6a184621-d014-8321-b14e-aa2aa3a420ee`
- Scan succeeded: 1 conversation, 7/7 turns
- Write succeeded through Chrome downloads
- Downloaded file:
  `/Users/summer/Downloads/AI/ChatGPT/2026/05/2026-05-29 - 一、最简单方案 直接导出 ChatGPT 数据.md`

After this refactor, real Chrome re-validation was attempted but not completed:

- Playwright CLI unavailable because this environment has `node` but no `npm`/`npx`.
- Computer Use returned `cgWindowNotFound` for Google Chrome.
- AppleScript activation of Chrome hung and was terminated.
- Chrome profile inspection did not find this unpacked extension currently loaded in user Chrome.

Therefore this pass is locally built and quality-gated, but the post-refactor real ChatGPT page scan/write still needs a Chrome window/tooling session where the unpacked extension is loaded.

## Remaining Real-World QA

Before calling this fully accepted:

1. Load or reload `/Users/summer/Documents/chatgpt-to-obsidian-vault/dist` in `chrome://extensions`.
2. Open at least three real `chatgpt.com/c/...` conversations:
   - plain text conversation
   - conversation with code blocks/tables
   - conversation with images/files/artifacts if available
3. For each conversation:
   - Scan
   - confirm message count
   - confirm extractor strategy/warnings
   - export Markdown
   - inspect downloaded Markdown for preserved rich content

