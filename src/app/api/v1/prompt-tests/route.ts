import { route } from "@/lib/api/handler";
import { created } from "@/lib/api/response";
import { runPromptTestSchema } from "@/lib/validation/prompt-test.schema";
import { promptTestService } from "@/server/services/prompt-test.service";

// POST /api/v1/prompt-tests — run a Prompt A vs B comparison.
export const POST = route({ permission: "prompt:test" }, async ({ req, session }) => {
  const body = runPromptTestSchema.parse(await req.json());
  const result = await promptTestService.runComparison(body, session.user.id);
  return created(result);
});

export const runtime = "nodejs";
