import {
  providerRepository,
  ProviderRepository,
} from "@/server/repositories/provider.repository";
import { auditService, AuditService } from "@/server/services/audit.service";
import { NotFoundError } from "@/lib/errors/api-error";
import type { UpdateProviderInput } from "@/lib/validation/provider.schema";

/** Business logic for Providers (list + admin toggle/config). */
export class ProviderService {
  constructor(
    private readonly providers: ProviderRepository = providerRepository,
    private readonly audit: AuditService = auditService,
  ) {}

  list() {
    return this.providers.list();
  }

  async getById(id: string) {
    const provider = await this.providers.findById(id);
    if (!provider) throw new NotFoundError("Provider");
    return provider;
  }

  async update(id: string, input: UpdateProviderInput, actorId: string) {
    await this.getById(id);
    const provider = await this.providers.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.config !== undefined ? { config: input.config as object } : {}),
    });

    await this.audit.record({
      userId: actorId,
      action: "provider.update",
      entity: "Provider",
      entityId: id,
      meta: { fields: Object.keys(input) },
    });

    return provider;
  }
}

export const providerService = new ProviderService();
