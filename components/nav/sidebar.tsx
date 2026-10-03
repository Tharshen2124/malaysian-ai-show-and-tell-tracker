"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import { Dialog } from "radix-ui";
import { useClerk } from "@clerk/nextjs";
import {
  CalendarDays,
  FolderGit2,
  House,
  LogOut,
  type LucideIcon,
  Menu,
  Monitor,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Presentation,
  ShieldCheck,
  Sun,
  Users,
  X,
} from "lucide-react";
import { useAccess } from "@/lib/use-access";
import { useToast } from "@/components/providers/toast-provider";
import { type ThemePreference, useTheme } from "@/components/providers/theme-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Wordmark } from "@/components/ui/wordmark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon };
type NavGroup = { label?: string; items: NavItem[] };

const HOME: NavGroup = { items: [{ href: "/dashboard", label: "Dashboard", icon: House }] };

const COMMUNITY: NavGroup = {
  label: "Community",
  items: [
    { href: "/members", label: "Members", icon: Users },
    { href: "/meetups", label: "Meetups", icon: CalendarDays },
    { href: "/projects", label: "Projects", icon: FolderGit2 },
  ],
};

/** Running the room is an admin job, so the group only shows for admins. */
const ADMIN: NavGroup = {
  label: "Admin",
  items: [{ href: "/present", label: "Present", icon: Presentation }],
};

const COLLAPSED_STORAGE_KEY = "show-and-tell-sidebar";

const THEME_ICONS: Record<ThemePreference, LucideIcon> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};
const THEME_CYCLE: ThemePreference[] = ["system", "light", "dark"];

/** One sidebar row, shared by the nav links and the footer actions. */
const ROW =
  "group/row relative isolate flex h-10 w-full items-center gap-3 rounded-lg pr-1 pl-4 text-left text-[0.88rem] leading-none whitespace-nowrap text-muted-foreground transition-colors duration-200 hover:bg-hover hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary";

/** Labels fade out, rather than unmount, as the sidebar folds to its rail. */
const LABEL =
  "min-w-0 truncate transition-[opacity,translate] duration-200 group-data-[collapsed=true]/sidebar:pointer-events-none group-data-[collapsed=true]/sidebar:-translate-x-2 group-data-[collapsed=true]/sidebar:opacity-0";

const ICON =
  "size-5 shrink-0 transition-transform duration-300 ease-shell group-hover/row:scale-[1.08] group-active/row:scale-[0.92]";

function NavLink({
  item,
  active,
  collapsed,
  pillId,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  pillId: string;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      // The rail hides the label, so the name moves to a native tooltip.
      title={collapsed ? item.label : undefined}
      className={cn(ROW, "aria-[current=page]:font-semibold aria-[current=page]:text-foreground")}
    >
      {/* The selection pill slides between rows rather than jumping. */}
      {active && (
        <motion.span
          layoutId={pillId}
          aria-hidden
          className="absolute inset-0 -z-10 rounded-lg bg-selection"
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
      )}
      <Icon className={cn(ICON, active && "text-primary")} aria-hidden />
      <span className={LABEL}>{item.label}</span>
    </Link>
  );
}

