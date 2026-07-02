/**
 * Minimal structured logger. Centralizing here means we can later swap the
 * sink (e.g. to a log service) without touching call sites.
 */
type Level = "debug" | "info" | "warn" | "error";

function emit(level: Level, message: string, meta?: Record<string, unknown>) {
  const entry = {
    level,
    message,
    ...(meta ? { meta } : {}),
    time: new Date().toISOString(),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (m: string, meta?: Record<string, unknown>) =>
    process.env.NODE_ENV === "development" && emit("debug", m, meta),
  info: (m: string, meta?: Record<string, unknown>) => emit("info", m, meta),
  warn: (m: string, meta?: Record<string, unknown>) => emit("warn", m, meta),
  error: (m: string, meta?: Record<string, unknown>) => emit("error", m, meta),
};
