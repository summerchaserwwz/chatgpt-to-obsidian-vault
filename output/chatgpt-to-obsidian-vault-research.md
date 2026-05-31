# Research Report: ChatGPT to Obsidian Vault

Research date: 2026-05-29.

Current Super Dev phase: `research`.

## Executive Summary

There is strong evidence that the "AI conversation to Markdown/Obsidian" category exists and is already crowded. The open space is not simple Markdown download. The open space is a calmer Obsidian-first import workflow that gives the user control before writing:

- choose conversations from a list
- choose specific turns/content inside each conversation
- apply a template
- preview exactly what will be written
- write directly to a Vault folder when browser security allows it
- update existing notes predictably instead of creating duplicate files

The product should not compete as another "export as .md" button. It should compete as a local-first ChatGPT-to-Obsidian ingestion pipeline.

## Local Knowledge Discovery

The existing workspace had prior exploratory documents for a product named ChatGPT to Obsidian Vault:

- `docs/research.md`
- `docs/product-spec.md`
- `docs/architecture.md`
- `DESIGN.md`
- an Apple-style interactive prototype in `prototype/`
- a small MV3 extension scaffold in `extension/`

Important inherited conclusions:

1. Direct writing to arbitrary local paths is not possible with `chrome.downloads`.
2. Direct writing to an Obsidian Vault should use File System Access API in Chromium.
3. Downloads folder export remains a fallback.
4. Full ChatGPT account auto-sync is technically possible through private ChatGPT Web APIs, but risky.
5. The user cares more about batch import, save judgment, and Obsidian metadata than about AI summarization.
6. UI direction changed from utilitarian to Apple-like minimalist frosted glass.

No `knowledge/` directory or `output/knowledge-cache/*-knowledge-bundle.json` was present in the current workspace.

## User Need

The user chats heavily in ChatGPT and needs a way to capture valuable conversation content into Obsidian without manual copy/paste. The pain is not only export. The pain is deciding what is worth keeping, getting clean files, and avoiding duplicate or stale notes.

Key user jobs:

- "I want to preserve useful ChatGPT conversations in my Obsidian vault."
- "I want to select which conversations and which parts of each conversation matter."
- "I want batch import to be comfortable."
- "I want the final `.md` files to already be Obsidian-compliant."
- "I want updates to overwrite or merge intelligently instead of creating many duplicates."

## Competitive Landscape

### ChatGPT to Obsidian / Save ChatGPT to Obsidian Markdown

The product positions directly around exporting ChatGPT conversations as Markdown to Obsidian. Its page claims bulk export, selective export, group chat support, flexible naming, image download, and local/private behavior. Its own FAQ states that files are saved to `Downloads/{folder}` and the user then manually moves them into the vault. This is the most direct competitor and the clearest wedge: ChatGPT to Obsidian Vault should make "direct vault write plus update judgment" the core promise.

Sources:

- https://www.chatgpt2notion.com/products/chatgpt-to-obsidian/
- https://chromewebstore.google.com/detail/save-chatgpt-to-obsidian/bdkpamdmcgamabdeaeehfmaiaejcdfko

### Superpower ChatGPT

Superpower ChatGPT is closer to "ChatGPT++" than an Obsidian exporter. It offers folders, search, local sync, prompt library, timestamps, export, and many UI augmentations. Its repo and source show an approach based on injected content scripts, a page-context fetch interceptor, captured ChatGPT Web session token, private `backend-api` calls, local Chrome storage, and export to Markdown/JSON/Text/ZIP.

Useful lessons:

- local sync makes search and batch export powerful
- selected conversation lists and progress UI are proven interaction patterns
- private ChatGPT Web APIs unlock history export, but introduce fragility and review risk

The product should borrow the queue and export mechanics, not the whole broad "ChatGPT++" scope.

Source:

- https://github.com/saeedezzati/superpower-chatgpt

### ChatCollector

ChatCollector is a multi-platform AI chat exporter. It supports many AI platforms, exports to Markdown, and optionally supports AI summarization. Its public page emphasizes local browser operation and broad platform support. It is a broad horizontal exporter, not an Obsidian-specific vault ingestion product.

