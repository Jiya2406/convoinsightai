"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  getData,
  getPage,
  postData,
  patchData,
  deleteData,
  qs,
} from "@/lib/api-client/client";
import type {
  Assistant,
  Provider,
  ConversationListItem,
  ConversationDetail,
  AuditLogItem,
  DashboardStats,
  PlaygroundResult,
  KnowledgeVersion,
  KnowledgeDetail,
  PromptTestResult,
  EvaluationListItem,
  GovernanceRule,
  AnalyticsData,
  NotificationItem,
  FeedbackType,
  FeedbackListItem,
} from "@/types/api";

/* ─────────────────────────── Dashboard ─────────────────────────── */
export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => getData<DashboardStats>("/dashboard/stats"),
  });
}

/* ─────────────────────────── Assistants ────────────────────────── */
export interface AssistantFilters {
  page?: number;
  pageSize?: number;
  q?: string;
  domain?: string;
  isActive?: boolean;
}

export function useAssistants(filters: AssistantFilters = {}) {
  return useQuery({
    queryKey: ["assistants", filters],
    queryFn: () => getPage<Assistant>(`/assistants${qs({ ...filters })}`),
    placeholderData: keepPreviousData,
  });
}

export function useAssistant(id: string | undefined) {
  return useQuery({
    queryKey: ["assistants", "detail", id],
    queryFn: () => getData<Assistant>(`/assistants/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateAssistant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => postData<Assistant>("/assistants", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assistants"] }),
  });
}

export function useUpdateAssistant(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      patchData<Assistant>(`/assistants/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assistants"] }),
  });
}

export function useDeleteAssistant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteData(`/assistants/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assistants"] }),
  });
}

/* ─────────────────────────── Providers ─────────────────────────── */
export function useProviders() {
  return useQuery({
    queryKey: ["providers"],
    queryFn: () => getData<Provider[]>("/providers"),
  });
}

export function useUpdateProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      patchData<Provider>(`/providers/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["providers"] }),
  });
}

/* ──────────────────────── Playground ───────────────────────────── */
export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { assistantId: string; prompt: string; conversationId?: string }) =>
      postData<PlaygroundResult>("/playground", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

/* ──────────────────────── Conversations ────────────────────────── */
export function useConversations(filters: { page?: number; pageSize?: number; q?: string } = {}) {
  return useQuery({
    queryKey: ["conversations", filters],
    queryFn: () => getPage<ConversationListItem>(`/conversations${qs({ ...filters })}`),
    placeholderData: keepPreviousData,
  });
}

export function useConversation(id: string | undefined) {
  return useQuery({
    queryKey: ["conversations", "detail", id],
    queryFn: () => getData<ConversationDetail>(`/conversations/${id}`),
    enabled: Boolean(id),
  });
}

/* ─────────────────────────── Audit Logs ────────────────────────── */
export function useAuditLogs(filters: { page?: number; pageSize?: number; entity?: string } = {}) {
  return useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: () => getPage<AuditLogItem>(`/audit-logs${qs({ ...filters })}`),
    placeholderData: keepPreviousData,
  });
}

/* ─────────────────────────── Knowledge ─────────────────────────── */
export function useKnowledgeVersions(assistantId: string | undefined) {
  return useQuery({
    queryKey: ["knowledge", assistantId],
    queryFn: () => getData<KnowledgeVersion[]>(`/knowledge${qs({ assistantId })}`),
    enabled: Boolean(assistantId),
  });
}

export function useKnowledge(id: string | undefined) {
  return useQuery({
    queryKey: ["knowledge", "detail", id],
    queryFn: () => getData<KnowledgeDetail>(`/knowledge/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateKnowledge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => postData<KnowledgeDetail>("/knowledge", payload),
    onSuccess: (_d, vars) => {
      const assistantId = (vars as { assistantId?: string }).assistantId;
      qc.invalidateQueries({ queryKey: ["knowledge", assistantId] });
    },
  });
}

export function useActivateKnowledge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => postData<KnowledgeDetail>(`/knowledge/${id}/activate`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["knowledge"] }),
  });
}

/* ─────────────────────────── Prompt Studio ─────────────────────── */
export function useRunPromptTest() {
  return useMutation({
    mutationFn: (payload: {
      assistantId: string;
      promptA: string;
      promptB: string;
      input: string;
      name?: string;
    }) => postData<PromptTestResult>("/prompt-tests", payload),
  });
}

/* ─────────────────────────── Evaluations ───────────────────────── */
export function useEvaluations(filters: { page?: number; pageSize?: number; evaluator?: string } = {}) {
  return useQuery({
    queryKey: ["evaluations", filters],
    queryFn: () => getPage<EvaluationListItem>(`/evaluations${qs({ ...filters })}`),
    placeholderData: keepPreviousData,
  });
}

/* ─────────────────────────── Governance ────────────────────────── */
export function useGovernanceRules(assistantId?: string) {
  return useQuery({
    queryKey: ["governance", assistantId ?? "all"],
    queryFn: () => getData<GovernanceRule[]>(`/governance${qs({ assistantId })}`),
  });
}

export function useCreateGovernanceRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => postData<GovernanceRule>("/governance", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["governance"] }),
  });
}

export function useUpdateGovernanceRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      patchData<GovernanceRule>(`/governance/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["governance"] }),
  });
}

export function useDeleteGovernanceRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteData(`/governance/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["governance"] }),
  });
}

/* ─────────────────────────── Analytics ─────────────────────────── */
export function useAnalytics(windowDays = 30) {
  return useQuery({
    queryKey: ["analytics", windowDays],
    queryFn: () => getData<AnalyticsData>(`/analytics${qs({ windowDays })}`),
  });
}

/* ─────────────────────────── Feedback ──────────────────────────── */
export function useFeedbackList(filters: { page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ["feedback", filters],
    queryFn: () => getPage<FeedbackListItem>(`/feedback${qs({ ...filters })}`),
    placeholderData: keepPreviousData,
  });
}

export function useSubmitFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { messageId: string; type: FeedbackType; comment?: string }) =>
      postData("/feedback", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

/* ─────────────────────────── Notifications ─────────────────────── */
export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => getData<{ items: NotificationItem[]; unread: number }>("/notifications"),
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => patchData(`/notifications/${id}`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => postData("/notifications/read-all", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
