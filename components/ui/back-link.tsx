import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "./button";

/**
 * The "back to the list" link above every detail page. Was the same class string
 * copied into four routes; asChild lets a Link wear the button recipe, which is
 * what shadcn's Slot is for.
 */
export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-3 text-muted-foreground">
      <Link href={href}>
        <ArrowLeft />
        {children}
      </Link>
    </Button>
  );
}
