import { Prisma, PromptVariant } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

/** Data access for A/B prompt tests. */
export class PromptTestRepository {
  create(data: {
    assistantId: string;
    name: string;
    promptA: string;
    promptB: string;
    input: string;
    winner: PromptVariant;
    results: { variant: PromptVariant; output: string; metrics: Prisma.InputJsonValue }[];
  }) {
    return prisma.promptTest.create({
      data: {
        assistantId: data.assistantId,
        name: data.name,
        promptA: data.promptA,
        promptB: data.promptB,
        input: data.input,
        winner: data.winner,
        results: { create: data.results },
      },
      include: { results: true },
    });
  }

  listByAssistant(assistantId: string) {
    return prisma.promptTest.findMany({
      where: { assistantId },
      orderBy: { createdAt: "desc" },
      include: { results: true },
      take: 20,
    });
  }
}

export const promptTestRepository = new PromptTestRepository();
