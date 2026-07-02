import type { ProviderKey } from "@prisma/client";
import type { AIAdapter } from "@/lib/ai/ai-adapter.interface";
import { MockAIAdapter } from "@/lib/ai/adapters/mock.adapter";
import { GeminiAdapter } from "@/lib/ai/adapters/gemini.adapter";
import { ScaffoldAdapter } from "@/lib/ai/adapters/scaffold.adapter";

/**
 * Factory that returns the right adapter for a provider key. This is the only
 * place that knows which concrete adapter maps to which provider — swapping or
 * adding a provider is a one-line change here.
 */
export class AIAdapterFactory {
  static create(provider: ProviderKey, opts?: { domain?: string }): AIAdapter {
    switch (provider) {
      case "MOCK":
        return new MockAIAdapter(opts?.domain);
      case "GEMINI":
        return new GeminiAdapter();
      // Scaffolded providers — wired in a later phase.
      case "OPENAI":
      case "CLAUDE":
      case "DEEPSEEK":
      case "LLAMA":
      case "AZURE_OPENAI":
        return new ScaffoldAdapter(provider);
      default:
        return new MockAIAdapter(opts?.domain);
    }
  }
}
