# PRD: ChatGPT to Obsidian Vault

Status: awaiting docs confirmation.

Owner: product / Super Dev.

Date: 2026-05-31.

## 1. Product Summary

ChatGPT to Obsidian Vault is a local-first Chrome/Edge extension that turns selected ChatGPT conversations into clean Obsidian Markdown source files.

The product centers on a single high-quality workflow:

1. select conversations
2. select valuable conversation content
3. choose an export template
4. preview the exact Markdown
5. write into an authorized Obsidian Vault folder
6. update existing notes safely on future exports

## 2. Problem

ChatGPT conversations often contain useful product thinking, code explanations, research, decisions, prompts, and writing drafts. But ChatGPT history is not a good long-term knowledge base:

- hard to batch organize
- hard to reference from Obsidian
- hard to preserve only useful parts
- hard to avoid duplicate exports
- official export is account-level and delayed
- existing extensions often download to `Downloads`, leaving manual import work

The user wants a smoother capture pipeline that respects Obsidian as the final system of record.

## 3. Target Users

### Primary

Obsidian power users who use ChatGPT daily and want valuable conversations saved as local Markdown source files.

### Secondary

- researchers collecting AI-assisted research notes
- builders saving product/engineering discussions
- writers preserving drafts and prompts
- operators saving repeatable workflows
- students saving study conversations

## 4. Product Promise

Save the valuable parts of ChatGPT into Obsidian without leaving the flow.

## 5. Positioning

ChatGPT to Obsidian Vault is not:

- a generic AI chat exporter
- a ChatGPT all-in-one enhancement suite
- a cloud sync product
- a summarization product
- a Notion/PDF/DOCX exporter

ChatGPT to Obsidian Vault is:

- Obsidian-first
- local-first
- source-file-first
- batch-oriented
- update-safe
- privacy-forward

## 6. MVP Scope

### In Scope

1. Chromium MV3 extension for Chrome and Edge.
2. Support `https://chatgpt.com/*`.
3. Optional legacy `https://chat.openai.com/*` support if encountered.
4. In-page capture UI or side panel.
5. Conversation list for available ChatGPT conversations.
6. Search and filter conversation list.
7. Multi-select conversations.
8. Current conversation extraction.
9. Controlled sidebar scanning:
    - `Scan` extracts the current conversation and discovers sidebar summaries.
    - `Scan Recent` extracts the latest 10/25/50 discovered sidebar conversations.
    - `Scan Selected` extracts only checked conversations.
    - `All` remains available as an explicit high-cost full-history scan.
10. Turn/message selection within a conversation.
11. Template presets:
    - Source Archive
    - Decision Record
    - Research Note
    - Coding / Debug Note
12. Obsidian Markdown preview.
13. YAML properties/frontmatter generation.
14. File path template generation.
15. Direct Vault writing through File System Access API.
16. Downloads fallback.
17. Save judgment:
    - new
    - unchanged
    - updated
    - conflict
    - failed
18. Local export index.
19. Batch progress UI.
20. Local-only privacy model.

### Out of Scope For MVP

1. AI distillation/summarization.
2. Notion sync.
3. PDF/DOCX/PNG export.
4. Native companion app.
5. Firefox/Safari support.
6. Background sync while ChatGPT is closed.
7. Automatic all-account history sync through private ChatGPT APIs.
8. Paid plan or licensing.
9. Cloud account system.

## 7. Core User Workflows

### 7.1 First Run

1. User installs the extension.
2. User opens ChatGPT.
3. ChatGPT to Obsidian Vault shows a quiet capture entry point.
4. User opens ChatGPT to Obsidian Vault.
5. Product explains:
   - it reads ChatGPT page content only when used
   - files are generated locally
   - direct Vault write requires folder authorization
6. User chooses an Obsidian Vault or subfolder.
7. Product verifies write permission.
8. Product shows the main three-panel workspace.

### 7.2 Save Current Conversation

