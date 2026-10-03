"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { Pencil, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useIsAdmin } from "@/lib/use-access";
import { useToast } from "@/components/providers/toast-provider";
import { BackLink } from "@/components/ui/back-link";
import { DetailPageSkeleton } from "@/components/ui/skeletons";
import { StatusPill } from "@/components/ui/status-pill";
import { NullTextIndicator } from "@/components/ui/null-text-indicator";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Card } from "@/components/ui/card";
import { UpdateAdminActions } from "@/components/cards/update-admin-actions";
import { ErrorState } from "@/components/ui/error-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { PROJECT_CATEGORY_LABELS } from "@/lib/labels";
import { formatDate } from "@/lib/format";

export default function MemberDetailPage({ params }: PageProps<"/members/[id]">) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const isAdmin = useIsAdmin();
  const member = useQuery(api.members.get, { id: id as Id<"members"> });
  const removeMember = useMutation(api.members.remove);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (member === null) {
    return <ErrorState message="This member does not exist (they may have been deleted)." />;
  }

  return (
    <div className="space-y-8">
      <BackLink href="/members">All members</BackLink>

      {member === undefined ? (
        <DetailPageSkeleton />
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl tracking-tight">{member.name}</h1>
                <StatusPill isActive={member.isActive} />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{member.email}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Registered {formatDate(member.registerDate)}
              </p>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <Link
                  href={`/members/${member._id}/edit`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Link>
                <Button
                  onClick={() => setConfirmingDelete(true)}
                  variant="outline"
                  className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {[
              { label: "Projects", value: member.projectCount },
              { label: "Updates", value: member.totalUpdates },
              { label: "Active for", value: member.durationActive },
              {
                label: "Avg between talks",
                value: member.avgTimeBetweenTalks ?? <NullTextIndicator />,
              },
              { label: "Meetups since last talk", value: member.meetupsSinceLastTalk },
            ].map((metric) => (
              <Card key={metric.label} className="gap-0 p-4">
                <p className="text-xs text-muted-foreground">{metric.label}</p>
                <p className="mt-2 text-2xl leading-none font-semibold tracking-tight tabular-nums">
                  {metric.value}
                </p>
              </Card>
            ))}
          </div>

          {/* Projects with update history */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">Projects</h2>
            {member.projects.length === 0 && (
              <p className="text-sm text-muted-foreground">No projects yet.</p>
            )}
            {member.projects.map((project) => (
              <Card key={project._id} className="gap-0 p-5">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-base font-semibold">{project.name}</h3>
                  <span className="text-xs text-muted-foreground">
                    {PROJECT_CATEGORY_LABELS[project.category]}
                    {project.completed ? " · Completed" : ""} ·{" "}
                    {project.members.map((m) => m.name).join(", ")}
                  </span>
                </div>
                {project.updates.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    No talks recorded for this project.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3 border-t border-border pt-4">
                    {project.updates.map((u) => (
                      <li key={u._id} className="text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <p>
                            <Link
                              href={`/meetups/${u.meetupId}`}
                              className="underline-offset-4 hover:underline"
                            >
                              Meetup #{u.meetupNumber}
                            </Link>
                            <span className="text-muted-foreground">
                              {" "}
                              · {formatDate(u.meetupDate)} · by {u.memberName}
                            </span>
                          </p>
                          {isAdmin && (
                            <UpdateAdminActions
                              update={{
                                id: u._id,
                                memberId: u.memberId,
                                projectId: project._id,
                                meetupId: u.meetupId,
                                description: u.description,
                              }}
                            />
                          )}
                        </div>
                        <p className="mt-0.5 text-muted-foreground">{u.description}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            ))}
          </section>

          <ConfirmDialog
            open={confirmingDelete}
            onClose={() => setConfirmingDelete(false)}
            title="Delete member"
            description={`Deleting ${member.name} will also delete their ${member.totalUpdates} ${
              member.totalUpdates === 1 ? "update" : "updates"
            }. This cannot be undone.`}
            onConfirm={async () => {
              try {
                await removeMember({ id: member._id });
                toast.success("Successfully deleted member!");
                router.push("/members");
              } catch {
                toast.error("Error occurred, member was not deleted.");
              }
            }}
          />
        </>
      )}
    </div>
  );
}
