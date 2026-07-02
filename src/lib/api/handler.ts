import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth/auth";
import { assertCan, type Permission } from "@/lib/auth/rbac";
import { UnauthorizedError } from "@/lib/errors/api-error";
import { handleApiError } from "@/lib/errors/handler";
import { logger } from "@/lib/logger/logger";

/** Context passed to every route handler. `session` is guaranteed present. */
export interface RouteContext {
  req: NextRequest;
  params: Record<string, string>;
  searchParams: URLSearchParams;
  session: Session;
}

interface RouteOptions {
  /** Permission required to access the route. Omit for authenticated-only. */
  permission?: Permission;
}

type Handler = (ctx: RouteContext) => Promise<NextResponse> | Promise<Response>;

/**
 * Wraps an App Router route handler with:
 *  - authentication (401 if no session)
 *  - RBAC permission check (403 if lacking permission)
 *  - Next 15 async `params` unwrapping
 *  - centralized error handling
 *  - request logging
 */
export function route(options: RouteOptions, handler: Handler) {
  return async (
    req: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ): Promise<Response> => {
    const start = Date.now();
    try {
      const session = await auth();
      if (!session?.user) throw new UnauthorizedError();

      if (options.permission) {
        assertCan(session.user.role, options.permission);
      }

      const params = context?.params ? await context.params : {};
      const searchParams = req.nextUrl.searchParams;

      const res = await handler({ req, params, searchParams, session });
      logger.info("api.request", {
        method: req.method,
        path: req.nextUrl.pathname,
        status: res.status,
        ms: Date.now() - start,
        user: session.user.email,
      });
      return res;
    } catch (err) {
      const res = handleApiError(err);
      logger.warn("api.error", {
        method: req.method,
        path: req.nextUrl.pathname,
        status: res.status,
        ms: Date.now() - start,
      });
      return res;
    }
  };
}
