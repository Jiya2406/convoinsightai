import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

/** Data access for governance rules. */
export class GovernanceRepository {
  /** Active rules for an assistant plus any global (assistantId = null) rules. */
  activeRulesFor(assistantId: string) {
    return prisma.governanceRule.findMany({
      where: {
        isActive: true,
        OR: [{ assistantId }, { assistantId: null }],
      },
    });
  }

  list(assistantId?: string) {
    return prisma.governanceRule.findMany({
      where: assistantId ? { assistantId } : {},
      orderBy: { createdAt: "desc" },
      include: { assistant: { select: { id: true, name: true } } },
    });
  }

  findById(id: string) {
    return prisma.governanceRule.findUnique({ where: { id } });
  }

  create(data: Prisma.GovernanceRuleUncheckedCreateInput) {
    return prisma.governanceRule.create({ data });
  }

  update(id: string, data: Prisma.GovernanceRuleUncheckedUpdateInput) {
    return prisma.governanceRule.update({ where: { id }, data });
  }

  delete(id: string) {
    return prisma.governanceRule.delete({ where: { id } });
  }
}

export const governanceRepository = new GovernanceRepository();
