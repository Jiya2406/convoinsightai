"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createAssistantSchema, type CreateAssistantInput } from "@/lib/validation/assistant.schema";
import {
  useCreateAssistant,
  useUpdateAssistant,
  useProviders,
} from "@/lib/api-client/hooks";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Assistant } from "@/types/api";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assistant?: Assistant | null;
}

const DOMAINS = ["HR", "Finance", "Legal", "Travel", "Support", "Sales", "IT"];

/** Create/edit dialog for an assistant. Uses react-hook-form + Zod. */
export function AssistantFormDialog({ open, onOpenChange, assistant }: Props) {
  const isEdit = Boolean(assistant);
  const { data: providers } = useProviders();
  const create = useCreateAssistant();
  const update = useUpdateAssistant(assistant?.id ?? "");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateAssistantInput>({
    resolver: zodResolver(createAssistantSchema),
    defaultValues: {
      name: "",
      domain: "HR",
      description: "",
      systemPrompt: "",
      providerId: "",
      model: "mock-1",
      temperature: 0.7,
    },
  });

  // Reset the form whenever the dialog opens (prefill on edit).
  React.useEffect(() => {
    if (!open) return;
    reset({
      name: assistant?.name ?? "",
      domain: assistant?.domain ?? "HR",
      description: assistant?.description ?? "",
      systemPrompt: assistant?.systemPrompt ?? "",
      providerId: assistant?.providerId ?? "",
      model: assistant?.model ?? "mock-1",
      temperature: assistant?.temperature ?? 0.7,
    });
  }, [open, assistant, reset]);

  const activeProviders = (providers ?? []).filter((p) => p.isActive);
  const domain = watch("domain");
  const providerId = watch("providerId");

  async function onSubmit(values: CreateAssistantInput) {
    try {
      if (isEdit) {
        await update.mutateAsync(values);
        toast.success("Assistant updated");
      } else {
        await create.mutateAsync(values);
        toast.success("Assistant created");
      }
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "Failed to save assistant";
      toast.error(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit assistant" : "New assistant"}</DialogTitle>
          <DialogDescription>
            Configure the assistant&apos;s persona, provider, and behavior.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="HR Helpdesk" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Domain</Label>
              <Select value={domain} onValueChange={(v) => setValue("domain", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select domain" />
                </SelectTrigger>
                <SelectContent>
                  {DOMAINS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.domain && <p className="text-xs text-destructive">{errors.domain.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Provider</Label>
              <Select value={providerId} onValueChange={(v) => setValue("providerId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {activeProviders.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.providerId && (
                <p className="text-xs text-destructive">{errors.providerId.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input id="description" placeholder="Short summary" {...register("description")} />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="systemPrompt">System prompt</Label>
            <Textarea
              id="systemPrompt"
              rows={5}
              placeholder="You are an HR assistant. Answer only using the provided policy knowledge and always cite the source."
              {...register("systemPrompt")}
            />
            {errors.systemPrompt && (
              <p className="text-xs text-destructive">{errors.systemPrompt.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="model">Model</Label>
              <Input id="model" placeholder="mock-1" {...register("model")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="temperature">Temperature</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                min={0}
                max={2}
                {...register("temperature", { valueAsNumber: true })}
              />
              {errors.temperature && (
                <p className="text-xs text-destructive">{errors.temperature.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEdit ? "Save changes" : "Create assistant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
