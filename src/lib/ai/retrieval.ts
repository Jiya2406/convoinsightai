import type { KnowledgeChunk, SourceReference } from "@/lib/ai/ai-adapter.interface";

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "am", "do", "i", "you", "we", "to", "of", "and",
  "or", "for", "in", "on", "at", "my", "me", "how", "what", "can", "get", "many",
  "much", "does", "will", "with", "be", "have", "has",
]);

/** Split text into lowercase content tokens (drops stop words + punctuation). */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

/** Overlap score (0–1) between a query and a chunk of text. */
export function overlapScore(queryTokens: string[], text: string): number {
  if (queryTokens.length === 0) return 0;
  const chunkTokens = new Set(tokenize(text));
  if (chunkTokens.size === 0) return 0;
  let hits = 0;
  for (const t of queryTokens) if (chunkTokens.has(t)) hits += 1;
  return hits / queryTokens.length;
}

/** Retrieve the top-k most relevant knowledge chunks for a query. */
export function retrieve(
  query: string,
  knowledge: KnowledgeChunk[],
  k = 3,
): { chunk: KnowledgeChunk; score: number }[] {
  const q = tokenize(query);
  return knowledge
    .map((chunk) => ({ chunk, score: overlapScore(q, `${chunk.title} ${chunk.content}`) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

/** Convert retrieval results into source references for storage/display. */
export function toSources(
  results: { chunk: KnowledgeChunk; score: number }[],
): SourceReference[] {
  return results.map((r) => ({
    id: r.chunk.id,
    title: r.chunk.title,
    score: Math.round(r.score * 100) / 100,
  }));
}
