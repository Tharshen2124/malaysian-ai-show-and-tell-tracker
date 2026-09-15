"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SignInButton, useClerk } from "@clerk/nextjs";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, TriangleAlert } from "lucide-react";
import { useAccess } from "@/lib/use-access";
import { Wordmark } from "@/components/ui/wordmark";
import { buttonClass } from "@/components/ui/button";

const QUOTES = [
  "Every Thursday, someone ships something.",
  "Ideas become working demos.",
  "The ledger remembers every demo.",
];

function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.14 6.16-4.14Z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { isLoading, isSignedIn, hasAccess, member } = useAccess();
  const [slide, setSlide] = useState(0);

  // Someone with access never stays here.
  useEffect(() => {
    if (hasAccess) router.replace("/dashboard");
  }, [hasAccess, router]);

  // Rotating quotes, 5s interval.
  useEffect(() => {
    const interval = setInterval(() => setSlide((s) => (s + 1) % QUOTES.length), 5000);
    return () => clearInterval(interval);
  }, []);

  // Signed in with Google but not on the roster: the whole point of the allowlist.
  const deniedAccess = !isLoading && isSignedIn && !hasAccess;

  return (
    <div className="flex min-h-dvh bg-page p-[clamp(0.6rem,1.2vw,1rem)]">
      {/* Typographic panel, framed by a hairline — md+ only */}
      <div className="hidden w-1/2 flex-col justify-between rounded-panel border-[1.5px] border-hairline bg-site p-[clamp(2rem,4vw,3.5rem)] md:flex">
        <Wordmark />
        <AnimatePresence mode="wait">
          <motion.p
            key={slide}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: [0.2, 0.75, 0.2, 1] }}
            className="max-w-[30rem] text-[clamp(1.75rem,2.8vw,2.6rem)] leading-[1.15] tracking-[-0.01em] text-heading text-balance"
          >
            “{QUOTES[slide]}”
          </motion.p>
        </AnimatePresence>
        <p className="kicker">The Weekly Show &amp; Tell</p>
      </div>

      {/* Sign-in half */}
      <div className="flex w-full items-center justify-center px-6 md:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-10 md:hidden">
            <Wordmark />
          </div>
          <h1 className="page-title">Welcome back</h1>
          <p className="mt-3 text-sm text-soft">
            Sign in with the Google account you registered with.
          </p>

          {deniedAccess ? (
            <div className="mt-8 space-y-4">
              <div
                role="alert"
                className="flex items-start gap-3 rounded-media border border-danger-line bg-danger-soft p-4"
              >
                <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
                <div>
                  <p className="text-sm text-danger">You do not have access to this site</p>
                  <p className="mt-1 text-sm text-muted">
                    Ask an organiser to add{" "}
                    <span className="text-ink">{member?.email ?? "your account"}</span> before
                    signing in again.
                  </p>
                </div>
              </div>
              <button
                onClick={() => signOut({ redirectUrl: "/login" })}
                className={`${buttonClass("outline")} w-full`}
              >
                Sign in with a different account
              </button>
            </div>
          ) : (
            <div className="mt-8 space-y-3">
              <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                <button disabled={isLoading} className={`${buttonClass("outline")} w-full`}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleMark />}
                  Continue with Google
                </button>
              </SignInButton>
              <p className="text-center text-xs text-faint">
                Access is limited to registered community members.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
