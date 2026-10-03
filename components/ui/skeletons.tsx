import { Card } from "./card";
import { Skeleton } from "./skeleton";
import { TableCell, TableRow } from "./table";

/** Matches MemberCard's real dimensions. */
export function MemberCardSkeleton() {
  return (
    <Card className="gap-0 p-4">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="mt-4 space-y-2.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </Card>
  );
}

/** Matches MeetupCard. */
export function MeetupCardSkeleton() {
  return (
    <Card className="gap-0 p-4">
      <Skeleton className="h-6 w-28" />
      <div className="mt-3 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>
    </Card>
  );
}

/** A row of the projects table, so the placeholder keeps the real columns. */
export function ProjectRowSkeleton() {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell className="pl-4">
        <Skeleton className="h-5 w-40" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-16" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell className="pr-4" />
    </TableRow>
  );
}

/** The dashboard's flat figure strip — no card around the number. */
export function StatSkeleton() {
  return (
    <div>
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-2 h-7 w-12" />
    </div>
  );
}

/**
 * The header-plus-panel placeholder every detail route shows while its query
 * resolves. Was duplicated verbatim across the meetup, project and member
 * detail pages.
 */
export function DetailPageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

export function CardGridSkeleton({
  count,
  kind,
  className = "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4",
}: {
  count: number;
  kind: "member" | "meetup";
  /** Grid classes, so a caller laying cards out differently keeps them aligned. */
  className?: string;
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) =>
        kind === "member" ? <MemberCardSkeleton key={i} /> : <MeetupCardSkeleton key={i} />,
      )}
    </div>
  );
}
