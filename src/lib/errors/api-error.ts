/**
 * Typed API errors. These are pure classes (no framework imports) so they can
 * be thrown from services, seed scripts, or anywhere without pulling in Next.
 * The API handler maps them to HTTP responses.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class BadRequestError extends ApiError {
  constructor(message = "Bad request", details?: unknown) {
    super(400, "BAD_REQUEST", message, details);
  }
}

export class ValidationError extends ApiError {
  constructor(details: unknown, message = "Validation failed") {
    super(400, "VALIDATION_ERROR", message, details);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Authentication required") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(permissionOrMessage = "Forbidden") {
    super(403, "FORBIDDEN", permissionOrMessage.includes(":") ? `Forbidden: missing permission "${permissionOrMessage}"` : permissionOrMessage);
  }
}

export class NotFoundError extends ApiError {
  constructor(entity = "Resource") {
    super(404, "NOT_FOUND", `${entity} not found`);
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Resource already exists") {
    super(409, "CONFLICT", message);
  }
}

export class NotImplementedError extends ApiError {
  constructor(message = "Not implemented") {
    super(501, "NOT_IMPLEMENTED", message);
  }
}
