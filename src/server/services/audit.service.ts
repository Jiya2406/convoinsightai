import { auditRepository, AuditRepository, type AuditListFilter } from "@/server/repositories/audit.repository";
import { logger } from "@/lib/logger/logger";

/**
 * Writes and reads the immutable audit trail. Every mutating service action
 * should call `record()` so we have a full "who changed what" history.
 */
export class AuditService {
  constructor(private readonly repo: AuditRepository = auditRepository) {}

  async record(params: {
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    meta?: Record<string, unknown>;
  }) {
    try {
      await this.repo.create({
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        meta: (params.meta ?? {}) as object,
      });
    } catch (err) {
      // Never let audit failures break the primary action; just log.
      logger.error("audit.record.failed", {
        action: params.action,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  list(filter: AuditListFilter) {
    return this.repo.list(filter);
  }
}

export const auditService = new AuditService();
