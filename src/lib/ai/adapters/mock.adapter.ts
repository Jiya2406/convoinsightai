import type {
  AIAdapter,
  AIRequest,
  AIResponse,
  ProviderHealth,
  KnowledgeChunk,
} from "@/lib/ai/ai-adapter.interface";
import { retrieve, toSources } from "@/lib/ai/retrieval";
import knowledgeBase from "@/data/knowledge.json";

interface KbEntry {
  id: string;
  domain: string;
  title: string;
  content: string;
}

/**
 * MockAIAdapter — deterministic, offline provider (platform default).
 *
 * It answers by retrieving the most relevant knowledge chunks for the prompt
 * (from the assistant's own documents, augmented with the bundled
 * knowledge.json) and composing a grounded, cited response. Because it is
 * deterministic, it is ideal for reliable demos and for the evaluator to score.
 */
export class MockAIAdapter implements AIAdapter {
  readonly provider = "MOCK" as const;

  constructor(private readonly domain?: string) {}

  async generate(req: AIRequest): Promise<AIResponse> {
    const start = Date.now();

    // Combine the assistant's own knowledge with bundled domain knowledge.
    const bundled: KnowledgeChunk[] = (knowledgeBase.entries as KbEntry[])
      .filter((e) => (this.domain ? e.domain.toLowerCase() === this.domain.toLowerCase() : true))
      .map((e) => ({ id: e.id, title: e.title, content: e.content }));

    const combined = dedupeById([...req.knowledge, ...bundled]);
    const results = retrieve(req.prompt, combined, 3);

    let text: string;
    if (results.length === 0) {
      text =
        "I don't have information about that in my knowledge base, so I can't answer reliably. Please rephrase or add relevant documents to this assistant's knowledge.";
    } else {
      const top = results[0].chunk;
      const citations = results.map((r) => `“${r.chunk.title}”`).join(", ");
      text = `${top.content}\n\nThis answer is based on ${citations}.`;
    }

    // Simulate realistic latency deterministically (no randomness).
    const latencyMs = 120 + Math.min(req.prompt.length, 400);
    // Small deterministic wait so latency is observable but demo stays fast.
    await new Promise((r) => setTimeout(r, Math.min(latencyMs, 250)));

    return {
      text,
      tokens: estimateTokens(req.systemPrompt) + estimateTokens(req.prompt) + estimateTokens(text),
      latencyMs: Date.now() - start,
      sources: toSources(results),
      provider: this.provider,
      model: req.model || "mock-1",
    };
  }

  async healthCheck(): Promise<ProviderHealth> {
    return { provider: this.provider, status: "up" };
  }
}

function dedupeById(chunks: KnowledgeChunk[]): KnowledgeChunk[] {
  const seen = new Set<string>();
  const out: KnowledgeChunk[] = [];
  for (const c of chunks) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    out.push(c);
  }
  return out;
}

/** Rough token estimate (~4 chars/token). */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
