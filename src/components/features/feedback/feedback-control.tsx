"use client";

import * as React from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitFeedback } from "@/lib/api-client/hooks";
import { usePermissions } from "@/lib/auth/use-permissions";
import { ApiClientError } from "@/lib/api-client/client";
import { cn } from "@/lib/utils";
import type { FeedbackType } from "@/types/api";

/** Thumbs up/down with an optional comment dialog, for a single message. */
export function FeedbackControl({ messageId }: { messageId: string }) {
  const { can } = usePermissions();
  const submit = useSubmitFeedback();
  const [selected, setSelected] = React.useState<FeedbackType | null>(null);
  const [dialogType, setDialogType] = React.useState<FeedbackType | null>(null);
  const [comment, setComment] = React.useState("");

  if (!can("feedback:create")) return null;

  async function send(type: FeedbackType, withComment?: string) {
    try {
      await submit.mutateAsync({ messageId, type, comment: withComment });
      setSelected(type);
      toast.success("Feedback recorded");
      setDialogType(null);
      setComment("");
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Failed to submit feedback");
    }
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", selected === "UP" && "text-emerald-600")}
          onClick={() => send("UP")}
          disabled={submit.isPending}
          aria-label="Thumbs up"
        >
          <ThumbsUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", selected === "DOWN" && "text-destructive")}
          onClick={() => setDialogType("DOWN")}
          disabled={submit.isPending}
          aria-label="Thumbs down"
        >
          <ThumbsDown className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Dialog open={dialogType !== null} onOpenChange={(o) => !o && setDialogType(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>What went wrong?</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={3}
            placeholder="Optional: describe the issue with this response…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogType(null)}>
              Cancel
            </Button>
            <Button onClick={() => send("DOWN", comment || undefined)} disabled={submit.isPending}>
              Submit feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
