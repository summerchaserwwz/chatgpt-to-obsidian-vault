import type { ExportTemplateId } from "../shared/types";

export type TemplateDefinition = {
  id: ExportTemplateId;
  name: string;
  description: string;
  bestFor: string;
};

export const exportTemplates: TemplateDefinition[] = [
  {
    id: "source_archive",
    name: "Source Archive",
    description: "原样归档",
    bestFor: "保存完整对话、来源链接、元数据和逐轮转写。"
  },
  {
    id: "decision_record",
    name: "Decision Record",
    description: "决策记录",
    bestFor: "把对话整理成背景、选项、结论和后续行动。"
  },
  {
    id: "research_note",
    name: "Research Note",
    description: "研究笔记",
    bestFor: "整理资料、引用、发现、待验证问题和开放问题。"
  },
  {
    id: "coding_debug",
    name: "Coding / Debug Note",
    description: "调试复盘",
    bestFor: "保留错误现象、假设、修复动作和验证步骤。"
  }
];

export function getTemplate(id: ExportTemplateId): TemplateDefinition {
  return exportTemplates.find((template) => template.id === id) ?? exportTemplates[0];
}
