# UI/UX Specification: ChatGPT to Obsidian Vault

Status: awaiting docs confirmation.

Date: 2026-05-31.

Design source: `awesome-design-md` VoltAgent reference, adapted for a local-first browser extension workbench.

## 1. Design Direction

ChatGPT to Obsidian Vault should feel like a developer-grade capture console:

- void-black canvas
- electric-green operational accents
- dense but readable three-panel workbench
- terminal-native preview surface
- precise thin borders
- no decorative marketing treatment

The product is an export control room, not a landing page and not a chat shell.

## 2. Visual Principles

1. The Markdown file is the deliverable, so the target path and preview need strong visual priority.
2. Batch scanning must be controllable: recent count, selected scan, and explicit full-history scan are different commands.
3. Status should be explicit and compact. Use chips, counters, and command buttons instead of explanatory blocks.
4. The extension should look engineered and trustworthy: thin borders, near-black surfaces, restrained motion, no fake sample content.
5. Controls should remain usable inside Chrome side panel widths; below 860px the workspace stacks vertically.

## 3. Locked Design System

### Icon Library

Use `lucide-react` only.

Rules:

- No emoji as functional icons or placeholders.
- Use icons inside command buttons and state surfaces.
- Keep icon size between 15px and 18px for this compact extension UI.

### Typography

Primary stack:

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Mono stack:

```css
font-family: "SF Mono", SFMono-Regular, ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
```

Scale:

| Token | Size | Weight | Use |
| --- | --- | --- | --- |
| product-title | 14px | 650 | top bar title |
| panel-title | 16px | 650 | panel headings |
| row-title | 13px | 650 | conversation/template/message titles |
| body | 13px | 400 | dense UI copy |
| caption | 12px | 400 | metadata |
| mono-label | 11px | 650 | step labels, counters, chips |
| preview | 12px | 400 | Markdown preview and paths |

Rules:

- No viewport-based font scaling.
- Letter spacing remains `0` except uppercase mono labels, which may use `0.08em`.
- Long URLs, paths, IDs, and message excerpts must wrap or ellipsize without overlapping controls.

### Color Tokens

```css
--cv-canvas: #101010;
--cv-surface: #151515;
--cv-surface-2: #1a1a1a;
--cv-surface-3: #202020;
--cv-ink: #f2f2f2;
--cv-ink-strong: #ffffff;
--cv-muted: #bdbdbd;
--cv-muted-2: #8b949e;
--cv-hairline: #3d3a39;
--cv-hairline-soft: #2a2a2a;
--cv-action: #00d992;
--cv-action-soft: #2fd6a1;
--cv-action-deep: #10b981;
--cv-on-action: #101010;
--cv-warning: #f59e0b;
--cv-danger: #f87171;
--cv-info: #60a5fa;
```

Rules:

- Electric green is the only primary product accent.
- Warning, danger, and info are semantic only.
- Avoid purple/pink gradients, decorative blobs, frosted glass, and large rounded Apple-style pills.
- Surfaces stay near-black; hierarchy comes from border, contrast, and spacing.

### Radius

| Token | Value | Use |
| --- | --- | --- |
| xs | 4px | chips, tiny controls |
| sm | 6px | buttons, inputs |
| md | 8px | rows, repeated cards, panels |
| pill | 9999px | status chips only |

### Spacing

Base unit: 4px.

Common values: 4, 6, 8, 10, 12, 16, 20, 24.

Density target:

- 56px top bar on desktop widths.
- 12-16px panel padding.
- 8px row gaps.
- Stable control heights: 32-40px.

## 4. Component Ecosystem

Use the existing React + custom CSS implementation.

Do not introduce a new UI component library for this redesign. The extension already uses a compact component set and `lucide-react`; the redesign should harden those primitives instead of adding dependency surface area.

Core components:

- `topbar`: sticky command strip with brand, vault state, scan current, recent count, scan recent, scan selected, explicit all scan, and write actions.
- `panel`: first-level workbench surface; no card nesting inside panels except repeated rows and preview/tool surfaces.
- `secondary-button`: bordered command button.
- `primary-button`: electric-green command button.
- `search-box`: dark input with icon.
- `segmented`: compact tab control for filters.
- `conversation-row`: selectable export target.
- `turn-card`: selectable message turn.
- `template-card`: export template option.
- `save-plan`: target path/status surface.
- `markdown-preview`: terminal-like text area.
- `toast`: bordered operational status message.

## 5. Page Skeleton

```text
┌────────────────────────────────────────────────────────────┐
│ Command Strip: brand / vault state / Scan / Recent / Selected / All / Write│
├───────────────┬────────────────────────┬───────────────────┤
│ Conversations │ Conversation Content   │ Template + Preview│
│ discovery     │ turn selection         │ save plan          │
└───────────────┴────────────────────────┴───────────────────┘
```

Desktop grid:

- left: 320px
- middle: minmax(440px, 1fr)
- right: 420px

Responsive:

- below 1260px: right panel drops below the first two panels.
- below 860px: topbar and all panels stack vertically for Chrome side panel use.

## 6. Interaction Rules

### Scan

- `Scan` reads the current ChatGPT tab and sidebar summaries.
- It must not imply sidebar summaries are full exports.
- Empty state must tell the user to open a real ChatGPT page.

### Scan Recent / Selected / All

- `Scan Recent` scans the latest selected count: 10, 25, or 50.
- `Scan Selected` scans checked conversation rows, including summary-only rows.
- `All` is intentionally short and secondary because it can take a long time.
- Scan buttons are disabled while scanning.
- Toast must report full scans, summaries, and failures separately when available.
- The left list must provide `全选当前`, `只选可导出`, and `清空` controls.
- Summary-only rows are selectable so users can stage a scan before full extraction.

### Templates

- Template cards must be compact enough for the side panel.
- Each template must show both a short label and a concrete purpose:
  - Source Archive: original archive.
  - Decision Record: decision/action scaffold.
  - Research Note: research/open-question scaffold.
  - Coding / Debug Note: debugging scaffold.
- Add a small helper note that templates change Markdown structure, not the original conversation content.

### Save Destination

- `Downloads fallback` means Chrome will save under the browser Downloads directory.
- `Choose Vault` requests direct write permission through the File System Access API.
- The save-plan surface must state which destination is currently active.

### Export

- Primary action writes the active conversation.
- Batch action writes selected conversations with extracted full messages.
- Batch write ignores summary-only rows and warns the user to scan selected summaries first.

## 7. Accessibility And Layout Guardrails

- Every interactive control keeps a visible `:focus-visible` outline in electric green.
- Buttons must not rely on color alone; keep icon plus text.
- Text in rows ellipsizes or wraps with `overflow-wrap: anywhere`.
- Preview and path fields use mono text and stable dimensions.
- No nested UI cards; repeated rows and template choices are allowed cards.
