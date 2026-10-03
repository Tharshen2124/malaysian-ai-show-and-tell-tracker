/**
 * The attendee's side of a Show & Tell: public, phone-first, and in the same
 * platform look as the dashboard. data-ui="shadcn" is what scopes that palette
 * (see app/globals.css); anything that portals out of here re-declares it.
 */
export default function JoinLayout({ children }: LayoutProps<"/join">) {
  return (
    <div data-ui="shadcn" className="min-h-dvh bg-background text-foreground">
      {children}
    </div>
  );
}
