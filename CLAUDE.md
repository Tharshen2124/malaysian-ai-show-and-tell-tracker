@AGENTS.md

## Design

- Two looks. `app/(dashboard)` and `app/join` use the platform look (`platform-design.md`, shadcn/ui in `components/ui/`). The landing page and `/login` keep the marketing look (`design.md`, `*-legacy` components like `button-legacy.ts`).
- The platform palette only applies under `data-ui="shadcn"` (set in the dashboard and join layouts; see `app/globals.css`). Portals render outside that wrapper, so anything portaled has to set `data-ui="shadcn"` again.
- Use the platform's status pairs (`text-danger` on `bg-danger-soft` with `border-danger-line`, and the same for warn/info) for errors and alerts. Write eyebrows in sentence case, not uppercase.

## Presentation clock

- The server stamps every clock instant. Clients read time through `lib/use-server-offset.ts` (measured against `present.serverTime`), not plain `Date.now()`, so phones match the projector.
- Durations are formatted as mm:ss via `lib/clock.ts`. Slot lengths are stored in **minutes** (they can be fractional), and the seconds limits there mirror `present.assertMinutes` on the server.
