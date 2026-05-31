# Delivery Evidence: ChatGPT to Obsidian Vault MVP

Date: 2026-05-29T15:23:52+0800

## Scope

Implemented a local-first Chromium MV3 extension MVP with a React/Vite side-panel workbench for exporting selected ChatGPT conversations to Obsidian-ready Markdown.

## Implemented

- React/Vite/TypeScript project scaffold.
- Manifest V3 extension entries:
  - `dist/manifest.json`
  - `dist/sidepanel.html`
  - `dist/options.html`
  - `dist/assets/service-worker.js`
  - `dist/assets/chatgpt-entry.js`
- Lucide React icon system.
- Apple-like `--cv-*` design token system from UIUX.
- Three-panel workspace:
  - conversation list with search, status filters, and multi-select
  - turn-level message selection
  - template, path, write policy, options, and Markdown preview
- Obsidian Markdown formatting with flat YAML properties.
- Source hash generation.
- Path-template rendering.
- Save-plan status detection.
- File System Access writer facade.
- Downloads fallback writer.
- Local export index storage.
- ChatGPT DOM extraction layer.
- Options page with privacy and Vault authorization explanation.

## Quality Evidence

Command: `node /private/tmp/codex-npm/package/bin/npm-cli.js run quality`

Result: pass.

Covered steps:

- no emoji source check: pass
- TypeScript typecheck: pass
- Vitest unit tests: pass
- production build: pass

Unit test result:

- 5 test files passed
- 7 tests passed

Build result:

- Vite 6.4.2 production build passed
- `dist/manifest.json` and extension assets generated

Security audit:

- Command: `node /private/tmp/codex-npm/package/bin/npm-cli.js audit`
- Result: `found 0 vulnerabilities`

Runtime smoke:

- Dev server started at `http://127.0.0.1:5174/`
- `sidepanel.html` returned valid HTML
- sidepanel module returned valid transformed Vite module

## Computer Use Acceptance

Tool: Computer Use against Google Chrome.

Acceptance observations:

- Opened `http://127.0.0.1:5174/sidepanel.html` in Chrome.
- Verified the app title `ChatGPT to Obsidian Vault` rendered.
- Verified top bar showed `Downloads fallback`, `Scan`, and `Write Vault`.
- Verified left panel rendered conversation list, search, filters, selected count, checkboxes, and status chips.
- Verified middle panel rendered active conversation and turn-level checkboxes.
- Verified right panel rendered template cards, target path, write policy, export option toggles, save plan, copy action, Markdown preview, and batch action.
- Clicked `Research Note`; Markdown preview changed `template` to `research_note` and added `Research Notes`.
- Unchecked the fourth assistant turn; selected turn count changed from `4/4 turns` to `3/4 turns`.
- Markdown preview frontmatter changed `selected_message_count` from `4` to `3`.
- Markdown preview transcript removed the deselected message.

Acceptance result: pass.

## Remaining Product Notes

- Real direct Vault writing requires a user gesture and browser folder picker, so the writer is implemented but not exercised through folder selection in automated Computer Use.
- Live ChatGPT extraction is implemented through the content script and will run only on matched ChatGPT host pages.

## Delivery Hardening Update

Date: 2026-05-29T15:28:36+0800

Additional artifacts:

- Added `scripts/verify-dist.mjs`.
- Added `scripts/package-extension.mjs`.
- Added `docs/extension-install.md`.
- Updated `quality` to include production dist verification.
- Packaged extension archive:
  - `release/chatgpt-to-obsidian-vault-0.1.0.zip`

Additional verification:

- `node /private/tmp/codex-npm/package/bin/npm-cli.js run quality`: pass
- `node /private/tmp/codex-npm/package/bin/npm-cli.js audit`: `found 0 vulnerabilities`
- `node /private/tmp/codex-npm/package/bin/npm-cli.js run package:extension`: pass
- Zip contents verified:
  - `manifest.json` is at archive root
  - no `._` AppleDouble files
  - extension assets are packaged under `assets/`

## Chrome and Computer Use Recheck

Date: 2026-05-29T15:40:29+0800

User request: continue, complete, open and test with `@chrome` and computer.

Chrome plugin-backed verification:

- Connected to the user's Chrome browser through the Chrome plugin backend.
- Opened `http://127.0.0.1:5174/sidepanel.html`.
- Verified page title: `ChatGPT to Obsidian Vault`.
- Verified top bar: `Downloads fallback`, `Scan`, `Write Vault`.
- Verified all three panels are visible:
  - `会话列表`
  - `选择要导出的对话内容`
  - `模板与预览`
- Verified Markdown preview exists.
- Clicked `Research Note`.
- Unchecked the last assistant turn.
- Verified selected turn count is `3/4 turns`.
- Verified preview frontmatter contains `template: "research_note"`.
- Verified preview frontmatter contains `selected_message_count: 3`.
- Verified the deselected fourth message was removed from the transcript.
- Verified Chrome console errors: none.

Computer Use verification:

- Brought the Chrome tab to the front through Computer Use.
- Confirmed the visible page is `127.0.0.1:5174/sidepanel.html`.
- Confirmed the visible state shows:
  - `ChatGPT to Obsidian Vault`
  - `3/4 turns`
  - `Research Note`
  - `selected_message_count: 3`
  - `Write Vault`
  - `Copy`

Recheck result: pass.

## Real ChatGPT Data Correction

Date: 2026-05-29T16:00:15+0800

Issue found by user:

- The visible conversations in the previous UI acceptance were demo data, not extracted from ChatGPT Web.

Fix:

- Removed automatic demo conversations from the side-panel UI.
- The product now starts empty with explicit copy:
  - `还没有真实 ChatGPT 会话`
  - `打开一个 chatgpt.com 会话标签页，然后点击 Scan。这里不会再自动展示示例数据。`
- `Write Vault` and `Batch` remain disabled until a real conversation is scanned.
- Markdown preview now shows `未扫描真实 ChatGPT 会话。` before real extraction.

Verification:

- `node /private/tmp/codex-npm/package/bin/npm-cli.js run quality`: pass
- `node /private/tmp/codex-npm/package/bin/npm-cli.js audit`: `found 0 vulnerabilities`
- `node /private/tmp/codex-npm/package/bin/npm-cli.js run package:extension`: pass
- Computer Use confirmed the updated empty state in Chrome at `127.0.0.1:5174/sidepanel.html`.

Blocked real-data check:

- Opened `https://chatgpt.com/` in Chrome, but the page was black/blank in the controlled browser window and exposed no visible ChatGPT conversation content for extraction.
- The Chrome plugin backend refused navigation to `chrome://extensions/` by browser security policy, so automated loading of the unpacked extension through the Chrome extension manager was not performed.

Required manual step:

- Load `/Users/summer/Documents/chatgpt-to-obsidian-vault/dist` from `chrome://extensions`.
- Open a concrete `chatgpt.com/c/...` conversation page.
- Click `Scan` in the extension side panel.