1. User opens a ChatGPT conversation.
2. User opens ChatGPT to Obsidian Vault.
3. Product extracts current conversation.
4. All content is selected by default.
5. User optionally deselects noisy turns.
6. User selects a template.
7. User checks Markdown preview.
8. User clicks `Write to Vault`.
9. Product writes `.md` file.
10. Product shows success with path and optional "Open in Obsidian".

### 7.3 Selective Export

1. User selects specific Q&A turns or messages.
2. Preview updates instantly.
3. Metadata includes `selected_turn_count`.
4. Saved file is marked as source export with selection metadata.

### 7.4 Batch Import

1. User opens batch mode.
2. Left panel lists available conversations.
3. User filters and selects conversations.
4. Middle panel shows selected conversation content.
5. Right panel shows template, path, policy, and preview.
6. Product computes save plan:
   - new file
   - update existing
   - unchanged skip
   - conflict review
7. User starts batch write.
8. Product shows progress per file.
9. Product produces final result summary.

### 7.5 Controlled Sidebar Scanning

1. User opens any authenticated ChatGPT conversation page.
2. User opens the extension side panel.
3. User clicks `Scan` to extract the current conversation and discover sidebar summaries.
4. Product scrolls the ChatGPT sidebar and accumulates discovered conversation links.
5. User chooses one of three extraction scopes:
   - `Scan Recent 10/25/50`: fast bounded scan for recent work.
   - `Scan Selected`: scan only checked summary rows.
   - `All`: scan every discovered sidebar URL and warn that it can take a long time.
6. Product opens each requested conversation URL in an inactive browser tab.
6. Product injects the extractor if the content script is not already available.
7. Product extracts the full conversation DOM, including rich message content where possible.
8. Product closes the temporary tab and continues the queue.
9. Product lists successfully extracted conversations, preserves summary-only rows for later selection, and reports failures separately.

Important constraint:

- ChatGPT sidebar metadata is not enough for full export. The sidebar normally exposes title and URL only; full Markdown requires loading each conversation page.
- Full-history scanning can be slow because it must load real conversation pages one by one. The default path should be recent or selected scanning.

### 7.6 Re-export / Update

1. User exports a conversation previously saved.
2. Product finds matching `conversation_id` in local index or existing file metadata.
3. Product computes current `source_hash`.
4. If hash unchanged, default status is skip.
5. If hash changed, default status is update.
6. If path collision has different `conversation_id`, status is conflict.
7. User can override per file.

## 8. Information Architecture

### Main Workspace

Left panel: conversation list

- search
- filters
- scan scope controls: recent count, selected scan, explicit all scan
- selection controls: select current filtered list, select exportable only, clear selection
- status chips
- checkboxes
- conversation metadata

Middle panel: selected conversation content

- title
- source metadata
- turn list
- role labels
- high-value selection controls
- full/partial selection status

Right panel: template and preview

- compact template presets with plain-language differences:
  - Source Archive: original archive
  - Decision Record: decision/action extraction scaffold
  - Research Note: findings/open-questions scaffold
  - Coding / Debug Note: debugging scaffold
- path template
- write policy
- frontmatter options
- Markdown preview
- write progress
- save destination explanation:
  - `Choose Vault` enables direct writing through File System Access API.
  - Without a selected Vault, files use browser Downloads fallback.

## 9. Markdown Requirements

### Default File Path

```text
AI/ChatGPT/{yyyy}/{MM}/{yyyy-MM-dd} - {safeTitle}.md
```

### Required Frontmatter

```yaml
---
source: chatgpt
title: "Conversation title"
conversation_id: "chatgpt-conversation-id"
source_url: "https://chatgpt.com/c/..."
created_at: "2026-05-29T09:00:00+08:00"
exported_at: "2026-05-29T14:30:00+08:00"
model: "GPT-5"
message_count: 18
selected_message_count: 12
template: "source"
write_policy: "update"
source_hash: "sha256:..."
chatvault_status: "updated"
tags:
  - ai/chatgpt
  - source
  - inbox
---
```

### Frontmatter Rules

- Keep properties flat.
- Avoid nested YAML in MVP.
- Keep long text out of properties.
- Escape quotes.
- Preserve stable key names.
- Use ISO timestamps.
- Tags are a list.

