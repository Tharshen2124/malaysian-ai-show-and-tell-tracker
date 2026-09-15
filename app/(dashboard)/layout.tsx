"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccess } from "@/lib/use-access";
import { Navbar } from "@/components/nav/navbar";
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
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6">{children}</main>
      <footer className="border-t-[1.5px] border-hairline bg-site">
        <div className="mx-auto max-w-7xl px-4 py-5 text-[0.76rem] text-muted sm:px-6">
          <Attribution />
        </div>
      </footer>
      <TranscriptionQueueTray />
    </div>
  );
}
