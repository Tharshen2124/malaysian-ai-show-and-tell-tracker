"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useIsAdmin } from "@/lib/use-access";
import { useToast } from "@/components/providers/toast-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MeetupFormModal } from "@/components/forms/meetup-form-modal";
import { UpdateAdminActions } from "@/components/cards/update-admin-actions";
import { ErrorState } from "@/components/ui/error-state";
import { buttonClass } from "@/components/ui/button";
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
      <Link
        href="/meetups"
        className="inline-flex items-center gap-1.5 text-[0.82rem] text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        All meetups
      </Link>

      {meetup === undefined ? (
        <div className="space-y-4">
          <div className="h-10 w-64 animate-pulse rounded-[0.3rem] bg-recessed" />
          <div className="h-32 animate-pulse rounded-panel bg-recessed" />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="page-title">Meetup #{meetup.number}</h1>
              <p className="mt-3 text-sm text-muted">
                {formatDate(meetup.date)} · {meetup.updateCount}{" "}
                {meetup.updateCount === 1 ? "update" : "updates"}
              </p>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <button onClick={() => setEditing(true)} className={buttonClass("outline")}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => setConfirmingDelete(true)}
                  className={buttonClass("danger-outline")}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            )}
          </div>

          <section className="space-y-3">
            <h2 className="section-title">Updates</h2>
            {meetup.updates.length === 0 && (
              <p className="text-sm text-faint">No updates were recorded at this meetup.</p>
            )}
            {meetup.updates.map((u) => (
              <div key={u._id} className="card-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm">
                    <Link
                      href={`/members/${u.memberId}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {u.memberName}
                    </Link>
                    <span className="text-faint"> · </span>
                    <span className="text-muted">{u.projectName}</span>
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
                <p className="mt-1.5 text-sm text-soft">{u.description}</p>
              </div>
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