Source:

- https://www.chatcollector.com/

### Chat2Note

Chat2Note is another privacy-first multi-platform AI conversation exporter. It advertises ChatGPT, Claude, Gemini, DeepSeek, Kimi, Yuanbao, Doubao, and Grok support, with export to Markdown, JSON, text, Notion, Obsidian, local files, and clipboard. It validates that "multi-destination AI conversation export" is a real category, but also shows the danger of becoming too broad too early.

Source:

- https://chat2note.com/

### Copyto

Copyto targets a wide Chinese/international market and frames AI chats as content that can be exported to Notion, Obsidian, NotebookLM, Markdown, Docs, PDF, PNG, and more. It appears more content-workflow and monetization oriented. ChatGPT to Obsidian Vault should avoid chasing all formats in MVP.

Source:

- https://copyto.org/

### AISaver

AISaver emphasizes bulk export for ChatGPT history, opened tabs, project conversations, Notion, Markdown, PDF, and Obsidian-friendly workflows. It confirms that Projects-aware export and opened-tabs batch export are valuable differentiators in the market.

Source:

- https://aisaver.app/chatgpt/

### Obsidian Web Clipper

Obsidian Web Clipper is official and trusted, with template behavior such as creating new notes, adding to existing notes, adding to daily notes, and automatic template triggers. It is generic web clipping, not ChatGPT conversation-specific capture. ChatGPT to Obsidian Vault should learn from its template model but provide conversation-specific selectors and metadata.

Source:

- https://obsidian.md/help/web-clipper/templates

## Technical Research

### Chrome Downloads API Limitation

The Chrome downloads API can specify a target filename only as a path relative to the user's default Downloads directory. Absolute paths, empty paths, and paths containing `..` are ignored. Therefore, a Chrome extension cannot simply accept `~/Obsidian/Vault/AI` or `D:\Vault\AI` and write there through `chrome.downloads`.

Source:

- https://developer.chrome.com/docs/extensions/reference/api/downloads

Implication:

- Downloads export is not enough for the user's desired "direct vault write" experience.
- It can remain a fallback.

### File System Access API

`showDirectoryPicker()` lets a site/app ask the user to select a directory. MDN marks it experimental and limited-availability, and it requires secure context. It supports `mode: "readwrite"` for read/write access. In Chromium extension surfaces, this is the strongest route for direct vault writing after explicit user authorization.

Sources:

- https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker
- https://developer.chrome.com/docs/capabilities/web-apis/file-system-access

Implication:

- MVP should target Chromium browsers first.
- The extension must ask the user to choose a Vault or subfolder.
- Permission checks and reauthorization must be first-class UX.

### Chrome MV3 Architecture

Chrome Manifest V3 uses service workers instead of long-lived background pages and forbids remotely hosted extension code. Content scripts run in isolated worlds and need message passing to reach extension APIs they cannot access directly.

Sources:

- https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3
- https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts
- https://developer.chrome.com/docs/extensions/reference/manifest

Implication:

- The content script should extract and render the in-page UI.
- Background/service worker should handle routing, downloads fallback, batch tab orchestration, and permissions that require extension APIs.
- State must not assume long-lived service worker memory.

### Obsidian Properties / Frontmatter

Obsidian properties are stored as YAML at the top of Markdown files. Tags should be formatted as a YAML list under `tags`. The product should use simple atomic properties. Avoid long multi-paragraph values and avoid nested frontmatter where possible because Obsidian notes that nested properties are not fully supported in normal property views.

Source:

- https://obsidian.md/help/properties

Implication:

- Metadata should be flat and stable.
- Use `chatvault_*` names or a flat `chatvault_status` style rather than deeply nested YAML.

### Obsidian URI

Obsidian URI can open notes, create notes, append, overwrite, and choose/open vaults. Values must be URI encoded. It is useful for "open saved file in Obsidian" and small fallback actions, but large bulk content through a URL is a poor primary write mechanism.

Source:

- https://obsidian.md/help/Extending%2BObsidian/Obsidian%2BURI

Implication:

