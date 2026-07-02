import type { ProviderKey } from "@prisma/client";

/**
 * ────────────────────────────────────────────────────────────────
 *  THE SINGLE SWAP POINT
 * ────────────────────────────────────────────────────────────────
 * Change the platform's default AI provider and evaluator here (or via env).
 * No business logic elsewhere needs to change — the factories read this config.
 *
 *   AI_PROVIDER = mock | gemini            (default provider for new work)
 *   EVALUATOR   = mock | gemini            (how responses are scored)
 */
export interface AIConfig {
  /** Default provider used when one isn't explicitly chosen. */
  defaultProvider: ProviderKey;
  /** Which evaluator scores responses. */
  evaluator: "MOCK" | "GEMINI";
  gemini: {
    apiKey: string | undefined;
    /** Default Gemini model when an assistant doesn't specify a gemini-* model. */
    defaultModel: string;
    baseUrl: string;
  };
}

function readProvider(): ProviderKey {
  const v = (process.env.AI_PROVIDER ?? "mock").toUpperCase();
  return v === "GEMINI" ? "GEMINI" : "MOCK";
}

function readEvaluator(): "MOCK" | "GEMINI" {
  return (process.env.EVALUATOR ?? "mock").toUpperCase() === "GEMINI" ? "GEMINI" : "MOCK";
}

export const aiConfig: AIConfig = {
  defaultProvider: readProvider(),
  evaluator: readEvaluator(),
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || undefined,
    defaultModel: "gemini-1.5-flash",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
  },
};
