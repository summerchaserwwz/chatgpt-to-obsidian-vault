# ChatGPT to Obsidian Vault

一个本地优先的 Chrome / Edge 扩展，用来把 ChatGPT 会话导出成 Markdown、TXT、JSON、CSV、HTML、Word-compatible `.doc` 等文件，并保留 Obsidian Vault 直写能力。

它不是普通的“下载聊天记录”按钮，而是一个面向 Obsidian 知识库的导入工作台：

- 扫描当前 ChatGPT 会话
- 读取侧边栏会话摘要
- 按最近 10 / 25 / 50 条扫描全文
- 只扫描勾选的会话
- 选择要导出的消息轮次
- 选择导出格式
- 选择 Markdown 模板
- 生成 YAML frontmatter
- 预览最终文件内容
- 直接写入 Obsidian Vault，或回退保存到浏览器 Downloads

## 当前状态

当前版本：`0.1.0`

项目处于 MVP 验证阶段：

- 已完成主要 UI 和本地导出链路
- 已支持 `Scan Recent` / `Scan Selected` / `All`
- 已支持 Markdown、TXT、JSON、CSV、HTML、Word-compatible `.doc`
- 已支持 Obsidian 路径模板和 frontmatter
- 已通过本地质量门
- 仍需要继续强化真实 ChatGPT DOM 兼容、批量扫描进度、失败重试、Vault 权限持久化、PDF/截图/ZIP 导出

## 功能概览

### 扫描

| 操作 | 说明 |
| --- | --- |
| `Scan` | 扫描当前打开的 ChatGPT 会话，并读取侧边栏摘要 |
| `Scan Recent` | 扫描最近 10 / 25 / 50 条侧边栏会话全文 |
| `Scan Selected` | 只扫描左侧已勾选的会话 |
| `All` | 扫描全部发现的侧边栏会话，可能较慢 |

说明：

- ChatGPT 侧边栏通常只有标题和链接，没有完整正文。
- 要导出完整文件，扩展必须打开对应会话页面并抽取真实消息内容。
- 所以全量扫描会比较慢，推荐先用 `Scan Recent` 或 `Scan Selected`。

### 导出格式

| 格式 | 扩展名 | 说明 |
| --- | --- | --- |
| Markdown | `.md` | Obsidian 优先，支持 frontmatter 和模板 |
| Text | `.txt` | 纯文本转写，适合检索和长期归档 |
| JSON | `.json` | 结构化数据，适合自动化处理 |
| CSV | `.csv` | 一条消息一行，适合表格分析 |
| HTML | `.html` | 可浏览的单文件文档 |
| Word | `.doc` | Word 可打开的 HTML 文档 |

说明：当前版本没有假装支持 PDF、截图或 ZIP。它们需要单独的渲染、截图和打包管线，会作为下一阶段能力实现。

### 模板

| 模板 | 用途 |
| --- | --- |
| Source Archive | 原样归档完整对话、来源链接、元数据和逐轮转写 |
| Decision Record | 把对话整理成背景、选项、结论和后续行动 |
| Research Note | 整理资料、引用、发现、待验证问题和开放问题 |
| Coding / Debug Note | 保留错误现象、假设、修复动作和验证步骤 |

模板主要改变 Markdown 的结构；其他格式会按所选消息输出，不会改写原始对话内容。

### 保存位置

默认状态是 `Downloads fallback`：

- 文件会保存到浏览器 Downloads 目录下。
- 这是 Chrome 下载 API 的限制。

点击 `Choose Vault` 后：

- 浏览器会弹出文件夹选择器。
- 选择你的 Obsidian Vault 或某个子目录。
- 授权成功后，扩展可以直接写入该文件夹。

## 安装使用

### 1. 安装依赖

```bash
npm install
```

当前环境里如果没有 `npm`，但 Codex/App 自带 Node 仍能运行脚本；普通开发环境建议直接安装 Node.js LTS。

### 2. 本地开发预览

```bash
npm run dev -- --port 5174
```

打开：

```text
http://127.0.0.1:5174/sidepanel.html
```

开发预览只能看 UI，不能完整模拟 Chrome 扩展权限。

### 3. 构建扩展

```bash
npm run build
npm run verify:dist
```

构建产物会生成到：

```text
dist/
```

### 4. 在 Chrome / Edge 加载未打包扩展

1. 打开 `chrome://extensions`
2. 打开右上角 `Developer mode`
3. 点击 `Load unpacked`
4. 选择本项目的 `dist/` 目录
5. 打开 `https://chatgpt.com/`
6. 打开扩展侧边栏
7. 点击 `Scan`

### 5. 打包 zip

```bash
npm run package:extension
```

输出位置：

```text
release/chatgpt-to-obsidian-vault-0.1.0.zip
```

## 使用流程

1. 打开一个 ChatGPT 会话页面。
2. 打开扩展侧边栏。
3. 点击 `Scan`，读取当前会话和侧边栏摘要。
4. 如果要批量导入，选择：
   - `Scan Recent`：扫描最近几条
   - `Scan Selected`：扫描左侧勾选项
   - `All`：扫描全部，耗时较长
5. 在左侧选择要导出的会话。
6. 在中间面板选择要导出的消息轮次。
7. 在右侧选择模板、路径和写入策略。
8. 点击 `Choose Vault` 授权 Obsidian 文件夹，或使用 Downloads fallback。
9. 点击 `Write Vault` 或 `Batch` 写入所选格式文件。

## 路径模板

默认路径模板：

```text
AI/ChatGPT/{yyyy}/{MM}/{yyyy-MM-dd} - {safeTitle}.md
```

扩展会根据会话标题、日期和所选格式生成最终路径。

## 质量检查

```bash
npm run quality
```

该命令会运行：

- no-emoji 检查
- TypeScript typecheck
- Vitest 单元测试
- 生产构建
- dist 校验

最近一次验证结果：

- 6 个测试文件通过
- 9 个测试通过
- production build 通过
- dist verify 通过

## 项目结构

```text
src/
  background/      # MV3 service worker 和扫描队列
  extractors/      # ChatGPT DOM 抽取逻辑
  markdown/        # Markdown / frontmatter / templates
  sidepanel/       # 侧边栏 React UI
  storage/         # 本地导出索引
  ui/              # Lucide 图标出口
  writers/         # Vault 写入与 Downloads fallback
```

## 安全说明

- 本项目是本地优先扩展。
- 不需要云端账号。
- 不上传你的 ChatGPT 内容。
- 只在你点击扫描时读取当前 ChatGPT 页面。
- 直写 Vault 需要你通过浏览器文件夹选择器显式授权。
- `dist.pem` 是扩展打包私钥，已通过 `.gitignore` 排除，不应提交到 GitHub。

## 竞品与验证报告

Super Dev 维护产物：

- [PRD](output/chatgpt-to-obsidian-vault-prd.md)
- [Architecture](output/chatgpt-to-obsidian-vault-architecture.md)
- [UI/UX](output/chatgpt-to-obsidian-vault-uiux.md)
- [竞品与验证报告](output/maintenance/competitive-validation-20260531.md)

## 许可证

当前未声明开源许可证。发布到公开仓库前请先确认许可证策略。
