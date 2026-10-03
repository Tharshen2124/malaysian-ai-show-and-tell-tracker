import { Badge } from "./badge";

/** platform-design.md's status pair: Active is success on its tint, Inactive the quiet default. */
export function StatusPill({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant="secondary" className={isActive ? "bg-success-soft text-success" : undefined}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}
