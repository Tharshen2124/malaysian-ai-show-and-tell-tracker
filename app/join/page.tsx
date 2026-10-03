"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { InlineErrorBanner } from "@/components/ui/error-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/field";
import { Wordmark } from "@/components/ui/wordmark";

/** Keep in step with `CODE_LENGTH` in `convex/present.ts`. */
const CODE_LENGTH = 6;

/**
 * Forgiving about how the code was typed — case, spaces and a stray dash all
 * fall away. What survives is letters and digits only, which is also what
 * makes it safe to hand to the router.
 */
function cleanCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, CODE_LENGTH);
}

/** For whoever is too far from the screen to scan: type the code, then carry on
 *  to the same sign-up form the QR leads to. Public, like `/join/[code]`. */
export default function JoinByCodePage() {
  const router = useRouter();
  const convex = useConvex();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (code.length !== CODE_LENGTH) {
      setError(`The code is ${CODE_LENGTH} characters — check the screen.`);
      return;
    }
    setPending(true);
    try {
      // Checked here rather than on the next page, so a typo leaves them on this
      // box to fix it instead of on an error screen.
      const session = await convex.query(api.present.sessionByCode, { code });
      if (!session) {
        setError("No session matches that code. Check the screen and try again.");
        setPending(false);
        return;
      }
      // Left pending on purpose: the button stays busy until the next page lands.
      router.push(`/join/${code}`);
    } catch {
      setError("Could not check that code. Try again.");
      setPending(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        <Wordmark />
        <h1 className="mt-5 text-[2rem]">Who presents first?</h1>
        <p className="mt-2 text-[0.9375rem] text-muted-foreground">
          Enter the code shown on the screen to add your name to the list.
        </p>
      </div>

      <Card className="gap-0 p-5 sm:p-6">
        <form onSubmit={submit} className="grid gap-4">
          {error && <InlineErrorBanner message={error} />}
          <Field label="Session code">
            <Input
              value={code}
              onChange={(e) => setCode(cleanCode(e.target.value))}
              autoFocus
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              maxLength={CODE_LENGTH + 4}
              placeholder="HX4K9P"
              className="h-14 text-center text-2xl font-bold tracking-[0.3em] tabular-nums md:text-2xl"
            />
          </Field>
          <SubmitButton pending={pending} className="h-12 w-full text-base">
            Continue
          </SubmitButton>
        </form>
      </Card>
    </main>
  );
}
