"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAccess } from "@/lib/use-access";
import { MemberForm } from "@/components/forms/member-form";
import { ErrorState } from "@/components/ui/error-state";
import { BackLink } from "@/components/ui/back-link";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MemberEditPage({ params }: PageProps<"/members/[id]/edit">) {
  const { id } = use(params);
  const router = useRouter();
  const { isLoading, isAdmin } = useAccess();
  const member = useQuery(api.members.get, isAdmin ? { id: id as Id<"members"> } : "skip");

  // Admin-only route: bounce non-admins back to the detail page.
  useEffect(() => {
    if (!isLoading && !isAdmin) router.replace(`/members/${id}`);
  }, [isLoading, isAdmin, router, id]);

  if (!isAdmin) return null;
  if (member === null) {
    return <ErrorState message="This member does not exist (they may have been deleted)." />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackLink href={`/members/${id}`}>Back to member</BackLink>
      <h1 className="text-3xl tracking-tight">Edit member</h1>
      {member === undefined ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Card className="p-6">
          <MemberForm
            initial={{
              id: member._id,
              name: member.name,
              email: member.email,
              isActive: member.isActive,
              registerDate: member.registerDate,
              accessLevel: member.accessLevel ?? "none",
            }}
            onSaved={() => router.push(`/members/${id}`)}
            onCancel={() => router.push(`/members/${id}`)}
          />
        </Card>
      )}
    </div>
  );
}
