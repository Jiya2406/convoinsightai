import { route } from "@/lib/api/handler";
import { created, paginated, buildPageMeta } from "@/lib/api/response";
import { parsePagination } from "@/lib/validation/common";
import { submitFeedbackSchema } from "@/lib/validation/feedback.schema";
import { feedbackService } from "@/server/services/feedback.service";
import { feedbackRepository } from "@/server/repositories/feedback.repository";

// GET /api/v1/feedback — list recent feedback.
export const GET = route({ permission: "dashboard:view" }, async ({ searchParams }) => {
  const { page, pageSize } = parsePagination(searchParams);
  const { items, total } = await feedbackRepository.list(page, pageSize);
  return paginated(items, buildPageMeta(page, pageSize, total));
});

// POST /api/v1/feedback — submit thumbs up/down (+ optional comment) on a message.
export const POST = route({ permission: "feedback:create" }, async ({ req, session }) => {
  const body = submitFeedbackSchema.parse(await req.json());
  const feedback = await feedbackService.submit(body, session.user.id);
  return created(feedback);
});

export const runtime = "nodejs";