- Use Obsidian URI after direct file save to open a note.
- Do not use URI as the primary bulk writer.

### Official ChatGPT Export

OpenAI provides an official account data export flow through ChatGPT settings or the Privacy Portal. As of the opened official help page, exports can take time, email links expire after 24 hours, and chat exports are not available for ChatGPT Business or Enterprise accounts.

Source:

- https://help.openai.com/en/articles/7260999-how-do-i-export-my-chatgpt-history-and-data

Implication:

- Official export ZIP import can be a later "historical import" route.
- It is not the right UX for live capture while inside ChatGPT.

### Chrome Web Store Privacy

Chrome Web Store policy requires prominent disclosure and consent when personal or sensitive user data handling is not closely related to a clearly described feature. It also states that products handling sensitive user information need a privacy policy, even if data is stored locally.

Source:

- https://developer.chrome.com/docs/webstore/program-policies/user-data-faq

Implication:

- ChatGPT conversation content is sensitive user-generated content/personal communication.
- Store listing, onboarding, and privacy policy must plainly state local-only processing.
- No analytics in MVP unless explicitly optional and privacy-reviewed.

## Feasibility Findings

### Can the browser extension write directly to an Obsidian Vault?

Yes, in Chromium-based browsers, if the user explicitly chooses the Vault directory or a subfolder through File System Access API and grants read/write permission. No, not by silently writing an arbitrary absolute path through `chrome.downloads`.

### Can it batch export?

Yes, with constraints:

- safe MVP: batch export from visible/currently opened conversations or explicit user-opened queue
- advanced mode: private ChatGPT Web API history sync, with clear risk labeling

### Can it distill without a model/API?

Not reliably. It can template, segment, and preserve source content without an LLM. It cannot produce trustworthy summaries, decisions, or distilled insights unless using a model or rule-based heuristics. MVP should focus on source capture and metadata.

## Product Opportunity

The winning product angle is "source-controlled knowledge capture for Obsidian":

- not generic clipping
- not broad AI-platform export
- not ChatGPT++ feature bloat
- not a simple Downloads export

The sharp wedge:

1. precise selection
2. Obsidian-native metadata
3. direct Vault writing
4. idempotent updates
5. batch queue with save judgment
6. beautiful low-friction UI

## Recommended MVP

Build a Chromium MV3 extension with:

- ChatGPT page content script
- Apple-inspired three-panel side panel or overlay
- conversation list from visible sidebar/open tabs
- current conversation extraction
- turn-level selection
- template presets
- Obsidian Markdown preview
- File System Access API writer
- Downloads fallback
- export index in local storage/IndexedDB
- save judgment by `conversation_id` and `source_hash`

Do not promise:

- full account auto-sync
- cross-browser parity
- AI summarization
- Notion/PDF/DOCX export
- native companion app

## Research References

- ChatGPT to Obsidian product page: https://www.chatgpt2notion.com/products/chatgpt-to-obsidian/
- Save ChatGPT to Obsidian Chrome Web Store: https://chromewebstore.google.com/detail/save-chatgpt-to-obsidian/bdkpamdmcgamabdeaeehfmaiaejcdfko
- Superpower ChatGPT: https://github.com/saeedezzati/superpower-chatgpt
- ChatCollector: https://www.chatcollector.com/
- Chat2Note: https://chat2note.com/
- Copyto: https://copyto.org/
- AISaver: https://aisaver.app/chatgpt/
- Chrome downloads API: https://developer.chrome.com/docs/extensions/reference/api/downloads
- MDN `showDirectoryPicker`: https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker
- Chrome Manifest V3: https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3
- Chrome content scripts: https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts
- Obsidian properties: https://obsidian.md/help/properties
- Obsidian URI: https://obsidian.md/help/Extending%2BObsidian/Obsidian%2BURI
- Obsidian Web Clipper templates: https://obsidian.md/help/web-clipper/templates
- OpenAI ChatGPT data export: https://help.openai.com/en/articles/7260999-how-do-i-export-my-chatgpt-history-and-data
- Chrome Web Store user data FAQ: https://developer.chrome.com/docs/webstore/program-policies/user-data-faq
