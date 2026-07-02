import type { Evaluator } from "@/lib/evaluation/evaluator.interface";
import { MockEvaluator } from "@/lib/evaluation/evaluators/mock.evaluator";
import { GeminiJudgeEvaluator } from "@/lib/evaluation/evaluators/gemini-judge.evaluator";
import { aiConfig } from "@/lib/config/ai.config";

/**
 * Returns the active evaluator based on config (EVALUATOR=mock|gemini).
 * Mock is the deterministic default; Gemini judge is the optional free-tier LLM.
 */
export class EvaluatorFactory {
  static create(): Evaluator {
    return aiConfig.evaluator === "GEMINI" ? new GeminiJudgeEvaluator() : new MockEvaluator();
  }
}
