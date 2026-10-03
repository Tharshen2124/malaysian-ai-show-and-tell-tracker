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
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { ProjectRowSkeleton } from "@/components/ui/skeletons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { PROJECT_CATEGORY_LABELS } from "@/lib/labels";

type ProjectItem = FunctionReturnType<typeof api.projects.list>["data"][number];

/** Names shown inline in the table; the rest collapse into a "+N more" hint. */
const VISIBLE_MEMBERS = 2;

function ProjectRow({ project }: { project: ProjectItem }) {
  const isAdmin = useIsAdmin();
  const toast = useToast();
  const removeProject = useMutation(api.projects.remove);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  return (
    <TableRow>
      <TableCell className="max-w-0 font-medium">
        <Link
          href={`/projects/${project._id}`}
          title={project.name}
          className="block truncate underline-offset-4 hover:underline"
        >
          {project.name}
        </Link>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {PROJECT_CATEGORY_LABELS[project.category]}
      </TableCell>
      {/* Only the first few names fit a row; the rest are on the project page. */}
      <TableCell
        className="max-w-0 truncate text-muted-foreground"
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
          <span className="text-muted-foreground">
            {" "}
            +{project.members.length - VISIBLE_MEMBERS} more
          </span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground tabular-nums">
        {project.updateCount} {project.updateCount === 1 ? "update" : "updates"}
      </TableCell>
      <TableCell className={project.completed ? "text-success" : "text-muted-foreground"}>
        <span className="inline-flex items-center gap-1.5">
          {project.completed ? (
            <CircleCheck className="h-4 w-4" />
          ) : (
            <CircleDashed className="h-4 w-4" />
          )}
          {project.completed ? "Completed" : "Ongoing"}
        </span>
      </TableCell>
      <TableCell className="text-right">
        {isAdmin && (
          <span className="flex items-center justify-end gap-1">
            <Button
              aria-label={`Edit ${project.name}`}
              onClick={() => setEditing(true)}
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              aria-label={`Delete ${project.name}`}
              onClick={() => setConfirming(true)}
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </span>
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
      </TableCell>
    </TableRow>
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
          <h1 className="text-3xl tracking-tight">Projects</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Everything the community is building, and how often it gets talked about.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreating(true)} variant="default" className="ml-auto">
            <FolderPlus className="h-4 w-4" />
            New Project
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            setPage(1);
          }}
          placeholder="Search projects by name…"
          className="pr-9 pl-9"
        />
        {searchInput && (
          <button
            aria-label="Clear search"
            onClick={() => {
              setSearchInput("");
              setPage(1);
            }}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/*
        A real table: below sm it scrolls horizontally with its header intact,
        where the old twin-grid layout collapsed to one column and left every
        cell unlabelled.
      */}
      <Card className="gap-0 overflow-hidden py-0">
        <Table className="min-w-[46rem]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[28%] pl-4">Name</TableHead>
              <TableHead className="w-32">Category</TableHead>
              <TableHead className="w-[24%]">Members</TableHead>
              <TableHead className="w-28">Updates</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="w-16 pr-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {result === undefined ? (
              Array.from({ length: 4 }).map((_, i) => <ProjectRowSkeleton key={i} />)
            ) : result.data.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="p-4">
                  <EmptyState
                    message={
                      debouncedSearch
                        ? `No projects match “${debouncedSearch}”.`
                        : "No projects yet."
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              result.data.map((project) => <ProjectRow key={project._id} project={project} />)
            )}
          </TableBody>
        </Table>
      </Card>

      {/* `result.page` is the clamped page the server actually served. */}
      {result && (
        <Pagination page={result.page} totalPages={result.totalPages} onPageChange={setPage} />
      )}

      <ProjectFormModal open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
