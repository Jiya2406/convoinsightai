"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAssistants } from "@/lib/api-client/hooks";

/**
 * Assistant selector reused by Playground / Knowledge / Prompt Studio /
 * Governance. Auto-selects the first assistant once loaded.
 */
export function AssistantPicker({
  value,
  onChange,
  className,
  activeOnly = true,
}: {
  value: string;
  onChange: (id: string) => void;
  className?: string;
  activeOnly?: boolean;
}) {
  const { data, isLoading } = useAssistants({ pageSize: 100, isActive: activeOnly || undefined });
  const assistants = data?.data ?? [];

  React.useEffect(() => {
    if (!value && assistants.length > 0) onChange(assistants[0].id);
  }, [assistants, value, onChange]);

  if (isLoading) return <Skeleton className={className ?? "h-9 w-72"} />;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className ?? "w-72"}>
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
  );
}
