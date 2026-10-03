import { CloudOff } from "lucide-react";

/**
 * Dashboard and attendee states, in shadcn's idiom. The Malaysian AI
 * originals live in error-state-legacy.tsx.
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
    <div
      role="alert"
      className="rounded-lg border border-danger-line bg-danger-soft px-3.5 py-2.5 text-sm text-danger"
    >
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
