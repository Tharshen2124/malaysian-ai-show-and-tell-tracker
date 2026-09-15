"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { iconButtonClass } from "./button";

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
      <div className="flex items-center gap-1 rounded-button border-[1.5px] border-hairline bg-card p-1 text-sm">
        <button
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={`${iconButtonClass()} disabled:cursor-not-allowed max-sm:h-11 max-sm:w-11`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-16 text-center text-muted tabular-nums">
          {page} – {totalPages}
        </span>
        <button
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className={`${iconButtonClass()} disabled:cursor-not-allowed max-sm:h-11 max-sm:w-11`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
