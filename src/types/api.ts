/**
 * Client-facing API types. These mirror the serialized JSON shapes returned by
 * `/api/v1` (dates are ISO strings). Kept intentionally separate from Prisma
 * models so the frontend never imports server-only code.
 */

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type RoleName = "ADMIN" | "REVIEWER" | "ANALYST";

export type ProviderKey =
  | "MOCK"
  | "GEMINI"
  | "OPENAI"
  | "CLAUDE"
  | "DEEPSEEK"
  | "LLAMA"
  | "AZURE_OPENAI";

export interface ProviderRef {
  id: string;
  key: ProviderKey;
  name: string;
}

export interface Provider {
  id: string;
  key: ProviderKey;
  name: string;
  isActive: boolean;
  isScaffold: boolean;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  _count?: { assistants: number };
}

export interface Assistant {
  id: string;
  name: string;
  domain: string;
  description: string | null;
  systemPrompt: string;
  providerId: string;
  model: string;
  temperature: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  provider?: ProviderRef;
}

export interface ConversationListItem {
  id: string;
  title: string;
  createdAt: string;
  assistant: { id: string; name: string; domain: string };
  user: { id: string; name: string } | null;
  _count: { messages: number };
}

export interface AuditLogItem {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  meta: Record<string, unknown>;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
}

export interface SourceRef {
  id: string;
  title: string;
  score: number;
}

export type GovernanceStatus = "PASS" | "FLAG" | "BLOCK";

export interface EvaluationResult {
  accuracy: number;
  relevance: number;
  completeness: number;
  hallucinationRisk: number;
  confidence: number;
  latencyMs: number;
  responseLength: number;
  groundedSource: boolean;
  sourceReference: SourceRef[];
  correctnessScore: number;
  evaluator: "MOCK" | "GEMINI";
}

export interface PlaygroundResult {
  conversationId: string;
  provider: ProviderKey;
  userMessage: { id: string; content: string };
  assistantMessage: {
    id: string;
    content: string;
    sources: SourceRef[];
    tokens: number;
    latencyMs: number;
  };
  evaluation: EvaluationResult;
  governance: { status: GovernanceStatus; reasons: string[] };
}

export interface ConversationMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  tokens: number;
  latencyMs: number;
  sources: SourceRef[];
  governanceStatus: GovernanceStatus;
  governanceReasons: string[];
  createdAt: string;
  evaluation: EvaluationResult | null;
}

export interface ConversationDetail {
  id: string;
  title: string;
  createdAt: string;
  assistant: { id: string; name: string; domain: string };
  user: { id: string; name: string } | null;
  messages: ConversationMessage[];
}

/* ── Knowledge ── */
export type DocumentType = "JSON" | "TEXT" | "PDF";

export interface KnowledgeDocument {
  id: string;
  type: DocumentType;
  title: string;
  content: string;
  createdAt: string;
}

export interface KnowledgeVersion {
  id: string;
  assistantId: string;
  name: string;
  version: number;
  isActive: boolean;
  createdAt: string;
  _count?: { documents: number };
}

export interface KnowledgeDetail extends KnowledgeVersion {
  documents: KnowledgeDocument[];
}

/* ── Prompt Studio ── */
export interface PromptTestVariantResult {
  variant: "A" | "B";
  output: string;
  evaluation: EvaluationResult;
}

export interface PromptTestResult {
  promptTestId: string;
  winner: "A" | "B";
  variantA: PromptTestVariantResult;
  variantB: PromptTestVariantResult;
}

/* ── Evaluations ── */
export interface EvaluationListItem {
  id: string;
  accuracy: number;
  relevance: number;
  completeness: number;
  hallucinationRisk: number;
  confidence: number;
  correctnessScore: number;
  groundedSource: boolean;
  evaluator: "MOCK" | "GEMINI";
  createdAt: string;
  message: {
    content: string;
    conversationId: string;
    conversation: { assistant: { name: string; domain: string } };
  };
}

/* ── Governance ── */
export type GovernanceRuleType = "BANNED_WORD" | "PII" | "GROUNDING" | "THRESHOLD";
export type GovernanceAction = "FLAG" | "BLOCK";

export interface GovernanceRule {
  id: string;
  assistantId: string | null;
  name: string;
  type: GovernanceRuleType;
  config: Record<string, unknown>;
  action: GovernanceAction;
  isActive: boolean;
  createdAt: string;
  assistant?: { id: string; name: string } | null;
}

/* ── Analytics ── */
export interface AnalyticsData {
  windowDays: number;
  totals: { evaluations: number; avgCorrectness: number; avgHallucination: number };
  trend: { date: string; avgCorrectness: number; avgHallucination: number; count: number }[];
  perAssistant: {
    id: string;
    name: string;
    avgCorrectness: number;
    avgHallucination: number;
    evaluations: number;
  }[];
  perProvider: { key: string; name: string; evaluations: number; avgCorrectness: number }[];
  governance: { status: GovernanceStatus; count: number }[];
}

/* ── Notifications ── */
export interface NotificationItem {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export type FeedbackType = "UP" | "DOWN";

export interface FeedbackListItem {
  id: string;
  type: FeedbackType;
  comment: string | null;
  createdAt: string;
  user: { name: string } | null;
  message: {
    content: string;
    conversationId: string;
    conversation: { assistant: { name: string } };
  };
}

export interface DashboardStats {
  totals: {
    conversations: number;
    assistants: number;
    activeAssistants: number;
    providers: number;
    activeProviders: number;
    messages: number;
    feedback: number;
  };
  quality: {
    avgConfidence: number;
    hallucinationRate: number;
    successRate: number;
    failureRate: number;
    avgResponseTimeMs: number;
    feedbackRate: number;
    evaluatedMessages: number;
  };
  assistantsByDomain: { domain: string; count: number }[];
  providerHealth: {
    key: ProviderKey;
    name: string;
    isActive: boolean;
    isScaffold: boolean;
    assistants: number;
  }[];
  mostUsedAssistant: { id: string; name: string; conversations: number } | null;
  worstAssistant: { id: string; name: string; avgHallucination: number } | null;
  recentActivity: AuditLogItem[];
}
