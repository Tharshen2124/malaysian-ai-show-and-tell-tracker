"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

interface PaginationProps {
  /**
   * The page being shown. Where the query clamps and returns the page it served,
   * pass that rather than local state — the Next button steps up from this value,
   * so a stale number would leave it pointing at a page that no longer exists.
   */
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * The pager for every list page. It owns its own placement — centred, in normal
 * flow, below the content — so pages drop it in without a wrapper, and it renders
 * nothing at all when there is only one page to show.
 */
export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="flex justify-center">
      <div className="flex items-center gap-1 rounded-md border bg-card p-1 text-sm">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft />
        </Button>
        <span className="min-w-16 text-center text-muted-foreground tabular-nums">
          {page} – {totalPages}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}