function SidebarPanel({
  collapsed,
  variant,
  onToggle,
  onNavigate,
}: {
  collapsed: boolean;
  variant: "docked" | "drawer";
  onToggle?: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { isAdmin, member } = useAccess();
  const { signOut } = useClerk();
  const { preference, setPreference } = useTheme();
  const toast = useToast();

  const groups = isAdmin ? [HOME, COMMUNITY, ADMIN] : [HOME, COMMUNITY];
  const ThemeIcon = THEME_ICONS[preference];

  const handleLogout = async () => {
    toast.info("Logged out.");
    await signOut({ redirectUrl: "/login" });
  };

  const cycleTheme = () =>
    setPreference(THEME_CYCLE[(THEME_CYCLE.indexOf(preference) + 1) % THEME_CYCLE.length]);

  return (
    <div data-collapsed={collapsed} className="group/sidebar flex h-full min-w-0 flex-col">
      <div className="relative flex h-[60px] shrink-0 items-center justify-between pr-2.5 pl-[22px]">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          aria-label="Show&Tell dashboard"
          tabIndex={collapsed ? -1 : undefined}
          className="transition-opacity duration-200 group-data-[collapsed=true]/sidebar:pointer-events-none group-data-[collapsed=true]/sidebar:opacity-0"
        >
          <Wordmark />
        </Link>
        {variant === "docked" ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg transition-[right,background-color,color] duration-[380ms] ease-shell group-data-[collapsed=true]/sidebar:right-[19px]"
          >
            {collapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
          </Button>
        ) : (
          <Dialog.Close asChild>
            <Button variant="ghost" size="icon" aria-label="Close menu" className="text-foreground">
              <X className="size-5" />
            </Button>
          </Dialog.Close>
        )}
      </div>

      <nav aria-label="Main" className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-2.5 pt-0.5 pb-2.5">
        {groups.map((group, i) => (
          <div key={group.label ?? i} className="[&+&]:mt-1.5">
            {group.label && (
              <p className="relative flex h-7 items-center pl-4 text-[0.72rem] font-semibold whitespace-nowrap text-muted-foreground">
                <span className={LABEL}>{group.label}</span>
                {/* On the rail the heading becomes a short rule above its icons. */}
                <span
                  aria-hidden
                  className="absolute left-4 h-px w-5 bg-line opacity-0 transition-opacity duration-200 group-data-[collapsed=true]/sidebar:opacity-100"
                />
              </p>
            )}
            <ul className="grid gap-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <NavLink
                    item={item}
                    active={pathname.startsWith(item.href)}
                    collapsed={collapsed}
                    pillId={`${variant}-nav-pill`}
                    onNavigate={onNavigate}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="mt-auto grid gap-0.5 pt-3">
          {collapsed ? (
            <button type="button" onClick={cycleTheme} title={`Theme: ${preference}`} className={ROW}>
              <ThemeIcon className={ICON} aria-hidden />
              <span className="sr-only">Change colour theme (currently {preference})</span>
            </button>
          ) : (
            <div className="px-1 pb-1.5">
              <ThemeToggle className="w-full" />
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? "Log out" : undefined}
            className={ROW}
          >
            <LogOut className={ICON} aria-hidden />
            <span className={LABEL}>Log out</span>
          </button>
        </div>
      </nav>

      {member && (
        <div className="shrink-0 px-2.5 pt-2 pb-2.5">
          <Link
            href={`/members/${member.id}`}
            onClick={onNavigate}
            title={collapsed ? member.name : undefined}
            className="flex h-12 min-w-0 items-center gap-2.5 rounded-lg pr-0.5 pl-3 transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
          >
            <span
              aria-hidden
              className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-foreground"
            >
              {member.name.trim().charAt(0).toUpperCase() || "?"}
            </span>
            <span className={cn(LABEL, "grid gap-1 leading-tight")}>
              <span className="flex min-w-0 items-center gap-1.5">
                <strong className="truncate text-[0.82rem] font-semibold text-foreground">
                  {member.name}
                </strong>
                {isAdmin && (
                  <ShieldCheck className="size-3.5 shrink-0 text-success" aria-label="Admin" />
                )}
              </span>
              <small className="truncate text-[0.7rem] text-muted-foreground">{member.email}</small>
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}

/**
 * platform-design.md's app shell. Above the shell breakpoint a sticky 248px
 * sidebar that folds to a 72px icon rail (remembered per browser). Below it, a
 * blurred top bar whose menu button opens the same panel as a drawer.
 */
export function Sidebar() {
  const pathname = usePathname();
  // The drawer remembers the route it was opened on and counts as open only
  // while that is still the route, so any navigation (a link, or back/forward,
  // which never clicks one) closes it with no effect to sync.
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  const drawerOpen = drawerPath === pathname;
  // Only ever rendered client-side (the dashboard layout renders nothing until
  // access resolves), so reading storage in the initialiser cannot mismatch.
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSED_STORAGE_KEY) === "rail";
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setCollapsed((was) => {
      try {
        localStorage.setItem(COLLAPSED_STORAGE_KEY, was ? "full" : "rail");
      } catch {}
      return !was;
    });
  };

  return (
    <>
      <aside
        className={cn(
          "sticky top-0 z-30 hidden h-dvh shrink-0 overflow-hidden border-r border-sidebar-edge bg-sidebar transition-[width] duration-[380ms] ease-shell shell:block",
          collapsed ? "w-[72px]" : "w-[248px]",
        )}
      >
        <SidebarPanel collapsed={collapsed} variant="docked" onToggle={toggleCollapsed} />
      </aside>

      <Dialog.Root open={drawerOpen} onOpenChange={(open) => setDrawerPath(open ? pathname : null)}>
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/85 px-[clamp(1.25rem,3.5vw,3.5rem)] backdrop-blur-md shell:hidden">
          <Dialog.Trigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu" className="-ml-2.5 text-foreground">
              <Menu className="size-[22px]" />
            </Button>
          </Dialog.Trigger>
          <Link
            href="/dashboard"
            aria-label="Show&Tell dashboard"
            className="absolute left-1/2 -translate-x-1/2"
          >
            <Wordmark />
          </Link>
          <span className="size-10" aria-hidden />
        </header>

        <Dialog.Portal>
          {/* Portalled to <body>, outside the dashboard subtree, so it re-declares the scope. */}
          <div data-ui="shadcn">
            <Dialog.Overlay className="fixed inset-0 z-[65] bg-[#08100e73] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
            <Dialog.Content
              aria-describedby={undefined}
              className="fixed inset-y-0 left-0 z-[70] w-[min(320px,86vw)] bg-sidebar text-foreground shadow-[16px_0_48px_#0003] duration-300 ease-shell outline-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:animate-in data-[state=open]:slide-in-from-left"
            >
              <Dialog.Title className="sr-only">Menu</Dialog.Title>
              <SidebarPanel
                collapsed={false}
                variant="drawer"
                onNavigate={() => setDrawerPath(null)}
              />
            </Dialog.Content>
          </div>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
