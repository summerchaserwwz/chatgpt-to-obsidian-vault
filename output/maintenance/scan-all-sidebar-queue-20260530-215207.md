# Scan All Sidebar Queue Maintenance Note

Date: 2026-05-30 21:52 Asia/Shanghai

## Change Summary

- Added `Scan All` as the intended full-history workflow in PRD, architecture, and UI/UX docs.
- Updated deep sidebar scanning so discovered conversation links are accumulated across scroll positions.
- Preserved the core architecture constraint: ChatGPT sidebar rows provide title/URL metadata only; full Markdown export requires loading each conversation page.
- Existing background queue opens each sidebar conversation URL in an inactive tab, extracts the page DOM, closes the temporary tab, and returns full conversations plus failures.
- Added a regression test for virtualized sidebars where different links appear at different scroll positions.

## Validation Completed

Command:

```bash
node scripts/run-quality.mjs
```

Result:

- no-emoji: passed
- typecheck: passed
- tests: 6 files passed, 8 tests passed
- Vite build: passed
- dist verification: passed

Packaging:

```bash
node scripts/package-extension.mjs
```

Result:

- `release/chatgpt-to-obsidian-vault-0.1.0.zip` regenerated.

## Real Chrome Status

Computer Use was opened against the real Chrome profile, but the browser was actively being used in parallel and each attempted action was interrupted by external tab changes. I stopped before forcing additional clicks because that would risk disrupting active work in the user's Chrome session.

Real ChatGPT validation is therefore still pending:

- Reload unpacked extension from `dist/`.
- Open an authenticated `https://chatgpt.com/c/...` tab.
- Open the extension side panel.
- Confirm `Scan All` appears.
- Click `Scan All`.
- Confirm it scans multiple real conversations and reports failure count.
- Run a batch export and inspect downloaded Markdown.
