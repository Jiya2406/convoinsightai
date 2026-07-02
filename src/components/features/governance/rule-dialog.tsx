"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateGovernanceRule, useAssistants } from "@/lib/api-client/hooks";
import { ApiClientError } from "@/lib/api-client/client";
import type { GovernanceRuleType, GovernanceAction } from "@/types/api";

const RULE_TYPES: { value: GovernanceRuleType; label: string; help: string }[] = [
  { value: "GROUNDING", label: "Grounding required", help: "Flag/block answers not grounded in a source." },
  { value: "THRESHOLD", label: "Hallucination threshold", help: "Trigger when hallucination risk exceeds a limit." },
  { value: "BANNED_WORD", label: "Banned words", help: "Trigger when the answer contains listed words." },
  { value: "PII", label: "PII detection", help: "Trigger when the answer may contain PII (email/phone/SSN)." },
];

export function RuleDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const create = useCreateGovernanceRule();
  const { data: assistantsPage } = useAssistants({ pageSize: 100 });
  const assistants = assistantsPage?.data ?? [];

  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<GovernanceRuleType>("GROUNDING");
  const [action, setAction] = React.useState<GovernanceAction>("FLAG");
  const [scope, setScope] = React.useState("GLOBAL");
  const [words, setWords] = React.useState("");
  const [maxHallucination, setMaxHallucination] = React.useState(60);

  React.useEffect(() => {
    if (open) {
      setName("");
      setType("GROUNDING");
      setAction("FLAG");
      setScope("GLOBAL");
      setWords("");
      setMaxHallucination(60);
    }
  }, [open]);

  function buildConfig(): Record<string, unknown> {
    switch (type) {
      case "BANNED_WORD":
        return { words: words.split(",").map((w) => w.trim()).filter(Boolean) };
      case "THRESHOLD":
        return { maxHallucinationRisk: maxHallucination };
      case "GROUNDING":
        return { requireGroundedSource: true };
      default:
        return {};
    }
  }

  async function onSubmit() {
    if (!name.trim()) {
      toast.error("Give the rule a name.");
      return;
    }
    try {
      await create.mutateAsync({
        name: name.trim(),
        type,
        action,
        config: buildConfig(),
        assistantId: scope === "GLOBAL" ? undefined : scope,
        isActive: true,
      });
      toast.success("Rule created");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Failed to create rule");
    }
  }

  const help = RULE_TYPES.find((t) => t.value === type)?.help;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New governance rule</DialogTitle>
          <DialogDescription>Rules are evaluated on every generated response.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Require grounded answers" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as GovernanceRuleType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RULE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Action</Label>
              <Select value={action} onValueChange={(v) => setAction(v as GovernanceAction)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FLAG">Flag</SelectItem>
                  <SelectItem value="BLOCK">Block</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {help && <p className="text-xs text-muted-foreground">{help}</p>}

          {type === "BANNED_WORD" && (
            <div className="space-y-1.5">
              <Label>Banned words (comma-separated)</Label>
              <Input value={words} onChange={(e) => setWords(e.target.value)} placeholder="password, secret, confidential" />
            </div>
          )}
          {type === "THRESHOLD" && (
            <div className="space-y-1.5">
              <Label>Max hallucination risk (0–100)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={maxHallucination}
                onChange={(e) => setMaxHallucination(Number(e.target.value))}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Scope</Label>
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="GLOBAL">All assistants (global)</SelectItem>
                {assistants.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSubmit} disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create rule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
