"use client";

import { toast } from "sonner";
import { useDeleteAssistant } from "@/lib/api-client/hooks";
import { ApiClientError } from "@/lib/api-client/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Assistant } from "@/types/api";

interface Props {
  assistant: Assistant | null;
  onOpenChange: (open: boolean) => void;
}

/** Confirmation dialog for deleting an assistant. */
export function DeleteAssistantDialog({ assistant, onOpenChange }: Props) {
  const del = useDeleteAssistant();

  async function onConfirm() {
    if (!assistant) return;
    try {
      await del.mutateAsync(assistant.id);
      toast.success("Assistant deleted");
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "Failed to delete assistant";
      toast.error(message);
    }
  }

  return (
    <Dialog open={Boolean(assistant)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete assistant</DialogTitle>
          <DialogDescription>
            This permanently deletes <span className="font-medium">{assistant?.name}</span> and its
            conversations, knowledge, and evaluations. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={del.isPending}>
            {del.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
