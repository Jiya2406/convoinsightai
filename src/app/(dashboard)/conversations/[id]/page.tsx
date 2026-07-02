"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bot, User } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { EvaluationCard } from "@/components/features/evaluation/evaluation-card";
import { GovernanceBadge } from "@/components/features/evaluation/governance-badge";
import { FeedbackControl } from "@/components/features/feedback/feedback-control";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useConversation } from "@/lib/api-client/hooks";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";

export default function ConversationDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useConversation(params.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/conversations" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader
          title={data?.title ?? "Conversation"}
          description={
            data ? `${data.assistant.name} · ${data.assistant.domain} · ${formatDate(data.createdAt)}` : undefined
          }
        />
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {data?.messages.map((m) => {
            const isUser = m.role === "USER";
            return (
              <div key={m.id} className={cn("flex gap-3", isUser && "flex-row-reverse")}>
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    isUser ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={cn("w-full max-w-2xl space-y-3", isUser && "flex flex-col items-end")}>
                  <div
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm",
                      isUser ? "bg-primary text-primary-foreground" : "border bg-card",
                    )}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>

                  {!isUser && (
                    <div className="flex items-center gap-2">
                      <GovernanceBadge status={m.governanceStatus} />
                      <Badge variant="secondary" className="text-[10px]">
                        {m.tokens} tokens
                      </Badge>
                      <FeedbackControl messageId={m.id} />
                    </div>
                  )}

                  {!isUser && m.evaluation && (
                    <div className="w-full">
                      <EvaluationCard evaluation={m.evaluation} sources={m.sources} />
                    </div>
                  )}

                  {!isUser && m.governanceReasons.length > 0 && (
                    <Card className="w-full">
                      <CardContent className="space-y-1 p-3">
                        <p className="text-xs font-medium text-muted-foreground">Governance notes</p>
                        <ul className="list-inside list-disc text-xs text-muted-foreground">
                          {m.governanceReasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
