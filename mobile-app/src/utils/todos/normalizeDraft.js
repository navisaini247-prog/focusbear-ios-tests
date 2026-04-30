import { v4 as uuidv4 } from "uuid";
import { TASK_STATUS } from "../toDos";

export function normalizeDraft(initialDraft = {}) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const rawTags = Array.isArray(initialDraft?.tags) ? initialDraft.tags : [];
  const tags = rawTags.map((t) => (typeof t === "string" ? { id: uuidv4(), text: t } : t)).filter(Boolean);

  return {
    id: uuidv4(),
    title: initialDraft?.title || initialDraft?.text || "",
    details: initialDraft?.details ?? initialDraft?.description ?? "",
    status: TASK_STATUS.DRAFT,
    due_date: new Date(initialDraft?.due_date || initialDraft?.dueDate || tomorrow),
    perspiration_level: initialDraft?.perspiration_level ?? 0,
    outcome: initialDraft?.outcome ?? 0,
    tags,
  };
}

export default normalizeDraft;
