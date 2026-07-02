import type { Evaluator, EvaluationInput, EvaluationResult } from "@/lib/evaluation/evaluator.interface";
import { tokenize, overlapScore } from "@/lib/ai/retrieval";

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}
function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/**
 * MockEvaluator — deterministic, grounded scoring (platform default).
 *
 * All 10 metrics are computed from measurable signals: keyword overlap between
 * the question, the answer, and the knowledge; whether sources were grounded;
 * and the answer's length adequacy. Deterministic → reliable in live demos and
 * reproducible for testing. Swappable for an LLM judge via the factory.
 */
export class MockEvaluator implements Evaluator {
  async evaluate({ question, response, knowledge }: EvaluationInput): Promise<EvaluationResult> {
    const qTokens = tokenize(question);
    const rTokens = tokenize(response.text);
    const knowledgeText = knowledge.map((k) => k.content).join(" ");
    const kTokenSet = new Set(tokenize(knowledgeText));

    const grounded = response.sources.length > 0;
    const topScore = response.sources[0]?.score ?? 0;

    // How much of the answer is supported by the knowledge base.
    const supportRatio =
      rTokens.length > 0 ? rTokens.filter((t) => kTokenSet.has(t)).length / rTokens.length : 0;

    // How well the answer addresses the question.
    const relFrac = overlapScore(qTokens, response.text);
    const lenAdequacy = clamp01(rTokens.length / 30);

    const relevance = clamp(relFrac * 100);
    const completeness = clamp((relFrac * 0.6 + lenAdequacy * 0.4) * 100);
    const accuracy = clamp((grounded ? 0.4 + supportRatio * 0.6 : supportRatio * 0.5) * 100);
    const hallucinationRisk = clamp(
      (grounded ? (1 - supportRatio) * 0.5 : 0.6 + (1 - supportRatio) * 0.4) * 100,
    );
    const confidence = clamp((grounded ? 0.5 + topScore * 0.5 : 0.3) * 100);
    const correctnessScore = clamp(
      0.35 * accuracy + 0.25 * relevance + 0.2 * completeness + 0.2 * (100 - hallucinationRisk),
    );

    return {
      accuracy,
      relevance,
      completeness,
      hallucinationRisk,
      confidence,
      latencyMs: response.latencyMs,
      responseLength: response.text.length,
      groundedSource: grounded,
      sourceReference: response.sources,
      correctnessScore,
      evaluator: "MOCK",
    };
  }
}
