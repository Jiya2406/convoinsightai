import type {
  AIAdapter,
  AIRequest,
  AIResponse,
  ProviderHealth,
} from "@/lib/ai/ai-adapter.interface";
import { retrieve, toSources } from "@/lib/ai/retrieval";
import { aiConfig } from "@/lib/config/ai.config";
import { BadRequestError, ApiError } from "@/lib/errors/api-error";
import { logger } from "@/lib/logger/logger";

/**
 * GeminiAdapter — calls Google's Gemini REST API (free tier).
 *
 * Knowledge is injected into the prompt as grounding context, and we compute
 * source references locally (Gemini doesn't return them) so the rest of the
 * pipeline behaves identically to the mock provider.
 */
export class GeminiAdapter implements AIAdapter {
  readonly provider = "GEMINI" as const;

  async generate(req: AIRequest): Promise<AIResponse> {
    const { apiKey, baseUrl, defaultModel } = aiConfig.gemini;
    if (!apiKey) {
      throw new BadRequestError(
        "Gemini is not configured. Add GEMINI_API_KEY to your .env to use this provider.",
      );
    }

    const model = req.model?.startsWith("gemini") ? req.model : defaultModel;
    const start = Date.now();

    const grounding =
      req.knowledge.length > 0
        ? "Use ONLY the following knowledge to answer. Cite the titles you used.\n\n" +
          req.knowledge.map((k) => `### ${k.title}\n${k.content}`).join("\n\n")
        : "";

    const body = {
      systemInstruction: {
        parts: [{ text: `${req.systemPrompt}\n\n${grounding}`.trim() }],
      },
      contents: [{ role: "user", parts: [{ text: req.prompt }] }],
      generationConfig: { temperature: req.temperature },
    };

    let res: Response;
    try {
      res = await fetch(`${baseUrl}/models/${model}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (err) {
      logger.error("gemini.network_error", { error: err instanceof Error ? err.message : String(err) });
      throw new ApiError(502, "PROVIDER_ERROR", "Could not reach the Gemini API.");
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      logger.error("gemini.api_error", { status: res.status, detail: detail.slice(0, 300) });
      throw new ApiError(
        502,
        "PROVIDER_ERROR",
        `Gemini API error (${res.status}). Check your API key and quota.`,
      );
    }

    const json = (await res.json()) as GeminiResponse;
    const text =
      json.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ??
      "The model returned an empty response.";
    const usage = json.usageMetadata;

    // Compute grounding/source references locally for the pipeline.
    const results = retrieve(req.prompt, req.knowledge, 3);

    return {
      text,
      tokens: usage?.totalTokenCount ?? Math.ceil((req.prompt.length + text.length) / 4),
      latencyMs: Date.now() - start,
      sources: toSources(results),
      provider: this.provider,
      model,
    };
  }

  async healthCheck(): Promise<ProviderHealth> {
    if (!aiConfig.gemini.apiKey) {
      return { provider: this.provider, status: "not_configured", message: "GEMINI_API_KEY missing" };
    }
    return { provider: this.provider, status: "up" };
  }
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text: string }[] } }[];
  usageMetadata?: { totalTokenCount?: number };
}
