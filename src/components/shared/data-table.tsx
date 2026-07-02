"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import type { PageMeta } from "@/types/api";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[] | undefined;
  loading?: boolean;
  rowKey: (row: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  meta?: PageMeta;
  onPageChange?: (page: number) => void;
}

/** Generic, reusable data table with skeleton loading, empty state, pagination. */
export function DataTable<T>({
  columns,
  rows,
  loading,
  rowKey,
  emptyTitle = "No results",
  emptyDescription,
  meta,
  onPageChange,
}: DataTableProps<T>) {
  const showSkeleton = loading && !rows;
  const isEmpty = !loading && rows && rows.length === 0;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key} className={c.className}>
                  {c.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {showSkeleton &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  {columns.map((c) => (
                    <TableCell key={c.key} className={c.className}>
                      <Skeleton className="h-5 w-full max-w-[160px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {rows?.map((row) => (
              <TableRow key={rowKey(row)}>
                {columns.map((c) => (
                  <TableCell key={c.key} className={cn(c.className)}>
                    {c.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {isEmpty && (
          <div className="p-4">
            <EmptyState title={emptyTitle} description={emptyDescription} />
          </div>
        )}
      </div>

      {meta && meta.totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {meta.page} of {meta.totalPages} · {meta.total} total
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => onPageChange(meta.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => onPageChange(meta.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
