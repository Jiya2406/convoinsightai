import {
  assistantRepository,
  AssistantRepository,
  type AssistantListFilter,
} from "@/server/repositories/assistant.repository";
import {
  providerRepository,
  ProviderRepository,
} from "@/server/repositories/provider.repository";
import { auditService, AuditService } from "@/server/services/audit.service";
import { NotFoundError, BadRequestError } from "@/lib/errors/api-error";
import { buildPageMeta } from "@/lib/api/response";
import type { CreateAssistantInput, UpdateAssistantInput } from "@/lib/validation/assistant.schema";

/**
 * Business logic for Assistants. Depends on repository + provider + audit
 * abstractions injected via the constructor (Dependency Injection) so the
 * service is unit-testable with mocks.
 */
export class AssistantService {
  constructor(
    private readonly assistants: AssistantRepository = assistantRepository,
    private readonly providers: ProviderRepository = providerRepository,
    private readonly audit: AuditService = auditService,
  ) {}

  async list(filter: AssistantListFilter) {
    const { items, total } = await this.assistants.list(filter);
    return { items, meta: buildPageMeta(filter.page, filter.pageSize, total) };
  }

  async getById(id: string) {
    const assistant = await this.assistants.findById(id);
    if (!assistant) throw new NotFoundError("Assistant");
    return assistant;
  }

  async create(input: CreateAssistantInput, actorId: string) {
    const provider = await this.providers.findById(input.providerId);
    if (!provider) throw new BadRequestError("Selected provider does not exist");
    if (!provider.isActive) throw new BadRequestError("Selected provider is not active");

    const assistant = await this.assistants.create({
      name: input.name,
      domain: input.domain,
      description: input.description,
      systemPrompt: input.systemPrompt,
      providerId: input.providerId,
      model: input.model ?? "mock-1",
      temperature: input.temperature ?? 0.7,
      isActive: input.isActive ?? true,
    });

    await this.audit.record({
      userId: actorId,
      action: "assistant.create",
      entity: "Assistant",
      entityId: assistant.id,
      meta: { name: assistant.name, domain: assistant.domain },
    });

    return assistant;
  }

  async update(id: string, input: UpdateAssistantInput, actorId: string) {
    await this.getById(id); // ensures existence → 404 if missing

    if (input.providerId) {
      const provider = await this.providers.findById(input.providerId);
      if (!provider) throw new BadRequestError("Selected provider does not exist");
    }

    const assistant = await this.assistants.update(id, { ...input });

    await this.audit.record({
      userId: actorId,
      action: "assistant.update",
      entity: "Assistant",
      entityId: id,
      meta: { fields: Object.keys(input) },
    });

    return assistant;
  }

  async remove(id: string, actorId: string) {
    await this.getById(id);
    await this.assistants.delete(id);
    await this.audit.record({
      userId: actorId,
      action: "assistant.delete",
      entity: "Assistant",
      entityId: id,
    });
  }
}

export const assistantService = new AssistantService();
