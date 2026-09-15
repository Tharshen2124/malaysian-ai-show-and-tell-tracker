"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ChevronDown, LogOut, ShieldCheck } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { useAccess } from "@/lib/use-access";
import { useToast } from "@/components/providers/toast-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Wordmark } from "@/components/ui/wordmark";
import { buttonClass } from "@/components/ui/button";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/members", label: "Members" },
  { href: "/meetups", label: "Meetups" },
  { href: "/projects", label: "Projects" },
];

/** Running the room is an admin job, so the link only shows for admins. */
const ADMIN_LINKS = [{ href: "/present", label: "Present" }];

function AdminBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`items-center gap-1.5 rounded-full border border-success-line px-2.5 py-1 text-[0.72rem] leading-none text-success ${className}`}
    >
      <ShieldCheck className="h-3.5 w-3.5" />
      Admin Mode
    </span>
  );
}

/**
 * design.md's interior ("is-minimal") header: the wordmark, a nav pill in the
 * inverted button fill with the current page underlined, and the controls on
 * the right. Below the phone breakpoint the pill collapses into a native
 * <details> "Menu" sheet.
 */
export function Navbar() {
  const pathname = usePathname();
  const { isAdmin } = useAccess();
  const { signOut } = useClerk();
  const toast = useToast();
  const menuRef = useRef<HTMLDetailsElement>(null);

  const links = isAdmin ? [...LINKS, ...ADMIN_LINKS] : LINKS;

  // A native <details> stays open until toggled, so close it on an outside tap.
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const menu = menuRef.current;
      if (menu?.open && !menu.contains(e.target as Node)) menu.open = false;
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const closeMenu = () => {
    if (menuRef.current) menuRef.current.open = false;
  };

  const handleLogout = async () => {
    toast.info("Logged out.");
    await signOut({ redirectUrl: "/login" });
  };

  return (
    <header className="sticky top-0 z-40 border-b-[1.5px] border-hairline bg-page">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link href="/dashboard" className="shrink-0" aria-label="Show&Tell dashboard">
          <Wordmark />
        </Link>

        <nav
          aria-label="Main"
          className="ml-4 hidden h-9 items-center gap-5 rounded-button bg-button px-[0.85rem] sm:flex"
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={pathname.startsWith(l.href) ? "page" : undefined}
              className="text-[0.82rem] leading-[1.2] text-on-button underline-offset-[0.3rem] hover:underline aria-[current=page]:underline"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {isAdmin && <AdminBadge className="hidden lg:inline-flex" />}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <button onClick={handleLogout} className={`${buttonClass("ghost")} hidden sm:inline-flex`}>
            <LogOut className="h-4 w-4" />
            Logout
          </button>

          <details ref={menuRef} className="group relative sm:hidden">
            <summary
              className={`${buttonClass("primary")} list-none [&::-webkit-details-marker]:hidden`}
            >
              Menu
              <ChevronDown className="h-4 w-4 transition-transform duration-150 group-open:rotate-180" />
            </summary>
            <div className="absolute top-[calc(100%+0.75rem)] right-0 w-[min(18rem,calc(100vw-2rem))] rounded-media border border-hairline bg-card-raised p-2 shadow-float">
              <nav aria-label="Main" className="flex flex-col gap-1">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={closeMenu}
                    aria-current={pathname.startsWith(l.href) ? "page" : undefined}
                    className="flex min-h-11 items-center rounded-button px-3 text-base text-muted hover:bg-recessed hover:text-ink aria-[current=page]:bg-recessed aria-[current=page]:text-ink"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-2 flex flex-col items-start gap-3 border-t border-hairline px-1 pt-3 pb-1">
                {isAdmin && <AdminBadge className="inline-flex" />}
                <ThemeToggle />
                <button onClick={handleLogout} className={`${buttonClass("outline")} w-full`}>
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
