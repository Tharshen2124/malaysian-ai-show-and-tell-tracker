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
import { Card } from "@/components/ui/card";
import { DetailPageSkeleton } from "@/components/ui/skeletons";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MeetupFormModal } from "@/components/forms/meetup-form-modal";
import { UpdateAdminActions } from "@/components/cards/update-admin-actions";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";

export default function MeetupDetailPage({ params }: PageProps<"/meetups/[id]">) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const isAdmin = useIsAdmin();
  const meetup = useQuery(api.meetups.get, { id: id as Id<"meetups"> });
  const removeMeetup = useMutation(api.meetups.remove);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (meetup === null) {
    return <ErrorState message="This meetup does not exist (it may have been deleted)." />;
  }

  return (
    <div className="space-y-8">
      <BackLink href="/meetups">All meetups</BackLink>

      {meetup === undefined ? (
        <DetailPageSkeleton />
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl tracking-tight">Meetup #{meetup.number}</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                {formatDate(meetup.date)} · {meetup.updateCount}{" "}
                {meetup.updateCount === 1 ? "update" : "updates"}
              </p>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <Button onClick={() => setEditing(true)} variant="outline">
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
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

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">Updates</h2>
            {meetup.updates.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No updates were recorded at this meetup.
              </p>
            )}
            {meetup.updates.map((u) => (
              <Card key={u._id} className="gap-0 p-4 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm">
                    <Link
                      href={`/members/${u.memberId}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {u.memberName}
                    </Link>
                    <span className="text-muted-foreground"> · </span>
                    <span className="text-muted-foreground">{u.projectName}</span>
                  </p>
                  {isAdmin && (
                    <UpdateAdminActions
                      update={{
                        id: u._id,
                        memberId: u.memberId,
                        projectId: u.projectId,
                        meetupId: meetup._id,
                        description: u.description,
                      }}
                    />
                  )}
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">{u.description}</p>
              </Card>
            ))}
          </section>

          <MeetupFormModal
            open={editing}
            onClose={() => setEditing(false)}
            initial={{
              id: meetup._id,
              number: meetup.number,
              date: meetup.date,
            }}
          />
          <ConfirmDialog
            open={confirmingDelete}
            onClose={() => setConfirmingDelete(false)}
            title="Delete meetup"
            description={`Deleting this meetup will also delete its ${meetup.updateCount} ${
              meetup.updateCount === 1 ? "update" : "updates"
            }. This cannot be undone.`}
            onConfirm={async () => {
              try {
                await removeMeetup({ id: meetup._id });
                toast.success("Successfully deleted meetup!");
                router.push("/meetups");
              } catch {
                toast.error("Error occurred, meetup was not deleted.");
              }
            }}
          />
        </>
      )}
    </div>
  );
}
