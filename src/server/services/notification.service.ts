import { GovernanceStatus } from "@prisma/client";
import {
  notificationRepository,
  NotificationRepository,
} from "@/server/repositories/notification.repository";
import { logger } from "@/lib/logger/logger";

/** Business logic for notifications (governance breach alerts + inbox). */
export class NotificationService {
  constructor(private readonly repo: NotificationRepository = notificationRepository) {}

  /** Emit a notification when a response is flagged or blocked. Never throws. */
  async notifyGovernance(params: {
    userId?: string;
    assistantName: string;
    status: GovernanceStatus;
    reasons: string[];
  }) {
    if (params.status === GovernanceStatus.PASS) return;
    try {
      await this.repo.create({
        userId: params.userId,
        type: params.status === GovernanceStatus.BLOCK ? "GOVERNANCE_BLOCK" : "GOVERNANCE_FLAG",
        message: `${params.status === GovernanceStatus.BLOCK ? "Blocked" : "Flagged"} response from ${params.assistantName}: ${
          params.reasons[0] ?? "governance rule triggered"
        }`,
      });
    } catch (err) {
      logger.error("notification.create.failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  list(userId: string) {
    return this.repo.listForUser(userId);
  }

  unreadCount(userId: string) {
    return this.repo.unreadCount(userId);
  }

  markRead(id: string) {
    return this.repo.markRead(id);
  }

  markAllRead(userId: string) {
    return this.repo.markAllRead(userId);
  }
}

export const notificationService = new NotificationService();
