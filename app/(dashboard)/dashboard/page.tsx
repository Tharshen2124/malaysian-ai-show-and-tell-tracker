"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AdminControlPanel } from "@/components/forms/admin-control-panel";
import { MemberCard } from "@/components/cards/member-card";
import { MeetupCard } from "@/components/cards/meetup-card";
import { CardGridSkeleton, StatSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/error-state";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

/** Three across, so each section stays one row and the page ends above the fold. */
const CARD_GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3";

function Section({
  title,
  viewAllHref,
  children,
}: {
  title: string;
  viewAllHref: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <Link
          href={viewAllHref}
          className="text-sm text-muted-foreground underline underline-offset-[0.22em] transition-colors hover:text-foreground"
        >
          View All
        </Link>
      </div>
      {children}
    </section>
  );
}

export default function DashboardPage() {
  const summary = useQuery(api.dashboard.summary, {});

  const stats = summary
    ? [
        { label: "Members", value: summary.stats.memberCount },
        { label: "Meetups", value: summary.stats.meetupCount },
        { label: "Projects", value: summary.stats.projectCount },
        { label: "Updates", value: summary.stats.updateCount },
      ]
    : null;

  return (
    <div className="space-y-10">
      {/* The page opens on the admin actions; everything below it is reference. */}
      <AdminControlPanel />

      {/* The counts, as shadcn's stat-card row. */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats
          ? stats.map((stat) => (
              <Card key={stat.label} className="gap-2 py-4">
                <CardHeader className="px-4">
                  <CardDescription>{stat.label}</CardDescription>
                </CardHeader>
                <CardContent className="px-4">
                  <p className="text-2xl font-semibold tabular-nums tracking-tight">{stat.value}</p>
                </CardContent>
              </Card>
            ))
          : Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="gap-2 py-4">
                <CardHeader className="px-4">
                  <StatSkeleton />
                </CardHeader>
              </Card>
            ))}
      </div>

      <Section title="Meetups" viewAllHref="/meetups">
        {!summary ? (
          <CardGridSkeleton count={3} kind="meetup" className={CARD_GRID} />
        ) : summary.recentMeetups.length === 0 ? (
          <EmptyState message="No meetups recorded yet." />
        ) : (
          <div className={CARD_GRID}>
            {summary.recentMeetups.map((meetup) => (
              <MeetupCard key={meetup._id} meetup={meetup} />
            ))}
          </div>
        )}
      </Section>

      <Section title="Active Members" viewAllHref="/members">
        {!summary ? (
          <CardGridSkeleton count={3} kind="member" className={CARD_GRID} />
        ) : summary.activeMembers.length === 0 ? (
          <EmptyState message="No active members yet." />
        ) : (
          <div className={CARD_GRID}>
            {summary.activeMembers.map((member) => (
              <MemberCard key={member._id} member={member} />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
