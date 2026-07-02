"use client";

import * as React from "react";
import { FlaskConical, Play, Trophy } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { AssistantPicker } from "@/components/shared/assistant-picker";
import { EvaluationCard } from "@/components/features/evaluation/evaluation-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useRunPromptTest } from "@/lib/api-client/hooks";
import { ApiClientError } from "@/lib/api-client/client";
import { cn } from "@/lib/utils";
import type { PromptTestResult } from "@/types/api";

export default function PromptStudioPage() {
  const [assistantId, setAssistantId] = React.useState("");
  const [promptA, setPromptA] = React.useState(
    "You are a helpful assistant. Answer the question using the knowledge provided.",
  );
  const [promptB, setPromptB] = React.useState(
    "You are a concise expert assistant. Answer strictly from the provided knowledge and always cite the source titles. If unsure, say you don't know.",
  );
  const [input, setInput] = React.useState("How many vacation days do I get?");
  const [result, setResult] = React.useState<PromptTestResult | null>(null);
  const run = useRunPromptTest();

  async function onRun() {
    if (!assistantId || !promptA.trim() || !promptB.trim() || !input.trim()) return;
    try {
      const res = await run.mutateAsync({ assistantId, promptA, promptB, input });
      setResult(res);
      toast.success(`Comparison complete — Prompt ${res.winner} wins`);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Failed to run comparison");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prompt Studio"
        description="Compare two system prompts on the same input and see which produces better-evaluated answers."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FlaskConical className="h-4 w-4" /> A/B Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Label className="sm:w-28">Assistant</Label>
            <AssistantPicker value={assistantId} onChange={setAssistantId} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Prompt A</Label>
              <Textarea rows={4} value={promptA} onChange={(e) => setPromptA(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Prompt B</Label>
              <Textarea rows={4} value={promptB} onChange={(e) => setPromptB(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Test input</Label>
            <Input value={input} onChange={(e) => setInput(e.target.value)} />
          </div>

          <Button onClick={onRun} disabled={!assistantId || run.isPending}>
            <Play className="h-4 w-4" />
            {run.isPending ? "Running comparison…" : "Run comparison"}
          </Button>
        </CardContent>
      </Card>

      {result ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <VariantColumn label="A" result={result} />
          <VariantColumn label="B" result={result} />
        </div>
      ) : (
        <EmptyState
          icon={FlaskConical}
          title="No comparison yet"
          description="Configure prompts above and run a comparison to see side-by-side scores."
        />
      )}
    </div>
  );
}

function VariantColumn({ label, result }: { label: "A" | "B"; result: PromptTestResult }) {
  const variant = label === "A" ? result.variantA : result.variantB;
  const isWinner = result.winner === label;
  return (
    <div className="space-y-3">
      <div
        className={cn(
          "flex items-center justify-between rounded-lg border p-3",
          isWinner && "border-emerald-500/50 bg-emerald-500/5",
        )}
      >
        <span className="font-medium">Prompt {label}</span>
        {isWinner ? (
          <Badge variant="success" className="gap-1">
            <Trophy className="h-3 w-3" /> Winner
          </Badge>
        ) : (
          <Badge variant="muted">Runner-up</Badge>
        )}
      </div>
      <Card>
        <CardContent className="p-4">
          <p className="whitespace-pre-wrap text-sm">{variant.output}</p>
        </CardContent>
      </Card>
      <EvaluationCard evaluation={variant.evaluation} />
    </div>
  );
}
