"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AdminControlPanel } from "@/components/forms/admin-control-panel";
import { MemberCard } from "@/components/cards/member-card";
import { MeetupCard } from "@/components/cards/meetup-card";
import { CardGridSkeleton, StatSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/error-state";

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
        <h2 className="section-title">{title}</h2>
        <Link
          href={viewAllHref}
          className="text-[0.82rem] text-soft underline underline-offset-[0.22em] transition-colors hover:text-ink"
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
    <div className="flat-cards space-y-10">
      {/* The page opens on the admin actions; everything below it is reference. */}
      <AdminControlPanel />

      {/* Counts read as a plain figure strip — a card per number earned nothing. */}
      <div className="flex flex-wrap gap-x-10 gap-y-5 border-y border-hairline py-5">
        {stats
          ? stats.map((stat) => (
              <div key={stat.label}>
                <p className="kicker">{stat.label}</p>
                <p className="display-figure mt-1 text-[2rem] leading-none text-heading">
                  {stat.value}
                </p>
              </div>
            ))
          : Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}
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
