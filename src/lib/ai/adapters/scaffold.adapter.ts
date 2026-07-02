import type { ProviderKey } from "@prisma/client";
import type {
  AIAdapter,
  AIRequest,
  AIResponse,
  ProviderHealth,
} from "@/lib/ai/ai-adapter.interface";
import { NotImplementedError } from "@/lib/errors/api-error";

/**
 * ScaffoldAdapter — a placeholder implementation for providers that are
 * defined in the platform but not yet wired (OpenAI, Claude, DeepSeek, Llama,
 * Azure OpenAI). It satisfies the AIAdapter contract so the factory and config
 * treat every provider uniformly; calling generate() throws a clear 501.
 *
 * Wiring a new provider = replace this with a real adapter class + one line in
 * the factory. No business logic changes.
 */
export class ScaffoldAdapter implements AIAdapter {
  constructor(public readonly provider: ProviderKey) {}

  async generate(_req: AIRequest): Promise<AIResponse> {
    void _req;
    throw new NotImplementedError(
      `The ${this.provider} adapter is scaffolded but not yet wired. Use MOCK or GEMINI, or implement its adapter.`,
    );
  }

  async healthCheck(): Promise<ProviderHealth> {
    return { provider: this.provider, status: "scaffold" };
  }
}
