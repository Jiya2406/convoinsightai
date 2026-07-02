import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export interface AuditListFilter {
  page: number;
  pageSize: number;
  entity?: string;
  userId?: string;
}

/** Data access for the append-only AuditLog. */
export class AuditRepository {
  create(data: Prisma.AuditLogUncheckedCreateInput) {
    return prisma.auditLog.create({ data });
  }

  async list(filter: AuditListFilter) {
    const where: Prisma.AuditLogWhereInput = {
      ...(filter.entity ? { entity: filter.entity } : {}),
      ...(filter.userId ? { userId: filter.userId } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: (filter.page - 1) * filter.pageSize,
        take: filter.pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { items, total };
  }
}

export const auditRepository = new AuditRepository();
