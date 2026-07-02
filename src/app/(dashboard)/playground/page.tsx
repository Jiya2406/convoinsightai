"use client";

import * as React from "react";
import { Send, Bot, User, Sparkles, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { EvaluationCard } from "@/components/features/evaluation/evaluation-card";
import { GovernanceBadge } from "@/components/features/evaluation/governance-badge";
import { FeedbackControl } from "@/components/features/feedback/feedback-control";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssistants, useSendMessage } from "@/lib/api-client/hooks";
import { ApiClientError } from "@/lib/api-client/client";
import { cn } from "@/lib/utils";
import type { EvaluationResult, GovernanceStatus, SourceRef } from "@/types/api";

interface ChatMessage {
  id?: string;
  role: "USER" | "ASSISTANT";
  content: string;
  governance?: { status: GovernanceStatus; reasons: string[] };
  evaluation?: EvaluationResult;
  sources?: SourceRef[];
}

export default function PlaygroundPage() {
  const { data: assistantsPage, isLoading: loadingAssistants } = useAssistants({ pageSize: 100, isActive: true });
  const assistants = assistantsPage?.data ?? [];
  const send = useSendMessage();

  const [assistantId, setAssistantId] = React.useState<string>("");
  const [prompt, setPrompt] = React.useState("");
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = React.useState<string | undefined>();
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Default to the first assistant once loaded.
  React.useEffect(() => {
    if (!assistantId && assistants.length > 0) setAssistantId(assistants[0].id);
  }, [assistants, assistantId]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, send.isPending]);

  const latest = [...messages].reverse().find((m) => m.role === "ASSISTANT" && m.evaluation);

  function resetChat() {
    setMessages([]);
    setConversationId(undefined);
  }

  async function onSend() {
    const text = prompt.trim();
    if (!text || !assistantId) return;

    setMessages((m) => [...m, { role: "USER", content: text }]);
    setPrompt("");

    try {
      const res = await send.mutateAsync({ assistantId, prompt: text, conversationId });
      setConversationId(res.conversationId);
      setMessages((m) => [
        ...m,
        {
          id: res.assistantMessage.id,
          role: "ASSISTANT",
          content: res.assistantMessage.content,
          governance: res.governance,
          evaluation: res.evaluation,
          sources: res.assistantMessage.sources,
        },
      ]);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "Failed to get a response";
      toast.error(message);
      setMessages((m) => [
        ...m,
        { role: "ASSISTANT", content: `⚠️ ${message}`, governance: { status: "BLOCK", reasons: [] } },
      ]);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Playground"
        description="Send prompts to an assistant and see the response evaluated and governed in real time."
        actions={
          <Button variant="outline" size="sm" onClick={resetChat} disabled={messages.length === 0}>
            <RotateCcw className="h-4 w-4" /> New chat
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Chat column */}
        <div className="lg:col-span-2">
          <Card className="flex h-[70vh] flex-col">
            <div className="flex items-center gap-3 border-b p-3">
              {loadingAssistants ? (
                <Skeleton className="h-9 w-64" />
              ) : (
                <Select value={assistantId} onValueChange={(v) => { setAssistantId(v); resetChat(); }}>
                  <SelectTrigger className="w-72">
                    <SelectValue placeholder="Select an assistant" />
                  </SelectTrigger>
                  <SelectContent>
                    {assistants.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} · {a.domain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {assistants.find((a) => a.id === assistantId)?.provider && (
                <Badge variant="secondary">
                  {assistants.find((a) => a.id === assistantId)?.provider?.name}
                </Badge>
              )}
            </div>

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.length === 0 && !send.isPending ? (
                <div className="flex h-full items-center justify-center">
                  <EmptyState
                    icon={Sparkles}
                    title={assistants.length === 0 ? "No active assistants" : "Start a conversation"}
                    description={
                      assistants.length === 0
                        ? "Create an assistant first, then come back to test it."
                        : "Ask a question — e.g. “How many vacation days do I get?”"
                    }
                  />
                </div>
              ) : (
                messages.map((m, i) => <MessageBubble key={i} message={m} />)
              )}
              {send.isPending && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Bot className="h-4 w-4" />
                  <span className="animate-pulse">Generating & evaluating…</span>
                </div>
              )}
            </div>

            <div className="border-t p-3">
              <div className="flex items-end gap-2">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Type your prompt… (Enter to send, Shift+Enter for newline)"
                  className="min-h-[44px] resize-none"
                  rows={1}
                  disabled={!assistantId || send.isPending}
                />
                <Button onClick={onSend} disabled={!prompt.trim() || !assistantId || send.isPending}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Evaluation column */}
        <div className="space-y-4">
          {latest?.evaluation ? (
            <>
              {latest.governance && (
                <Card>
                  <CardContent className="flex items-center justify-between p-4">
                    <span className="text-sm font-medium">Governance</span>
                    <div className="flex items-center gap-2">
                      <GovernanceBadge status={latest.governance.status} />
                      {latest.id && <FeedbackControl messageId={latest.id} />}
                    </div>
                  </CardContent>
                </Card>
              )}
              {latest.governance && latest.governance.reasons.length > 0 && (
                <Card>
                  <CardContent className="space-y-1 p-4">
                    <p className="text-xs font-medium text-muted-foreground">Governance notes</p>
                    <ul className="list-inside list-disc text-xs text-muted-foreground">
                      {latest.governance.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              <EvaluationCard evaluation={latest.evaluation} sources={latest.sources} />
            </>
          ) : (
            <Card>
              <CardContent className="p-6">
                <EmptyState
                  title="No evaluation yet"
                  description="Send a message to see its live evaluation and governance status here."
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "USER";
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          "max-w-[80%] space-y-2 rounded-lg px-3 py-2 text-sm",
          isUser ? "bg-primary text-primary-foreground" : "border bg-card",
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {!isUser && message.governance && (
          <div className="pt-1">
            <GovernanceBadge status={message.governance.status} />
          </div>
        )}
      </div>
    </div>
  );
}
