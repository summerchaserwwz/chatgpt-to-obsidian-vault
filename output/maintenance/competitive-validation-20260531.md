# Competitive Validation Report: ChatGPT to Obsidian Vault

Date: 2026-05-31.

Status: implementation benchmark + local validation.

## Scope

This report compares the current extension against the active market around AI chat exporters and Obsidian capture tools.

Reviewed competitor categories:

- AI chat exporters: XWX AI Chat Exporter, ChatGPT Exporter, ChatCache, ChatShell, ChatKeep, SaveAIChat, Miromap, ChatExport AI, ExportChat, sAIve, GingerCat.
- Obsidian capture tools: official Obsidian Web Clipper.

Primary sources:

- XWX AI Chat Exporter: https://www.xwxexporter.com/
- ChatGPT Exporter Chrome Web Store listing: https://chromewebstore.google.com/detail/chatgpt-exporter-chatgpt/ilmdofdhpnhffldihboadndccenlnfll
- ChatCache: https://getchatcache.com/
- ChatShell: https://www.chatshellexport.com/
- ChatExport AI: https://chatexportai.com/
- ExportChat: https://exportchat.pages.dev/
- sAIve: https://getsaive.com/
- GingerCat: https://getgingercat.com/
- Obsidian Web Clipper help: https://obsidian.md/help/web-clipper
- Obsidian Web Clipper templates: https://obsidian.md/help/web-clipper/templates

## Market Pattern

Most AI chat exporters optimize for breadth:

- many AI platforms
- many output formats
- one-click current-chat export
- PDF/DOCX fidelity
- Markdown as one of several formats
- sometimes Notion sync

Most do not optimize for Obsidian as the system of record:

- direct vault folder writing is uncommon
- update-safe source hashes are uncommon
- Obsidian path templates and frontmatter are not usually primary
- selected recent/selected conversation scanning is less visible than current-chat export

Obsidian Web Clipper is excellent for general web capture:

- saves content to vault
- supports templates and variables
- is official, open source, and multi-browser
- is not specialized for ChatGPT conversation DOM, sidebar queue extraction, or turn-level export selection

## Current Product Position

Current completion estimate:

- Prototype completeness: 70-75%.
- MVP usability for a technical local user: 60-65%.
- Public Chrome Web Store readiness: 35-45%.
- Differentiation strength if scan/write paths are stabilized: high.

The product is already meaningfully different from generic exporters because it is Obsidian-first, not format-menu-first.

## Capability Matrix

| Capability | This product | Typical AI chat exporters | Obsidian Web Clipper |
| --- | --- | --- | --- |
| Current ChatGPT export | Implemented, needs more live regression | Strong | Indirect / page capture |
| Markdown output | Implemented | Strong | Strong |
| PDF / DOCX / PNG output | Not in scope | Strong | Not primary |
| Multi-AI platform support | Not in scope | Strong | General web |
| Direct Obsidian Vault write | Implemented via File System Access API | Usually weak or absent | Strong |
| Downloads fallback | Implemented | Strong | Not primary |
| Frontmatter / path template | Implemented | Mixed | Strong via templates |
| Turn/message selection | Implemented | Mixed | Not chat-specific |
| Sidebar discovery | Implemented | Mixed / unclear | Not chat-specific |
| Bounded batch scan | Implemented: recent 10/25/50, selected, all | Mixed | Not chat-specific |
| Update-safe export index | Implemented locally | Usually weak | Template-dependent |
| Failure diagnostics | Basic implemented | Mixed | Mature docs, not chat-specific |
| Store-ready polish | Not yet | Competitors stronger | Mature |

## Strengths

1. Obsidian-first workflow.
   The UI now explains Vault vs Downloads and supports direct folder writing.

2. Controlled scanning model.
   `Scan Recent`, `Scan Selected`, and explicit `All` are better aligned with real ChatGPT history scale than a single full-history scan.

3. Local-first architecture.
   The implementation uses page extraction, local Markdown formatting, local export index, File System Access API, and downloads fallback.

4. Update-safe thinking.
   Source hashes and export index put this closer to a repeatable knowledge-base pipeline than a one-off exporter.

5. Clearer template semantics.
   Templates now communicate structure differences instead of appearing like arbitrary large cards.

## Weaknesses / Gaps

1. Live ChatGPT DOM fragility is still the largest risk.
   ChatGPT changes DOM frequently. More live fixtures and regression captures are needed.

2. Batch scan UX still lacks progress granularity.
   The queue returns final results, but the UI does not yet show per-item live progress, cancel, retry failed, or estimated remaining time.

3. Direct Vault permission is not persisted across sessions.
   The writer stores the directory handle only in memory. A production-grade version should persist the handle in IndexedDB.

4. No public distribution hardening yet.
   Store listing, onboarding, privacy disclosure, permission minimization review, and extension error reporting are not production-ready.

5. Format breadth is intentionally weaker.
   Competitors beat this product on PDF, DOCX, PNG, CSV, JSON export menus and multi-platform coverage.

6. End-to-end live scan validation is incomplete.
   Local build and UI load are verified. Live `Scan Recent 10` should be run with explicit user approval because it opens real recent ChatGPT conversations.

## Test Evidence

Commands run:

```bash
node scripts/run-quality.mjs
node scripts/package-extension.mjs
```

Quality result:

- no emoji check: passed
- TypeScript typecheck: passed
- Vitest: 6 test files, 9 tests passed
- production build: passed
- dist verification: passed

Artifacts:

- `release/chatgpt-to-obsidian-vault-0.1.0.zip`
- `output/playwright/scan-controls-desktop-final.png`
- `output/playwright/scan-controls-narrow-final.png`

Browser validation:

- `chrome-extension://faebbndkeohehdhmadccnimkfenmpkbo/sidepanel.html` loads the new UI.
- New controls are visible:
  - `Choose Vault`
  - `Scan`
  - `Recent 10`
  - `Scan Recent`
  - `Scan Selected`
  - `All`
  - `全选当前`
  - `只选可导出`
  - `清空`
- Template descriptions and destination copy are visible.

Not yet verified:

- Real `Scan Recent 10` on the user's ChatGPT account.
- Real `Scan Selected` after selecting summary-only rows.
- Real direct write into an authorized Obsidian Vault folder.
- Retry behavior after failed conversation extraction.

## Verdict

Compared with current market products, the product is no longer a toy UI prototype. It has a credible differentiated spine: controlled ChatGPT extraction into Obsidian-ready local Markdown.

It is not yet production-complete. The gap is not design now; the gap is operational hardening:

- live scan reliability
- progress/cancel/retry
- persistent Vault permission
- real Vault write verification
- more extractor fixtures from actual ChatGPT pages
- packaged onboarding and privacy copy

Recommended next milestone:

1. Run live `Scan Recent 10`.
2. Select two summary-only rows and run `Scan Selected`.
3. Choose a temporary test Vault folder.
4. Write one active conversation and one batch export.
5. Save screenshots and generated Markdown as proof-pack.
6. Add regression fixtures from those real DOM paths.
