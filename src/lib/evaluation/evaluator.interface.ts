import type { AIResponse, KnowledgeChunk, SourceReference } from "@/lib/ai/ai-adapter.interface";

/** The 10-metric evaluation of a single response (mirrors the Evaluation model). */
export interface EvaluationResult {
  accuracy: number;
  relevance: number;
  completeness: number;
  hallucinationRisk: number;
  confidence: number;
  latencyMs: number;
  responseLength: number;
  groundedSource: boolean;
  sourceReference: SourceReference[];
  correctnessScore: number;
  evaluator: "MOCK" | "GEMINI";
}

export interface EvaluationInput {
  question: string;
  response: AIResponse;
  knowledge: KnowledgeChunk[];
}

/** Contract for scoring engines. Swappable via EvaluatorFactory. */
export interface Evaluator {
  evaluate(input: EvaluationInput): Promise<EvaluationResult>;
}
