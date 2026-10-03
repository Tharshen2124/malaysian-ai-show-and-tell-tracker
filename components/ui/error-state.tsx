import { CloudOff } from "lucide-react";

/**
 * Dashboard states, in shadcn's idiom. The Malaysian AI originals live in
 * error-state-legacy.tsx and are still what app/join renders.
 */
export function ErrorState({
  message = "Something went wrong loading this view.",
}: {
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-14 text-center">
      <CloudOff className="size-8 text-muted-foreground" />
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function InlineErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {message}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
