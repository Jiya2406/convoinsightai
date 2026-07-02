import type { ProviderKey } from "@prisma/client";

/** A single grounded knowledge chunk passed to the adapter. */
export interface KnowledgeChunk {
  id: string;
  title: string;
  content: string;
}

/** A source the model's answer was grounded in. */
export interface SourceReference {
  id: string;
  title: string;
  score: number; // 0–1 relevance
}

export interface AIRequest {
  prompt: string;
  systemPrompt: string;
  knowledge: KnowledgeChunk[];
  model: string;
  temperature: number;
}

export interface AIResponse {
  text: string;
  tokens: number;
  latencyMs: number;
  sources: SourceReference[];
  provider: ProviderKey;
  model: string;
}

export type ProviderStatus = "up" | "down" | "not_configured" | "scaffold";

export interface ProviderHealth {
  provider: ProviderKey;
  status: ProviderStatus;
  message?: string;
}

/**
 * The single contract every AI provider implements. Business logic depends on
 * this interface only — never on a concrete provider (Dependency Inversion).
 */
export interface AIAdapter {
  readonly provider: ProviderKey;
  generate(req: AIRequest): Promise<AIResponse>;
  healthCheck(): Promise<ProviderHealth>;
}
