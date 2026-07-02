import { GovernanceStatus } from "@prisma/client";
import {
  governanceRepository,
  GovernanceRepository,
} from "@/server/repositories/governance.repository";
import { auditService, AuditService } from "@/server/services/audit.service";
import { NotFoundError } from "@/lib/errors/api-error";
import type { EvaluationResult } from "@/lib/evaluation/evaluator.interface";
import type { CreateGovernanceRuleInput, UpdateGovernanceRuleInput } from "@/lib/validation/governance.schema";

export interface GovernanceResult {
  status: GovernanceStatus;
  reasons: string[];
}

const PII_PATTERNS: { label: string; re: RegExp }[] = [
  { label: "email address", re: /[\w.+-]+@[\w-]+\.[\w.-]+/ },
  { label: "phone number", re: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/ },
  { label: "SSN", re: /\b\d{3}-\d{2}-\d{4}\b/ },
];

/**
 * Applies governance rules to a generated response + its evaluation and returns
 * an overall status (PASS / FLAG / BLOCK) with human-readable reasons. BLOCK
 * takes precedence over FLAG.
 */
export class GovernanceService {
  constructor(
    private readonly repo: GovernanceRepository = governanceRepository,
    private readonly audit: AuditService = auditService,
  ) {}

  async apply(
    assistantId: string,
    responseText: string,
    evaluation: EvaluationResult,
  ): Promise<GovernanceResult> {
    const rules = await this.repo.activeRulesFor(assistantId);
    const reasons: string[] = [];
    let blocked = false;
    let flagged = false;

    const record = (action: "FLAG" | "BLOCK", reason: string) => {
      reasons.push(`${action}: ${reason}`);
      if (action === "BLOCK") blocked = true;
      else flagged = true;
    };

    for (const rule of rules) {
      const cfg = (rule.config ?? {}) as Record<string, unknown>;
      const action = rule.action;

      switch (rule.type) {
        case "BANNED_WORD": {
          const words = (cfg.words as string[] | undefined) ?? [];
          const hit = words.find((w) => responseText.toLowerCase().includes(w.toLowerCase()));
          if (hit) record(action, `response contains banned word "${hit}"`);
          break;
        }
        case "PII": {
          const found = PII_PATTERNS.find((p) => p.re.test(responseText));
          if (found) record(action, `response may contain a ${found.label}`);
          break;
        }
        case "GROUNDING": {
          const require = cfg.requireGroundedSource !== false;
          if (require && !evaluation.groundedSource) {
            record(action, "response is not grounded in any source");
          }
          break;
        }
        case "THRESHOLD": {
          const max = typeof cfg.maxHallucinationRisk === "number" ? cfg.maxHallucinationRisk : 60;
          if (evaluation.hallucinationRisk > max) {
            record(action, `hallucination risk ${evaluation.hallucinationRisk} exceeds ${max}`);
          }
          break;
        }
      }
    }

    const status = blocked
      ? GovernanceStatus.BLOCK
      : flagged
        ? GovernanceStatus.FLAG
        : GovernanceStatus.PASS;

    return { status, reasons };
  }

  list(assistantId?: string) {
    return this.repo.list(assistantId);
  }

  async createRule(input: CreateGovernanceRuleInput, actorId: string) {
    const rule = await this.repo.create({
      assistantId: input.assistantId || null,
      name: input.name,
      type: input.type,
      config: (input.config ?? {}) as object,
      action: input.action,
      isActive: input.isActive ?? true,
    });
    await this.audit.record({
      userId: actorId,
      action: "governance.create",
      entity: "GovernanceRule",
      entityId: rule.id,
      meta: { type: rule.type, action: rule.action },
    });
    return rule;
  }

  async updateRule(id: string, input: UpdateGovernanceRuleInput, actorId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Governance rule");
    const rule = await this.repo.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.config !== undefined ? { config: input.config as object } : {}),
      ...(input.action !== undefined ? { action: input.action } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });
    await this.audit.record({
      userId: actorId,
      action: "governance.update",
      entity: "GovernanceRule",
      entityId: id,
      meta: { fields: Object.keys(input) },
    });
    return rule;
  }

  async deleteRule(id: string, actorId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Governance rule");
    await this.repo.delete(id);
    await this.audit.record({
      userId: actorId,
      action: "governance.delete",
      entity: "GovernanceRule",
      entityId: id,
    });
  }
}

export const governanceService = new GovernanceService();
