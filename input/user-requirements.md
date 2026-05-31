# User Requirements Input

Collected date: 2026-05-29.

This file preserves the product intent from the user conversation so the project can restart cleanly from source requirements instead of inheriting prototype drift.

## Original Problem

The user has many daily ChatGPT conversations and wants a way to preserve valuable content in Obsidian. The desired product is a browser extension, not a one-off script.

The extension should help the user:

- log into and use ChatGPT Web normally with their own account
- see a list of ChatGPT conversations
- select which conversations are worth saving
- for each selected conversation, choose which parts of the conversation should be exported
- export as clean Markdown that fits Obsidian conventions
- write files into a user-selected Obsidian vault folder
- avoid creating duplicate chaos when a conversation is exported again

## Product Shape

The user wants a Chrome/Edge browser extension with an integrated UI:

- left panel: ChatGPT conversation list
- middle panel: current selected conversation and selectable target conversation content
- right panel: export templates, metadata/frontmatter options, save policy, and a small export preview

The product should feel like a serious tool for knowledge capture. It must not feel like a rough ad overlay or a generic AI template.

## Required Core Features

1. ChatGPT conversation list
   - Show conversations available from the current ChatGPT context.
   - Support search/filter.
   - Support selecting multiple conversations for batch import.
   - Show status: new, updated, existing, conflict, failed.

2. Per-conversation content selection
   - Allow selecting which turns/messages/Q&A blocks are exported.
   - Support full conversation export.
   - Support selective export for only valuable turns.
   - Selection must update preview before saving.

3. Batch import
   - Batch export is a key function, not a secondary nice-to-have.
   - User must be able to choose which conversations to import.
   - Batch flow must show progress, saved count, skipped count, failed count, and needs-review count.

4. Obsidian Markdown output
   - Default output is a source file, not an AI summary.
   - Include Obsidian YAML properties/frontmatter.
   - Include source, time, conversation ID, source URL, exported time, message count, model when available, tags, and update metadata.
   - Preserve role structure: User / Assistant / System / Tool when applicable.
   - Preserve code blocks and Markdown formatting as much as possible.

5. Direct vault write
   - The user wants direct writing to an Obsidian vault directory.
   - The user should be able to input or choose the target directory.
   - Browser limitation: arbitrary absolute path writing cannot be silent. The user must authorize a directory through the browser picker where supported.
   - Downloads fallback is acceptable only as fallback, not as the product promise.

6. Save-before-write judgment
   - Before saving, the extension must decide whether each target file is new, updated, existing unchanged, or conflicting.
   - Use `conversation_id` and `source_hash` to detect existing files and updates.
   - Default behavior: same `conversation_id` plus changed `source_hash` means update the existing source file.
   - User can choose overwrite/update, save copy, or skip.

7. Templates
   - Export can include presets such as source archive, decision record, research note, coding/debug note.
   - MVP should not rely on a model to distill content.
   - Distillation can be a later optional API-powered feature.

8. UI direction
   - Must follow `awesome-design-md` inspiration, specifically an Apple-like minimalist frosted glass direction.
   - Apple design reference: white/pearl/parchment surfaces, Action Blue, SF system typography, hairline borders, capsule controls, restrained motion.
   - Avoid rough component sizing, loud colors, generic AI gradients, emoji icons, and card-wall slop.
   - Icons must come from Lucide/Heroicons/Tabler in implementation.

## User Position On Technical Tradeoffs

The user accepts:

- source-file export as default
- structured metadata instead of AI distillation in MVP
- direct vault write where the browser supports it
- fallback paths if browser security blocks direct writing
- batch export as a priority

The user questions:

- whether browser extensions can directly write to Vault
- whether full-history automatic sync is stable
- whether distillation can work without a structured model/API

The product answer should be:

- direct vault writing is feasible in Chromium via File System Access API after explicit user directory authorization
- `chrome.downloads` cannot write arbitrary absolute paths and only writes relative to Downloads
- full-history sync through private ChatGPT Web APIs is powerful but brittle
- MVP should avoid model distillation and private API dependency unless exposed as an advanced/risky mode

## Competitive References Mentioned

- ChatGPT to Obsidian by ChatGPT2Notion
- Superpower ChatGPT
- Obsidian Web Clipper
- ChatCollector
- Chat2Note
- Copyto
- AISaver

## Non-goals For MVP

- No server-side conversation storage.
- No default analytics.
- No AI summary/distill API requirement.
- No native companion app in MVP.
- No promise of true all-account auto-sync unless private API risk is accepted later.
- No Firefox/Safari parity in v1.
