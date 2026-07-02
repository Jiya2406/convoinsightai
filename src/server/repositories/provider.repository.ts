import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

/** Data access for Providers (fixed, seeded set). */
export class ProviderRepository {
  list() {
    return prisma.provider.findMany({
      orderBy: [{ isActive: "desc" }, { key: "asc" }],
      include: { _count: { select: { assistants: true } } },
    });
  }

  findById(id: string) {
    return prisma.provider.findUnique({ where: { id } });
  }

  update(id: string, data: Prisma.ProviderUncheckedUpdateInput) {
    return prisma.provider.update({ where: { id }, data });
  }
}

export const providerRepository = new ProviderRepository();
