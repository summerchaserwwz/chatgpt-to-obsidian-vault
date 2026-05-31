# Real ChatGPT Debug Evidence

- Date: 2026-05-29
- Host: Codex Desktop
- Tools: Computer Use, local terminal
- Playwright status: blocked because `npx` is not available in the current Codex PATH.

## Scope

Validated the extension against a real logged-in `chatgpt.com/c/...` conversation, not demo data.

## Findings

1. Initial user-visible failure was real:
   - Side panel showed `Could not establish connection. Receiving end does not exist.`
   - Root cause: Chrome had an older unpacked extension instance / existing ChatGPT tab without the content script.

2. Scan path now works after reloading the unpacked extension:
   - Active tab: `https://chatgpt.com/c/6a184621-d014-8321-b14e-aa2aa3a420ee`
   - Side panel result: `已扫描当前 ChatGPT 会话。`
   - Extracted: 1 conversation, 7/7 turns.
   - No demo conversation was used.

3. Write path initially hung:
   - `Write Vault` became disabled and no file appeared in `~/Downloads`.
   - Root cause: MV3 service worker download code used `URL.createObjectURL`, which is not reliable in extension service workers.

4. Write path after fix:
   - Side panel result: `Markdown sent to browser Downloads.`
   - Chrome download bubble showed the markdown download completed.
   - File created:
     `/Users/summer/Downloads/AI/ChatGPT/2026/05/2026-05-29 - 一、最简单方案 直接导出 ChatGPT 数据.md`
   - Size: 34,858 bytes.
   - Verified file begins with ChatGPT frontmatter including `conversation_id`, `source_url`, `message_count: 7`, and `selected_message_count: 7`.

## Code Changes

- `public/manifest.json`: includes `scripting` permission for content script reinjection.
- `src/background/service-worker.ts`:
  - catches scan/download message failures and responds instead of leaving the side panel hanging.
  - reinjects `assets/chatgpt-entry.js` when `Receiving end does not exist` occurs.
  - uses a `data:text/markdown;charset=utf-8` URL for browser downloads.
- `src/sidepanel/SidePanelApp.tsx`:
  - wraps single and batch write flows in `try/finally` so `isWriting` always resets.

## Quality Gate

Passed:

- no emoji check
- TypeScript typecheck
- Vitest: 5 files / 7 tests
- Vite production build
- dist verification
- extension package regenerated at `release/chatgpt-to-obsidian-vault-0.1.0.zip`
