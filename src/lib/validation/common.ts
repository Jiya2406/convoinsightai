import { z } from "zod";

/** Shared pagination + parsing helpers for list endpoints. */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type Pagination = z.infer<typeof paginationSchema>;

/** Parse pagination from URLSearchParams with safe defaults. */
export function parsePagination(sp: URLSearchParams): Pagination {
  return paginationSchema.parse({
    page: sp.get("page") ?? undefined,
    pageSize: sp.get("pageSize") ?? undefined,
  });
}

/** Coerce a query-string boolean ("true"/"false") to boolean | undefined. */
export function parseBoolean(value: string | null): boolean | undefined {
  if (value === null || value === "") return undefined;
  return value === "true";
}
