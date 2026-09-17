function Bone({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-[0.3rem] bg-recessed ${className}`} />;
}

/** Matches MemberCard's real dimensions. */
export function MemberCardSkeleton() {
  return (
    <div className="card-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <Bone className="h-6 w-32" />
        <Bone className="h-5 w-20 rounded-full" />
      </div>
      <div className="mt-4 space-y-2.5">
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-5/6" />
        <Bone className="h-4 w-2/3" />
        <Bone className="h-4 w-5/6" />
        <Bone className="h-4 w-3/4" />
      </div>
    </div>
  );
}

/** Matches MeetupCard. */
export function MeetupCardSkeleton() {
  return (
    <div className="card-surface p-4">
      <Bone className="h-6 w-28" />
      <div className="mt-3 space-y-2">
        <Bone className="h-4 w-24" />
        <Bone className="h-4 w-32" />
      </div>
    </div>
  );
}

export function ProjectRowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-hairline px-4 py-3.5 last:border-b-0">
      <Bone className="h-5 w-40" />
      <Bone className="h-4 w-20" />
      <Bone className="ml-auto h-4 w-24" />
    </div>
  );
}

/** Matches the dashboard's flat figure strip — no card around the number. */
export function StatSkeleton() {
  return (
    <div>
      <Bone className="h-3 w-16" />
      <Bone className="mt-2 h-7 w-12" />
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
