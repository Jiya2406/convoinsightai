import { route } from "@/lib/api/handler";
import { paginated, buildPageMeta } from "@/lib/api/response";
import { parsePagination } from "@/lib/validation/common";
import { evaluationRepository } from "@/server/repositories/evaluation.repository";

// GET /api/v1/evaluations — browse response evaluations with context.
export const GET = route({ permission: "dashboard:view" }, async ({ searchParams }) => {
  const { page, pageSize } = parsePagination(searchParams);
  const evaluatorParam = searchParams.get("evaluator");
  const evaluator = evaluatorParam === "MOCK" || evaluatorParam === "GEMINI" ? evaluatorParam : undefined;
  const { items, total } = await evaluationRepository.list({ page, pageSize, evaluator });
  return paginated(items, buildPageMeta(page, pageSize, total));
});

export const runtime = "nodejs";
