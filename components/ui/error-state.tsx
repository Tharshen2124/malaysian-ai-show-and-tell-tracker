import { CloudOff } from "lucide-react";

export function ErrorState({ message = "Something went wrong loading this view." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-panel border-[1.5px] border-dashed border-line px-6 py-14 text-center">
      <CloudOff className="h-8 w-8 text-faint" />
      <p className="max-w-sm text-sm text-muted">{message}</p>
    </div>
  );
}

export function InlineErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-button border border-danger-line bg-danger-soft px-3 py-2 text-sm text-danger">
      {message}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-panel border-[1.5px] border-dashed border-hairline px-6 py-12 text-center text-sm text-faint">
      {message}
    </div>
  );
}
