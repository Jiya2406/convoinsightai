import { NextResponse } from "next/server";

/**
 * Standard success envelopes. All API responses are either:
 *   { data, meta? }              (success)
 *   { error: { code, message } } (failure — see errors/handler.ts)
 */
export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function paginated<T>(data: T[], meta: PageMeta) {
  return NextResponse.json({ data, meta });
}

export function buildPageMeta(page: number, pageSize: number, total: number): PageMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
