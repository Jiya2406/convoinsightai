import { PromptVariant, type Prisma } from "@prisma/client";
import {
  promptTestRepository,
  PromptTestRepository,
} from "@/server/repositories/prompt-test.repository";
import {
  assistantRepository,
  AssistantRepository,
} from "@/server/repositories/assistant.repository";
import { auditService, AuditService } from "@/server/services/audit.service";
import { NotFoundError, BadRequestError } from "@/lib/errors/api-error";
import { AIAdapterFactory } from "@/lib/ai/ai-adapter.factory";
import { EvaluatorFactory } from "@/lib/evaluation/evaluator.factory";
import type { KnowledgeChunk } from "@/lib/ai/ai-adapter.interface";
import type { EvaluationResult } from "@/lib/evaluation/evaluator.interface";
import type { RunPromptTestInput } from "@/lib/validation/prompt-test.schema";

export interface VariantResult {
  variant: "A" | "B";
  output: string;
  evaluation: EvaluationResult;
}

/**
 * Runs a Prompt A vs Prompt B comparison: generates + evaluates both variants
 * against the same input and knowledge, picks a winner by correctness score,
 * and persists the test + results.
 */
export class PromptTestService {
  constructor(
    private readonly repo: PromptTestRepository = promptTestRepository,
    private readonly assistants: AssistantRepository = assistantRepository,
    private readonly audit: AuditService = auditService,
  ) {}

  async runComparison(input: RunPromptTestInput, actorId: string) {
    const assistant = await this.assistants.findForGeneration(input.assistantId);
    if (!assistant) throw new NotFoundError("Assistant");
    if (!assistant.provider.isActive) {
      throw new BadRequestError(`Provider ${assistant.provider.name} is not active.`);
    }

    const knowledge: KnowledgeChunk[] = (assistant.knowledge[0]?.documents ?? []).map((d) => ({
      id: d.id,
      title: d.title,
      content: d.content,
    }));

    const adapter = AIAdapterFactory.create(assistant.provider.key, { domain: assistant.domain });
    const evaluator = EvaluatorFactory.create();

    const runVariant = async (systemPrompt: string): Promise<{ output: string; evaluation: EvaluationResult }> => {
      const res = await adapter.generate({
        prompt: input.input,
        systemPrompt,
        knowledge,
        model: assistant.model,
        temperature: assistant.temperature,
      });
      const evaluation = await evaluator.evaluate({ question: input.input, response: res, knowledge });
      return { output: res.text, evaluation };
    };

    const [a, b] = await Promise.all([runVariant(input.promptA), runVariant(input.promptB)]);
    const winner: PromptVariant =
      b.evaluation.correctnessScore > a.evaluation.correctnessScore
        ? PromptVariant.B
        : PromptVariant.A;

    const test = await this.repo.create({
      assistantId: input.assistantId,
      name: input.name ?? "Prompt A/B test",
      promptA: input.promptA,
      promptB: input.promptB,
      input: input.input,
      winner,
      results: [
        { variant: PromptVariant.A, output: a.output, metrics: a.evaluation as unknown as Prisma.InputJsonValue },
        { variant: PromptVariant.B, output: b.output, metrics: b.evaluation as unknown as Prisma.InputJsonValue },
      ],
    });

    await this.audit.record({
      userId: actorId,
      action: "prompt_test.run",
      entity: "PromptTest",
      entityId: test.id,
      meta: { assistant: assistant.name, winner },
    });

    return {
      promptTestId: test.id,
      winner: winner as "A" | "B",
      variantA: { variant: "A" as const, output: a.output, evaluation: a.evaluation },
      variantB: { variant: "B" as const, output: b.output, evaluation: b.evaluation },
    };
  }
}

export const promptTestService = new PromptTestService();
