import {
  conversationRepository,
  ConversationRepository,
  type ConversationListFilter,
} from "@/server/repositories/conversation.repository";
import {
  assistantRepository,
  AssistantRepository,
} from "@/server/repositories/assistant.repository";
import { governanceService, GovernanceService } from "@/server/services/governance.service";
import { auditService, AuditService } from "@/server/services/audit.service";
import { notificationService, NotificationService } from "@/server/services/notification.service";
import { NotFoundError, BadRequestError } from "@/lib/errors/api-error";
import { buildPageMeta } from "@/lib/api/response";
import { AIAdapterFactory } from "@/lib/ai/ai-adapter.factory";
import { EvaluatorFactory } from "@/lib/evaluation/evaluator.factory";
import type { KnowledgeChunk } from "@/lib/ai/ai-adapter.interface";
import type { Prisma } from "@prisma/client";

export interface SendMessageInput {
  assistantId: string;
  prompt: string;
  conversationId?: string;
  userId?: string;
}

/**
 * Conversation service — read side (list/detail) + the Playground write path
 * that ties the whole product loop together:
 *   load assistant + knowledge → generate (adapter) → evaluate → govern →
 *   persist (conversation, messages, evaluation, audit).
 */
export class ConversationService {
  constructor(
    private readonly conversations: ConversationRepository = conversationRepository,
    private readonly assistants: AssistantRepository = assistantRepository,
    private readonly governance: GovernanceService = governanceService,
    private readonly audit: AuditService = auditService,
    private readonly notifications: NotificationService = notificationService,
  ) {}

  async list(filter: ConversationListFilter) {
    const { items, total } = await this.conversations.list(filter);
    return { items, meta: buildPageMeta(filter.page, filter.pageSize, total) };
  }

  async getById(id: string) {
    const conversation = await this.conversations.findById(id);
    if (!conversation) throw new NotFoundError("Conversation");
    return conversation;
  }

  async sendMessage(input: SendMessageInput) {
    const assistant = await this.assistants.findForGeneration(input.assistantId);
    if (!assistant) throw new NotFoundError("Assistant");
    if (!assistant.isActive) throw new BadRequestError("This assistant is inactive.");
    if (!assistant.provider.isActive) {
      throw new BadRequestError(`Provider ${assistant.provider.name} is not active.`);
    }

    // Build knowledge chunks from the active knowledge version's documents.
    const knowledge: KnowledgeChunk[] = (assistant.knowledge[0]?.documents ?? []).map((d) => ({
      id: d.id,
      title: d.title,
      content: d.content,
    }));

    // Resolve (or create) the conversation.
    let conversationId = input.conversationId;
    if (conversationId) {
      const existing = await this.conversations.findLight(conversationId);
      if (!existing || existing.assistantId !== input.assistantId) conversationId = undefined;
    }
    if (!conversationId) {
      const created = await this.conversations.createConversation(
        input.assistantId,
        input.userId,
        deriveTitle(input.prompt),
      );
      conversationId = created.id;
    }

    // Persist the user's message.
    const userMessage = await this.conversations.createUserMessage(conversationId, input.prompt);

    // Generate → evaluate → govern.
    const adapter = AIAdapterFactory.create(assistant.provider.key, { domain: assistant.domain });
    const aiResponse = await adapter.generate({
      prompt: input.prompt,
      systemPrompt: assistant.systemPrompt,
      knowledge,
      model: assistant.model,
      temperature: assistant.temperature,
    });

    const evaluator = EvaluatorFactory.create();
    const evaluation = await evaluator.evaluate({
      question: input.prompt,
      response: aiResponse,
      knowledge,
    });

    const governance = await this.governance.apply(input.assistantId, aiResponse.text, evaluation);

    // Persist the assistant reply + its evaluation atomically.
    const assistantMessage = await this.conversations.createAssistantMessage({
      conversationId,
      content: aiResponse.text,
      tokens: aiResponse.tokens,
      latencyMs: aiResponse.latencyMs,
      sources: aiResponse.sources as unknown as Prisma.InputJsonValue,
      governanceStatus: governance.status,
      governanceReasons: governance.reasons as unknown as Prisma.InputJsonValue,
      evaluation: {
        accuracy: evaluation.accuracy,
        relevance: evaluation.relevance,
        completeness: evaluation.completeness,
        hallucinationRisk: evaluation.hallucinationRisk,
        confidence: evaluation.confidence,
        latencyMs: evaluation.latencyMs,
        responseLength: evaluation.responseLength,
        groundedSource: evaluation.groundedSource,
        sourceReference: evaluation.sourceReference as unknown as Prisma.InputJsonValue,
        correctnessScore: evaluation.correctnessScore,
        evaluator: evaluation.evaluator,
      },
    });

    await this.audit.record({
      userId: input.userId,
      action: "playground.message",
      entity: "Conversation",
      entityId: conversationId,
      meta: { assistant: assistant.name, provider: assistant.provider.key, governance: governance.status },
    });

    // Emit a notification if the response was flagged or blocked.
    await this.notifications.notifyGovernance({
      userId: input.userId,
      assistantName: assistant.name,
      status: governance.status,
      reasons: governance.reasons,
    });

    return {
      conversationId,
      provider: assistant.provider.key,
      userMessage: { id: userMessage.id, content: userMessage.content },
      assistantMessage: {
        id: assistantMessage.id,
        content: assistantMessage.content,
        sources: aiResponse.sources,
        tokens: aiResponse.tokens,
        latencyMs: aiResponse.latencyMs,
      },
      evaluation,
      governance,
    };
  }
}

/** Derive a short conversation title from the first prompt. */
function deriveTitle(prompt: string): string {
  const t = prompt.trim().replace(/\s+/g, " ");
  return t.length > 60 ? `${t.slice(0, 57)}...` : t || "New conversation";
}

export const conversationService = new ConversationService();
