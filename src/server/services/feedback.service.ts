import { FeedbackType } from "@prisma/client";
import {
  feedbackRepository,
  FeedbackRepository,
} from "@/server/repositories/feedback.repository";
import { auditService, AuditService } from "@/server/services/audit.service";
import type { SubmitFeedbackInput } from "@/lib/validation/feedback.schema";

/** Business logic for message feedback (one vote per user per message). */
export class FeedbackService {
  constructor(
    private readonly repo: FeedbackRepository = feedbackRepository,
    private readonly audit: AuditService = auditService,
  ) {}

  async submit(input: SubmitFeedbackInput, userId: string) {
    const existing = await this.repo.findByMessageAndUser(input.messageId, userId);
    const feedback = existing
      ? await this.repo.update(existing.id, { type: input.type as FeedbackType, comment: input.comment })
      : await this.repo.create({
          messageId: input.messageId,
          userId,
          type: input.type as FeedbackType,
          comment: input.comment,
        });

    await this.audit.record({
      userId,
      action: "feedback.submit",
      entity: "Message",
      entityId: input.messageId,
      meta: { type: input.type },
    });

    return feedback;
  }
}

export const feedbackService = new FeedbackService();
