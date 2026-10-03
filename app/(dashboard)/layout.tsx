"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccess } from "@/lib/use-access";
import { Sidebar } from "@/components/nav/sidebar";
import { Attribution } from "@/components/ui/attribution";
import { TranscriptionQueueTray } from "@/components/ui/transcription-queue-tray";

export default function DashboardLayout({ children }: LayoutProps<"/">) {
  const router = useRouter();
  const { isLoading, hasAccess } = useAccess();

  // Covers both "not signed in" and "signed in without access"; the login page
  // decides which message to show.
  useEffect(() => {
    if (!isLoading && !hasAccess) router.replace("/login");
  }, [isLoading, hasAccess, router]);

  // Render nothing until access is known, so no page flashes before the redirect.
  if (isLoading || !hasAccess) return null;

  return (
    // data-ui="shadcn" is what scopes the platform palette to the dashboard; see
    // app/globals.css. Everything outside this subtree keeps the Malaysian AI
    // look, so anything that portals out of it has to carry the attribute too.
    <div data-ui="shadcn" className="min-h-dvh bg-background text-foreground shell:flex">
      <Sidebar />
      <div className="flex min-h-dvh min-w-0 flex-1 flex-col shell:min-h-0">
        <main className="mx-auto w-full max-w-6xl flex-1 px-[clamp(1.25rem,3.5vw,3.5rem)] pt-7 pb-12 shell:pt-10">
          {children}
        </main>
        <footer className="mx-auto flex w-full max-w-6xl flex-wrap gap-x-5 gap-y-2 px-[clamp(1.25rem,3.5vw,3.5rem)] pt-[18px] pb-[26px] text-[0.72rem] text-muted-foreground">
          <Attribution />
          <span className="shell:ml-auto">Kuala Lumpur, Malaysia</span>
        </footer>
      </div>
      <TranscriptionQueueTray />
    </div>
  );
}
