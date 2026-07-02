import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ChartCardProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

/** Card wrapper for charts/visualizations with a consistent header. */
export function ChartCard({ title, description, action, children }: ChartCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
