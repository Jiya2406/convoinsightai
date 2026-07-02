"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCreateKnowledge } from "@/lib/api-client/hooks";
import { ApiClientError } from "@/lib/api-client/client";

interface DocRow {
  title: string;
  content: string;
}

export function CreateVersionDialog({
  assistantId,
  open,
  onOpenChange,
}: {
  assistantId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const create = useCreateKnowledge();
  const [name, setName] = React.useState("Knowledge Base");
  const [docs, setDocs] = React.useState<DocRow[]>([{ title: "", content: "" }]);

  React.useEffect(() => {
    if (open) {
      setName("Knowledge Base");
      setDocs([{ title: "", content: "" }]);
    }
  }, [open]);

  function updateDoc(i: number, patch: Partial<DocRow>) {
    setDocs((d) => d.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  async function onSubmit() {
    const documents = docs
      .filter((d) => d.title.trim() && d.content.trim())
      .map((d) => ({ type: "TEXT" as const, title: d.title.trim(), content: d.content.trim() }));
    if (documents.length === 0) {
      toast.error("Add at least one document with a title and content.");
      return;
    }
    try {
      await create.mutateAsync({ assistantId, name, activate: true, documents });
      toast.success("Knowledge version created and activated");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Failed to create version");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New knowledge version</DialogTitle>
          <DialogDescription>
            Add documents for the assistant to ground its answers on. This creates a new version and
            makes it active.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="kb-name">Version name</Label>
            <Input id="kb-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-3">
            {docs.map((doc, i) => (
              <div key={i} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Document title (e.g. Paid Time Off Policy)"
                    value={doc.title}
                    onChange={(e) => updateDoc(i, { title: e.target.value })}
                  />
                  {docs.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDocs((d) => d.filter((_, idx) => idx !== i))}
                      aria-label="Remove document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Textarea
                  rows={3}
                  placeholder="Document content…"
                  value={doc.content}
                  onChange={(e) => updateDoc(i, { content: e.target.value })}
                />
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDocs((d) => [...d, { title: "", content: "" }])}
            >
              <Plus className="h-4 w-4" /> Add document
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create version"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
