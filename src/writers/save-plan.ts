import type { Conversation, ConversationStatus, ExportIndexRecord, SavePlanItem } from "../shared/types";

type ComputeSavePlanInput = {
  conversation: Conversation;
  targetPath: string;
  sourceHash: string;
  indexRecord?: ExportIndexRecord;
  existingFrontmatterConversationId?: string | null;
};

export function computeSavePlan({
  conversation,
  targetPath,
  sourceHash,
  indexRecord,
  existingFrontmatterConversationId
}: ComputeSavePlanInput): SavePlanItem {
  let status: ConversationStatus = "new";
  let reason = "No previous export was found.";

  if (indexRecord) {
    if (indexRecord.sourceHash === sourceHash) {
      status = "unchanged";
      reason = "Same conversation_id and source_hash already exported.";
    } else {
      status = "updated";
      reason = "Same conversation_id has new content.";
    }
  }

  if (existingFrontmatterConversationId && existingFrontmatterConversationId !== conversation.id) {
    status = "conflict";
    reason = "Target path contains a different conversation_id.";
  }

  return {
    conversation,
    targetPath,
    sourceHash,
    status,
    reason
  };
}
