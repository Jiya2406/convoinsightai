import {
  knowledgeRepository,
  KnowledgeRepository,
} from "@/server/repositories/knowledge.repository";
import { auditService, AuditService } from "@/server/services/audit.service";
import { NotFoundError, BadRequestError } from "@/lib/errors/api-error";
import type { CreateKnowledgeInput } from "@/lib/validation/knowledge.schema";

/** Business logic for versioned knowledge management. */
export class KnowledgeService {
  constructor(
    private readonly repo: KnowledgeRepository = knowledgeRepository,
    private readonly audit: AuditService = auditService,
  ) {}

  listForAssistant(assistantId: string) {
    return this.repo.listByAssistant(assistantId);
  }

  async getById(id: string) {
    const knowledge = await this.repo.findById(id);
    if (!knowledge) throw new NotFoundError("Knowledge");
    return knowledge;
  }

  async createVersion(input: CreateKnowledgeInput, actorId: string) {
    if (input.documents.length === 0) {
      throw new BadRequestError("Add at least one document to create a version.");
    }
    const version = await this.repo.nextVersion(input.assistantId);
    const knowledge = await this.repo.createWithDocuments({
      assistantId: input.assistantId,
      name: input.name,
      version,
      activate: input.activate ?? true,
      documents: input.documents,
    });

    await this.audit.record({
      userId: actorId,
      action: "knowledge.create",
      entity: "Knowledge",
      entityId: knowledge.id,
      meta: { assistantId: input.assistantId, version, documents: input.documents.length },
    });

    return knowledge;
  }

  async activate(id: string, actorId: string) {
    const knowledge = await this.getById(id);
    await this.repo.setActive(id, knowledge.assistantId);
    await this.audit.record({
      userId: actorId,
      action: "knowledge.activate",
      entity: "Knowledge",
      entityId: id,
      meta: { version: knowledge.version },
    });
    return this.getById(id);
  }
}

export const knowledgeService = new KnowledgeService();
