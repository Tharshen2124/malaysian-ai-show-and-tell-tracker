"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { FunctionReturnType } from "convex/server";
import { CircleCheck, CircleDashed, FolderPlus, Pencil, Search, Trash2, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useIsAdmin } from "@/lib/use-access";
import { useToast } from "@/components/providers/toast-provider";
import { ProjectFormModal } from "@/components/forms/project-form-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";
import { ProjectRowSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/error-state";
import { buttonClass, iconButtonClass } from "@/components/ui/button";
import { PROJECT_CATEGORY_LABELS } from "@/lib/labels";

type ProjectItem = FunctionReturnType<typeof api.projects.list>["data"][number];

/** Names shown inline in the table; the rest collapse into a "+N more" hint. */
const VISIBLE_MEMBERS = 2;

/**
 * The header and every row are separate grids, so they only line up while they
 * share this template — including a fixed last column, since an `auto` one
 * resolves differently for admins (two buttons) and members (nothing).
 */
const GRID_COLS =
  "sm:grid-cols-[minmax(0,1fr)_8rem_minmax(0,1fr)_6rem_7rem_4rem]";

function ProjectRow({ project }: { project: ProjectItem }) {
  const isAdmin = useIsAdmin();
  const toast = useToast();
  const removeProject = useMutation(api.projects.remove);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  return (
    <div
      className={`grid grid-cols-1 gap-2 border-b border-hairline px-4 py-3.5 last:border-b-0 sm:items-center sm:gap-4 ${GRID_COLS}`}
    >
      <Link
        href={`/projects/${project._id}`}
        title={project.name}
        className="min-w-0 truncate underline-offset-4 hover:underline"
      >
        {project.name}
      </Link>
      <span className="text-sm text-muted">{PROJECT_CATEGORY_LABELS[project.category]}</span>
      {/* Only the first few names fit a row; the rest are on the project page. */}
      <span
        className="min-w-0 truncate text-sm text-muted"
        title={project.members.map((m) => m.name).join(", ")}
      >
        {project.members.length === 0
          ? "—"
          : project.members.slice(0, VISIBLE_MEMBERS).map((m, i) => (
              <span key={m.id}>
                {i > 0 && ", "}
                <Link href={`/members/${m.id}`} className="underline-offset-4 hover:underline">
                  {m.name}
                </Link>
              </span>
            ))}
        {project.members.length > VISIBLE_MEMBERS && (
          <span className="text-faint">
            {" "}
            +{project.members.length - VISIBLE_MEMBERS} more
          </span>
        )}
      </span>
      <span className="text-sm whitespace-nowrap text-muted tabular-nums">
        {project.updateCount} {project.updateCount === 1 ? "update" : "updates"}
      </span>
      <span
        className={`inline-flex items-center gap-1.5 text-sm whitespace-nowrap ${
          project.completed ? "text-success" : "text-faint"
        }`}
      >
        {project.completed ? (
          <CircleCheck className="h-4 w-4" />
        ) : (
          <CircleDashed className="h-4 w-4" />
        )}
        {project.completed ? "Completed" : "Ongoing"}
      </span>
      {isAdmin ? (
        <span className="flex items-center gap-1 sm:justify-end">
          <button
            aria-label={`Edit ${project.name}`}
            onClick={() => setEditing(true)}
            className={iconButtonClass()}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            aria-label={`Delete ${project.name}`}
            onClick={() => setConfirming(true)}
            className={iconButtonClass("danger")}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </span>
      ) : (
        <span />
      )}

      <ProjectFormModal
        open={editing}
        onClose={() => setEditing(false)}
        initial={{
          id: project._id,
          name: project.name,
          category: project.category,
          completed: project.completed,
          memberIds: project.members.map((m) => m.id),
        }}
      />
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Delete project"
        description={`Deleting "${project.name}" will also delete its ${project.updateCount} ${
          project.updateCount === 1 ? "update" : "updates"
        }. This cannot be undone.`}
        onConfirm={async () => {
          try {
            await removeProject({ id: project._id });
            toast.success("Successfully deleted project!");
          } catch {
            toast.error("Error occurred, project was not deleted.");
          }
        }}
      />
    </div>
  );
}

export default function ProjectsPage() {
  const isAdmin = useIsAdmin();
  const [creating, setCreating] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  // 300ms debounce — filtering happens on the server now, so every keystroke
  // would otherwise be a round trip.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const result = useQuery(api.projects.list, { search: debouncedSearch, page });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="mt-3 text-sm text-soft">
            Everything the community is building, and how often it gets talked about.
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setCreating(true)} className={`${buttonClass("primary")} ml-auto`}>
            <FolderPlus className="h-4 w-4" />
            New Project
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-faint" />
        <input
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            setPage(1);
          }}
          placeholder="Search projects by name…"
          className="field-input pr-9 pl-9"
        />
        {searchInput && (
          <button
            aria-label="Clear search"
            onClick={() => {
              setSearchInput("");
              setPage(1);
            }}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-faint hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="card-surface overflow-hidden">
        <div
          className={`kicker hidden gap-4 border-b border-hairline bg-recessed px-4 py-2.5 sm:grid ${GRID_COLS}`}
        >
          <span>Name</span>
          <span>Category</span>
          <span>Members</span>
          <span>Updates</span>
          <span>Status</span>
          <span />
        </div>
        {result === undefined ? (
          <>
            <ProjectRowSkeleton />
            <ProjectRowSkeleton />
            <ProjectRowSkeleton />
            <ProjectRowSkeleton />
          </>
        ) : result.data.length === 0 ? (
          <div className="p-4">
            <EmptyState
              message={
                debouncedSearch ? `No projects match “${debouncedSearch}”.` : "No projects yet."
              }
            />
          </div>
        ) : (
          result.data.map((project) => <ProjectRow key={project._id} project={project} />)
        )}
      </div>

      {/* `result.page` is the clamped page the server actually served. */}
      {result && (
        <Pagination page={result.page} totalPages={result.totalPages} onPageChange={setPage} />
      )}

      <ProjectFormModal open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
