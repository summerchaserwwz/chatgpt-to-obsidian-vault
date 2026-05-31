# Host Onboard Smoke Guide

- Generated At: 2026-05-29T06:32:25.592908+00:00
- Project: /Users/summer/Documents/chatgpt-to-obsidian-vault
- Install Scope: project surfaces only
- Status: ok

## Codex

- Status: ready
- Standard Flow First Prompt: `/super-dev 你的需求`
- Competition Flow First Prompt: `/super-dev-seeai 比赛需求`
- Install Scope: project surfaces only

### Start Playbook
- 起手建议: App/Desktop 优先从 / 列表里的 super-dev 进入，不要先退回普通聊天。
- 避免动作: 不要把桌面端入口和 CLI 的 $super-dev 混成同一个宿主。

### Post-Onboard Self-Check
- Codex 接入后先确认入口可用: /super-dev 你的需求 / super-dev: 你的需求
- Codex 接入后再确认 SEEAI 项目补充面已写入: .agents/skills/super-dev-seeai/SKILL.md / plugins/super-dev-codex/skills/super-dev-seeai/SKILL.md
- Codex 接入后再确认 SEEAI 用户级补充面已写入: ~/.agents/skills/super-dev-seeai/SKILL.md

### Official Workflow Checks
- 确认 Codex 按 official-skill 官方协议面真实加载 Super Dev，而不是只检测到文件存在。
- 确认官方接入面真实生效: 项目侧 AGENTS.md / .agents/skills/super-dev/SKILL.md；用户侧 ~/.agents/skills/super-dev/SKILL.md
- 如启用当前增强接入面，再确认: 项目侧 .agents/plugins/marketplace.json / plugins/super-dev-codex/.codex-plugin/plugin.json；用户侧 ~/.codex/AGENTS.md
- 确认 SEEAI 项目补充面真实生效: .agents/skills/super-dev-seeai/SKILL.md / plugins/super-dev-codex/skills/super-dev-seeai/SKILL.md
- 确认 SEEAI 用户级补充面真实生效: ~/.agents/skills/super-dev-seeai/SKILL.md
- 确认 Codex App/Desktop 的 / 列表 super-dev 真实可用，并已读取仓库 AGENTS 与 Skills。

### Official Pass Criteria
- Codex 官方工作流面、入口链、恢复链与 SEEAI 补充面均已真人验收通过。
- 确认 Codex 按 official-skill 官方协议面真实加载 Super Dev，而不是只检测到文件存在。
- 确认官方接入面真实生效: 项目侧 AGENTS.md / .agents/skills/super-dev/SKILL.md；用户侧 ~/.agents/skills/super-dev/SKILL.md
- 如启用当前增强接入面，再确认: 项目侧 .agents/plugins/marketplace.json / plugins/super-dev-codex/.codex-plugin/plugin.json；用户侧 ~/.codex/AGENTS.md

### Resume Guidance
- 优先入口: /super-dev 你的需求 / super-dev: 你的需求
- 原生恢复: /super-dev 继续当前流程 / 回当前 Codex 会话继续
- 优先沿用当前 Skill / session 入口，不要先退回普通聊天。

### Repair Playbook
-

### SEEAI Project Supplements
- `.agents/skills/super-dev-seeai/SKILL.md`
- `plugins/super-dev-codex/skills/super-dev-seeai/SKILL.md`

### SEEAI User Supplements
- `~/.agents/skills/super-dev-seeai/SKILL.md`

### Written Surfaces
- `/Users/summer/Documents/chatgpt-to-obsidian-vault/AGENTS.md`
