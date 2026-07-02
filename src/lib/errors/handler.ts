import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { ApiError } from "@/lib/errors/api-error";
import { logger } from "@/lib/logger/logger";

/**
 * Maps any thrown error into a consistent JSON error response:
 *   { error: { code, message, details? } }
 */
export function handleApiError(err: unknown): NextResponse {
  // Zod validation errors → 400 with field details.
  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: err.flatten(),
        },
      },
      { status: 400 },
    );
  }

  // Our typed API errors.
  if (err instanceof ApiError) {
    if (err.status >= 500) logger.error(err.message, { code: err.code });
    return NextResponse.json(
      {
        error: {
          code: err.code,
          message: err.message,
          ...(err.details ? { details: err.details } : {}),
        },
      },
      { status: err.status },
    );
  }

  // Known Prisma errors → friendly mapping.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Resource not found" } },
        { status: 404 },
      );
    }
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: "A record with these values already exists" } },
        { status: 409 },
      );
    }
    if (err.code === "P2003") {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Related record does not exist" } },
        { status: 400 },
      );
    }
  }

  // Fallback: unexpected error.
  logger.error("Unhandled API error", {
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
    { status: 500 },
  );
}