### Body Structure

```markdown
# Conversation title

## Source

- ChatGPT: https://chatgpt.com/c/...
- Conversation ID: `...`
- Export template: Source Archive
- Write policy: update

## Conversation

### User

...

### Assistant

...
```

## 10. Save Plan Statuses

| Status | Meaning | Default Action |
| --- | --- | --- |
| new | No existing file/index match | create |
| unchanged | Same `conversation_id` and same `source_hash` | skip |
| updated | Same `conversation_id`, different `source_hash` | update |
| conflict | Path exists but metadata does not match | ask |
| failed | Extraction or write failed | retry / inspect |

## 11. Functional Requirements

### Conversation Discovery

- The extension must discover at least the current conversation.
- It should discover visible sidebar conversations when available.
- It may later support opened-tab batch export.
- It must not promise full account sync in MVP.

### Extraction

- Extract role, text, Markdown-ish content, code blocks, links, and timestamps when available.
- Ignore ChatGPT UI chrome.
- Handle streaming/incomplete responses gracefully.
- Provide diagnostics when extraction is incomplete.

### Selection

- User can select/deselect individual message blocks.
- User can select all.
- User can select high-value marked content when available.
- Selection changes preview immediately.

### Templates

- Templates change structure, not source truth.
- MVP templates are deterministic.
- No AI distillation is required.

### Writing

- Primary writer uses File System Access API.
- Fallback writer uses `chrome.downloads`.
- Writer must support nested folders.
- Writer must avoid invalid filenames.
- Writer must show permission errors clearly.

### Privacy

- No server in MVP.
- No analytics by default.
- No remote code.
- No conversation content transmitted.
- Privacy policy required before Chrome Web Store release.

## 12. Non-functional Requirements

### Reliability

- Saved file must match preview.
- Failed writes must not corrupt existing files.
- Batch export should be resumable or at least clearly report failures.

### Performance

- Current conversation preview should render within 500ms after extraction for ordinary conversations.
- Large conversations should not freeze the page.
- Batch export should process sequentially or with conservative concurrency.

### Security

- Minimal host permissions.
- No `<all_urls>`.
- No remote scripts.
- No silent private API harvesting in MVP.
- Clear user consent before reading/saving conversations.

### Accessibility

- Keyboard navigable controls.
- Visible focus states.
- Readable labels.
- No icon-only controls without tooltips/labels.

## 13. Success Metrics

MVP success is measured by:

- user can save a current ChatGPT conversation directly into a test Obsidian Vault
- user can export selected turns only
- user can batch select at least currently visible/opened conversations
- re-export does not create duplicates by default
- user can understand what will be saved before saving
- no conversation data leaves local browser/device

## 14. Risks And Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| ChatGPT DOM changes | extraction breaks | layered selectors, fixture tests, diagnostics |
| File System Access unavailable | direct write unavailable | Downloads fallback, clear browser support copy |
| Permission expires | save fails | permission check before write, reauthorize button |
| Batch discovery unreliable | bad UX | start with visible/opened conversations, label advanced modes |
| Chrome Web Store review | rejection risk | minimal permissions, privacy policy, no remote code |
| User expects AI summary | scope creep | position source export first, distill later |

## 15. Release Milestones

### M0: Docs Confirmation

- Research, PRD, Architecture, UIUX complete.

### M1: Foundation

- MV3 TypeScript extension scaffold.
- React side panel/popup shell.
- Lucide icons declared.
- Basic build/test.

### M2: Current Conversation Export

- Extract current ChatGPT conversation.
- Generate Markdown.
- Preview and copy/download.

### M3: Vault Writer

- Directory picker.
- Permission persistence.
- Nested folder writer.
- Downloads fallback.

### M4: Selection And Templates

- Turn-level selection.
- Template switching.
- Frontmatter options.

### M5: Batch V1

- Visible/opened conversation list.
- Save plan.
- Batch write progress.

### M6: Store Readiness

- Privacy policy.
- Permissions audit.
- QA fixtures.
- Chrome Web Store package.
