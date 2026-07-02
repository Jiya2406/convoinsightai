import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  accent?: "default" | "success" | "warning" | "destructive";
  loading?: boolean;
}

const accentClasses: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  default: "text-primary bg-primary/10",
  success: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
  warning: "text-amber-600 bg-amber-500/10 dark:text-amber-400",
  destructive: "text-destructive bg-destructive/10",
};

/** Single KPI metric card used across the dashboard. */
export function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = "default",
  loading,
}: KpiCardProps) {
  return (
    <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg", accentClasses[accent])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
          )}
          {hint && !loading && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
