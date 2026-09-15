"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { Check, ListFilter, Search, UserPlus, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useIsAdmin } from "@/lib/use-access";
import { MemberCard } from "@/components/cards/member-card";
import { MemberForm } from "@/components/forms/member-form";
import { ModalLayout } from "@/components/ui/modal-layout";
import { Pagination } from "@/components/ui/pagination";
import { CardGridSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/error-state";
import { buttonClass } from "@/components/ui/button";
import {
  MEMBER_ACTIVE_FILTER_LABELS,
  MEMBER_SORT_LABELS,
  MemberActiveFilter,
  MemberSort,
} from "@/lib/labels";

export default function MembersPage() {
  const isAdmin = useIsAdmin();

  const [activeFilter, setActiveFilter] = useState<MemberActiveFilter>("active");
  const [sortBy, setSortBy] = useState<MemberSort>("recent_talks");
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // 300ms debounce on search.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!filterOpen) return;
    const onClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [filterOpen]);

  const searching = debouncedSearch !== "";

  const list = useQuery(
    api.members.list,
    !searching
      ? {
          isActive: activeFilter === "all" ? undefined : activeFilter === "active",
          sortBy,
          page,
        }
      : "skip",
  );
  const searchResults = useQuery(
    api.members.search,
    searching ? { query: debouncedSearch } : "skip",
  );

  const setFilterAndReset = (next: MemberActiveFilter) => {
    setActiveFilter(next);
    setPage(1);
  };

  const members = searching ? searchResults : list?.data;

  const optionClass =
    "flex w-full items-center justify-between rounded-button px-2 py-1.5 text-sm hover:bg-recessed max-sm:min-h-11";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="page-title">Members</h1>
        {/* Active filter chip at md+ */}
        <span className="hidden rounded-full border border-hairline px-2.5 py-1 text-[0.72rem] text-muted md:inline">
          {MEMBER_ACTIVE_FILTER_LABELS[activeFilter]}
        </span>

        <div className="ml-auto flex items-center gap-2">
          {isAdmin && (
            <button onClick={() => setCreating(true)} className={buttonClass("primary")}>
              <UserPlus className="h-4 w-4" />
              New Member
            </button>
          )}
          {/* Filter + sort popover */}
          <div ref={filterRef} className="relative">
            <button
              onClick={() => setFilterOpen((o) => !o)}
              aria-expanded={filterOpen}
              className={buttonClass("outline")}
            >
              <ListFilter className="h-4 w-4" />
              Filter
            </button>
            {filterOpen && (
              <div className="absolute right-0 z-30 mt-1 w-64 rounded-media border border-hairline bg-card-raised p-3 shadow-float">
                <p className="kicker mb-2">Show</p>
                <div className="space-y-1">
                  {(Object.keys(MEMBER_ACTIVE_FILTER_LABELS) as MemberActiveFilter[]).map(
                    (filter) => (
                      <button
                        key={filter}
                        onClick={() => setFilterAndReset(filter)}
                        className={optionClass}
                      >
                        {MEMBER_ACTIVE_FILTER_LABELS[filter]}
                        {activeFilter === filter && <Check className="h-4 w-4 text-success" />}
                      </button>
                    ),
                  )}
                </div>
                <p className="kicker mt-3 mb-2 border-t border-hairline pt-3">Sort by</p>
                <div className="space-y-1">
                  {(Object.keys(MEMBER_SORT_LABELS) as MemberSort[]).map((sort) => (
                    <button
                      key={sort}
                      onClick={() => {
                        setSortBy(sort);
                        setPage(1);
                      }}
                      className={optionClass}
                    >
                      {MEMBER_SORT_LABELS[sort]}
                      {sortBy === sort && <Check className="h-4 w-4 text-success" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-faint" />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search members by name…"
          className="field-input pr-9 pl-9"
        />
        {searchInput && (
          <button
            aria-label="Clear search"
            onClick={() => setSearchInput("")}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-faint hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Grid */}
      {members === undefined ? (
        <CardGridSkeleton count={8} kind="member" />
      ) : members.length === 0 ? (
        <EmptyState
          message={
            searching ? `No members match “${debouncedSearch}”.` : "No members match this filter."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {members.map((member) => (
            <MemberCard key={member._id} member={member} />
          ))}
        </div>
      )}

      {/* Hidden while searching — search returns one unpaged batch. */}
      {!searching && list && (
        <Pagination page={page} totalPages={list.totalPages} onPageChange={setPage} />
      )}

      <ModalLayout open={creating} onClose={() => setCreating(false)} title="New Member" wide>
        <MemberForm onSaved={() => setCreating(false)} onCancel={() => setCreating(false)} />
      </ModalLayout>
    </div>
  );
}
