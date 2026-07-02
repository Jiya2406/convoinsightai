import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { GovernanceStatus } from "@/types/api";

/** Colored badge for a governance status. */
export function GovernanceBadge({ status }: { status: GovernanceStatus }) {
  if (status === "BLOCK") {
    return (
      <Badge variant="destructive" className="gap-1">
        <ShieldX className="h-3 w-3" /> Blocked
      </Badge>
    );
  }
  if (status === "FLAG") {
    return (
      <Badge variant="warning" className="gap-1">
        <ShieldAlert className="h-3 w-3" /> Flagged
      </Badge>
    );
  }
  return (
    <Badge variant="success" className="gap-1">
      <ShieldCheck className="h-3 w-3" /> Passed
    </Badge>
  );
}
