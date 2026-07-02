import type { Evaluator, EvaluationInput, EvaluationResult } from "@/lib/evaluation/evaluator.interface";
import { MockEvaluator } from "@/lib/evaluation/evaluators/mock.evaluator";
import { aiConfig } from "@/lib/config/ai.config";
import { logger } from "@/lib/logger/logger";

const JUDGE_PROMPT = `You are an impartial evaluator of an AI assistant's answer.
Score the answer from 0-100 on each metric and return ONLY minified JSON with keys:
accuracy, relevance, completeness, hallucinationRisk, confidence (all 0-100 numbers).
Higher hallucinationRisk means MORE likely to contain invented/unsupported content.`;

/**
 * GeminiJudgeEvaluator — uses Gemini (free tier) as an LLM judge for the
 * subjective metrics, then reuses deterministic signals for the rest. If the
 * judge call fails or the key is missing, it gracefully falls back to the
 * MockEvaluator so scoring never breaks the pipeline.
 */
export class GeminiJudgeEvaluator implements Evaluator {
  private readonly fallback = new MockEvaluator();

  async evaluate(input: EvaluationInput): Promise<EvaluationResult> {
    const { apiKey, baseUrl, defaultModel } = aiConfig.gemini;
    if (!apiKey) return this.fallback.evaluate(input);

    const base = await this.fallback.evaluate(input); // deterministic baseline

    const content = `${JUDGE_PROMPT}

Question: ${input.question}
Knowledge: ${input.knowledge.map((k) => k.title + ": " + k.content).join(" | ").slice(0, 4000)}
Answer: ${input.response.text}`;

    try {
      const res = await fetch(`${baseUrl}/models/${defaultModel}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: content }] }],
          generationConfig: { temperature: 0, responseMimeType: "application/json" },
        }),
      });
      if (!res.ok) throw new Error(`judge status ${res.status}`);

      const json = (await res.json()) as {
        candidates?: { content?: { parts?: { text: string }[] } }[];
      };
      const raw = json.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "{}";
      const scores = JSON.parse(raw) as Partial<Record<keyof EvaluationResult, number>>;

      const clamp = (n: number | undefined, d: number) =>
        n == null ? d : Math.max(0, Math.min(100, Math.round(n)));

      const accuracy = clamp(scores.accuracy, base.accuracy);
      const relevance = clamp(scores.relevance, base.relevance);
      const completeness = clamp(scores.completeness, base.completeness);
      const hallucinationRisk = clamp(scores.hallucinationRisk, base.hallucinationRisk);
      const confidence = clamp(scores.confidence, base.confidence);
      const correctnessScore = Math.round(
        0.35 * accuracy + 0.25 * relevance + 0.2 * completeness + 0.2 * (100 - hallucinationRisk),
      );

      return {
        ...base,
        accuracy,
        relevance,
        completeness,
        hallucinationRisk,
        confidence,
        correctnessScore,
        evaluator: "GEMINI",
      };
    } catch (err) {
      logger.warn("gemini_judge.fallback", { error: err instanceof Error ? err.message : String(err) });
      return base;
    }
  }
}
