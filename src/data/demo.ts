import type { Conversation } from "../shared/types";

export const demoConversations: Conversation[] = [
  {
    source: "chatgpt",
    id: "chatgpt-demo-product-001",
    url: "https://chatgpt.com/c/demo-product-001",
    title: "ChatGPT to Obsidian Vault 产品定义",
    createdAt: "2026-05-29T09:00:00+08:00",
    updatedAt: "2026-05-29T14:30:00+08:00",
    model: "GPT-5",
    messageCount: 4,
    status: "updated",
    messages: [
      {
        id: "m-001",
        role: "user",
        markdown: "我想把 ChatGPT 里有价值的对话直接保存到 Obsidian。",
        plainText: "我想把 ChatGPT 里有价值的对话直接保存到 Obsidian。",
        attachments: [],
        value: "high"
      },
      {
        id: "m-002",
        role: "assistant",
        markdown:
          "核心工作流应该是选择会话、选择消息、套用模板、预览 Markdown，然后写入经过授权的 Vault 目录。",
        plainText:
          "核心工作流应该是选择会话、选择消息、套用模板、预览 Markdown，然后写入经过授权的 Vault 目录。",
        attachments: [],
        value: "high"
      },
      {
        id: "m-003",
        role: "user",
        markdown: "批量导入时要避免重复文件，也要能看出哪些会更新。",
        plainText: "批量导入时要避免重复文件，也要能看出哪些会更新。",
        attachments: [],
        value: "high"
      },
      {
        id: "m-004",
        role: "assistant",
        markdown:
          "保存判断可以基于 conversation_id、source_hash 和目标路径冲突，状态包括 new、unchanged、updated、conflict、failed。",
        plainText:
          "保存判断可以基于 conversation_id、source_hash 和目标路径冲突，状态包括 new、unchanged、updated、conflict、failed。",
        attachments: [],
        value: "high"
      }
    ]
  },
  {
    source: "chatgpt",
    id: "chatgpt-demo-research-002",
    url: "https://chatgpt.com/c/demo-research-002",
    title: "Chrome 扩展写入本地 Vault 的限制",
    createdAt: "2026-05-28T16:20:00+08:00",
    updatedAt: "2026-05-29T11:10:00+08:00",
    model: "GPT-5",
    messageCount: 3,
    status: "new",
    messages: [
      {
        id: "m-101",
        role: "user",
        markdown: "Chrome downloads API 能不能直接写到任意 Obsidian Vault 路径？",
        plainText: "Chrome downloads API 能不能直接写到任意 Obsidian Vault 路径？",
        attachments: [],
        value: "high"
      },
      {
        id: "m-102",
        role: "assistant",
        markdown:
          "不能。downloads API 的 filename 是相对 Downloads 目录的路径。直接 Vault 写入应使用 File System Access API，并要求用户明确选择目录。",
        plainText:
          "不能。downloads API 的 filename 是相对 Downloads 目录的路径。直接 Vault 写入应使用 File System Access API，并要求用户明确选择目录。",
        attachments: [],
        value: "high"
      },
      {
        id: "m-103",
        role: "assistant",
        markdown: "Downloads 仍然适合作为兼容回退，但 UI 必须明确说明文件会落在浏览器下载目录。",
        plainText: "Downloads 仍然适合作为兼容回退，但 UI 必须明确说明文件会落在浏览器下载目录。",
        attachments: [],
        value: "optional"
      }
    ]
  },
  {
    source: "chatgpt",
    id: "chatgpt-demo-debug-003",
    url: "https://chatgpt.com/c/demo-debug-003",
    title: "前端构建与验收清单",
    createdAt: "2026-05-27T20:12:00+08:00",
    updatedAt: "2026-05-28T08:45:00+08:00",
    model: "GPT-5",
    messageCount: 3,
    status: "unchanged",
    messages: [
      {
        id: "m-201",
        role: "user",
        markdown: "原型验收需要哪些证据？",
        plainText: "原型验收需要哪些证据？",
        attachments: [],
        value: "high"
      },
      {
        id: "m-202",
        role: "assistant",
        markdown: "需要 typecheck、unit tests、production build、runtime smoke、视觉验收和无 emoji/无模板化渐变检查。",
        plainText: "需要 typecheck、unit tests、production build、runtime smoke、视觉验收和无 emoji/无模板化渐变检查。",
        attachments: [],
        value: "high"
      },
      {
        id: "m-203",
        role: "assistant",
        markdown: "Computer Use 验收要确认主要控件可见、文本无重叠、预览跟随选择变化、下载路径可理解。",
        plainText: "Computer Use 验收要确认主要控件可见、文本无重叠、预览跟随选择变化、下载路径可理解。",
        attachments: [],
        value: "high"
      }
    ]
  }
];
