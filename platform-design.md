# Malaysian AI Platform Design System

> Reverse-engineered from `https://platform.malaysian.ai/` (Vite SPA, one stylesheet: `/assets/index-lM1WrAsY.css`, ~141 KB, Lightning CSS output). Light and dark values come from the `--lightningcss-light` / `--lightningcss-dark` pairs on `:root, [data-palette=residency]`; the dark-mode signed-in views were checked against screenshots of Home, Application, Events and Knowledge. This is the **app** surface. The marketing site (`www.malaysian.ai`) is documented separately in `design.md`.

## 1. Visual Theme & Atmosphere

The platform is the members' side of Malaysian AI: a calm, native-feeling workspace for builders to keep a profile, apply to the residency, register for events and search Show & Tell recordings. It looks like a macOS app styled in the brand's forest-and-parchment colours.

The design language is **soft-surface app minimalism**. A sticky left sidebar on a slightly darker plane holds icon-led navigation. The content column sits on the page background, and cards are flat `--paper` panels with `16px` corners and no border in dark mode. The only colour accent is `--button`: deep pine (`#244e43`) in light mode and pale sage (`#c6dbba`) in dark. It fills primary buttons, active nav icons and selected filter chips. Everything else is ink at varying opacity.

Type is the system UI stack (SF Pro Display / SF Pro Text). A late `:root` override sets the marketing faces (Baskerville, Atkinson, Mondwest) aside here. Headings are heavy (`700`) with tight tracking (`-0.028em`), and labels drop the marketing site's uppercase kickers for sentence-case `600` eyebrows.

### Key Characteristics

- Fixed 248px sidebar (`--sidebar-bg`) that collapses to a 72px icon rail, with a 1px `ink 7%` hairline on its right edge
- One accent colour (`--button`) used for primary CTAs, the active nav icon and selected pills, never for body copy
- Flat `--paper` cards at `16px` radius; dark mode has no card shadow and relies on the surface step alone
- Selection and hover are translucent tints of the accent or ink (`--selection` = button 12%, `--hover` = ink 6%), not new colours
- System font stack, bold 700 headings at `-0.028em`, sentence-case 600 eyebrows
- Generous 10px control radius on buttons and inputs; pills (`999px`) for badges and chips
- Footer is one muted 0.72rem row: links on the left, "Kuala Lumpur, Malaysia" on the right

## 2. Color Palette & Roles

The palette is a **forest duotone with three swappable palettes** (`residency` default, `classic`, `graphite`) selected via `html[data-palette]`. The residency palette is documented here. Every token is a light/dark pair, and `html[data-theme]` or `prefers-color-scheme` picks the half.

### Surfaces

| Hex (light / dark) | Role | Where seen |
| --- | --- | --- |
| `#f4efe6` / `#080f14` | Page background | `--bg`; `body`, `<meta name="theme-color">` (light) |
| `#eee8db` / `#0b161a` | Sidebar plane | `--sidebar-bg`; `.app-sidebar` |
| `#fbf8f0` / `#101e1b` | Card / input fill | `--paper`; `.profile-group`, `.member-event-card`, `input`, `textarea` |
| `#e8e9df` / `#1b3129` | Tint (secondary fill, chips, notices) | `--tint`; `.button.secondary`, `.badge`, `.notice`, `.event-period-tabs` |

### Text

| Hex (light / dark) | Role | Where seen |
| --- | --- | --- |
| `#173b36` / `#e7eee8` | Ink (body + headings) | `--ink`; `:root color` |
| `#5d6d67` / `#a3b5ad` | Muted | `--muted`; `.lede`, `.eyebrow`, `.sidebar-nav a`, `.app-footer` |

### Accent

| Hex (light / dark) | Role | Where seen |
| --- | --- | --- |
| `#244e43` / `#c6dbba` | Primary action / accent | `--button`; `.button`, `.sidebar-nav a[aria-current] .sidebar-icon`, `.text-link`, `input:focus` border |
| `#fbf8f0` / `#10251b` | Text on accent | `--button-ink` |
| `color-mix(--button 12%, transparent)` | Selection | `--selection`; `.sidebar-pill`, `.badge.submitted`, active application rail |
| `color-mix(--ink 6%, transparent)` | Hover wash | `--hover`; `.sidebar-nav a:hover`, `.sidebar-head-button:hover` |

### Semantic

| Hex (light / dark) | Role | Where seen |
| --- | --- | --- |
| `#1f6f45` / `#8fd6a6` | Success | `--success`; `.badge.accepted` (on 15% tint), `.switch[aria-checked=true]` |
| `#83540e` / `#edc277` | Warning text | `--amber`; `.badge.discussion` |
| `#f1e4ca` / `#392b16` | Warning fill | `--amber-bg` |
| `#922f29` / `#f4a297` | Error text / danger button | `--red`; `.field-error`, `.button.danger` |
| `#f2dfd9` / `#351d1b` | Error fill | `--red-bg`; `.badge.rejected` |

### Borders

| Hex (light / dark) | Role | Where seen |
| --- | --- | --- |
| `#c3cbbf` / `#4a5f55` | Line (strong) | `--line`; `.button.secondary` border, `.combobox-chip` |
| `#e1dfd3` / `#22352d` | Soft line (default hairline) | `--soft-line`; `input`, `.dashboard-status-grid article`, `.app-topbar` |
| `color-mix(--ink 7%, transparent)` | Sidebar edge | `.app-sidebar` `border-right` |

### Notes

The accent appears only on things you can act on or that are currently selected. Status colours are always paired: a saturated text colour on its own `-bg` fill, never a solid saturated block. In dark mode the accent becomes the lightest colour on screen, so primary buttons read as pale sage with dark green text.

## 3. Typography Rules

Display: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`. Body: the same stack with `"SF Pro Text"`. These come from the final `:root` override. Atkinson, Newsreader and Mondwest are still declared with `@font-face` but are not used by the app shell. No mono face is used.

### Hierarchy

| Role | Font | Size | Weight | Line height | Letter spacing |
| --- | --- | --- | --- | --- | --- |
| Display (page H1) | SF Pro Display | `clamp(1.85rem, 2.4vw, 2.25rem)` (`--text-display`) | 700 | 1.1 | -0.028em |
| H2 (section / card title) | SF Pro Text | 1.25rem (`--text-heading`) | 600 | 1.22 | -0.018em |
| H3 | SF Pro Text | 1.0625rem (`--text-title`) | 600 | 1.22 | -0.01em |
| Body | SF Pro Text | 1rem | 400 | 1.5 | 0 |
| Lede | SF Pro Text | 1rem | 400 | 1.5 | 0 (muted) |
| Eyebrow / label | SF Pro Text | 0.8125rem | 600 | 1.5 | 0 (muted, sentence case) |
| Small / button | SF Pro Text | 0.9375rem | 500 | 1 | -0.005em |
| Caption / footer | SF Pro Text | 0.72rem | 400 | 1.5 | 0 |

### Principles

- One family throughout; hierarchy comes from weight (400 → 600 → 700) and size, not from a second face
- Negative tracking on everything 1rem and up; none on body or labels
- `h1 em` / `h2 em` render as normal-style muted text, which gives a two-tone title ("Welcome back, **Name.**")
- Labels and eyebrows are sentence case at 600. The marketing site's uppercase `.16em` kickers are explicitly reset (`text-transform: none; letter-spacing: 0`)
- Body copy is antialiased (`-webkit-font-smoothing: antialiased`)

## 4. Component Stylings

### Buttons

- **Primary**: `background: var(--button)`, `color: var(--button-ink)`, no border, `border-radius: 10px`, `min-height: 2.625rem` (42px), `padding: 0 1.125rem`, `font-size: .9375rem`, `font-weight: 500`. Hover is `color-mix(--button 82%, white)`. Active is `transform: scale(.97)`.
- **Secondary**: `background: var(--tint)`, `color: var(--ink)`, no border. Hover is `color-mix(--tint 86%, --ink)`.
- **Small**: `min-height: 2.125rem` (34px), `padding-inline: .875rem`, `font-size: .8125rem`.
- **Danger**: `background: var(--red)`, `color: var(--bg)`. Hover is red 82% mixed with white.
- **Text link**: `color: var(--button)`, `font-weight: 500`, no underline until hover (`text-underline-offset: 3px`).

### Cards

`background: var(--paper)`, `border-radius: 16px` (`--radius-card`), padding `18–24px`. Light mode uses `--shadow-card: 0 1px 2px #0000000a, 0 2px 14px #00000008`. Dark mode has no shadow; the `--paper` vs `--bg` step carries the edge. Card titles are H2 at 1.25rem/600, with the description in `--muted` underneath.

### Inputs

`background: var(--paper)`, `border: 1px solid var(--soft-line)`, `border-radius: 10px`, `min-height: 44px`, `padding: 12px 14px`, placeholder `--muted` at 75% opacity. Focus sets `border-color: var(--button)` with `box-shadow: 0 0 0 4px color-mix(--button 18%, transparent)` and no outline. Invalid state is a `--red` border plus a 1px red ring. Textareas are `min-height: 155px`, `line-height: 1.65`.

### Navigation

- **Desktop sidebar** (`.app-sidebar`): 248px, `--sidebar-bg`, sticky full height. The 60px head holds the brand lockup and a 32px collapse button. Groups have a 28px muted `.72rem/600` label ("Community"). Rows are 40px tall, `gap: 12px`, 20px icons, `.88rem` muted text, radius 8px. Hover is ink 6% with ink text. The active row has ink text at weight 600, the icon in `--button`, and a sliding `--selection` pill behind it. Settings is pinned to the bottom (`[data-end]`), then the account block (28px avatar, name `.82rem`, email `.7rem` muted).
- **Rail** (`.app-shell.rail`): 72px, labels fade out, and a tooltip (`--ink` background, `--bg` text, radius 8px) shows on hover.
- **Mobile (≤900px)**: a 64px sticky top bar (bg 86% with 14px blur, soft-line bottom border) with a menu button. The sidebar becomes a `min(320px, 86vw)` drawer over a `#08100e73` backdrop.

### Image Treatment

Event art is square (`aspect-ratio: 1`), `object-fit: cover`, radius 10px inside a card. On the dashboard preview cards the image is about 104px, placed flush left with 10px card padding.

### Distinctive

- **Segmented period tabs**: a `--tint` track with radius 9px and 2px padding. The selected segment is `--paper` with `0 1px 3px #0000001f`.
- **Filter chips**: `--tint` pills. The active chip is a solid `--button` fill with `--button-ink` text and a count suffix.
- **Status badges**: pill, `.75rem/600`, `4px 10px`, `--tint` background with `--muted` text by default. Semantic variants pair the colour with its `-bg` fill.
- **Notice**: a `--tint` block with radius 12px and no border, used for "Applications are closed".

## 5. Layout Principles

### Spacing Scale

`--space-1..8`: `0.5, 0.75, 1, 1.5, 2, 3, 4, 5rem` (8, 12, 16, 24, 32, 48, 64, 80px). Component internals use literal px on a 2px grid: `2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24px`.

### Grid

The app is a two-column CSS grid: `grid-template-columns: var(--sidebar-w) minmax(0, 1fr)`. The content column has a `--page-gutter` of `clamp(1.25rem, 3.5vw, 3.5rem)`. Content maxes out at 1440px (footer) with about 1120–1240px per page (`.st-page` 1120px, `.admin-luma-page` 1240px). The dashboard status grid is `repeat(2, minmax(0,1fr))` with an 18px gap.

### Whitespace

Comfortable and app-like. Page heroes get `clamp(24px, 3.2vw, 40px)` of top padding and `clamp(22px, 2.6vw, 32px)` below. Sections are separated by about 40–72px. Cards are dense inside (18–24px) but spaced generously apart.

### Radius Scale

`sm 7–8px` (nav rows, tab segments, icon buttons), `md 10px` (`--radius`: buttons, inputs, images), `lg 12px` (notices, popovers), `xl 16px` (`--radius-card`), `pill 999px` (badges, chips).

## 6. Depth & Elevation

### Levels

| Level | Use | Shadow |
| --- | --- | --- |
| 0 | Page, sidebar, dark-mode cards | none |
| 1 | Light-mode resting cards | `0 1px 2px #0000000a, 0 2px 14px #00000008` (`--shadow-card`) |
| 1b | Selected tab segment | `0 1px 3px #0000001f` |
| 2 | Popovers / combobox menus | `0 12px 40px color-mix(in srgb, var(--ink) 16%, transparent)` |
| 3 | Mobile drawer, tooltips | `16px 0 48px #0003` / `0 6px 20px #0003` |

### Philosophy

Depth comes from surface steps (`--bg` → `--sidebar-bg` → `--paper` → `--tint`), not shadows. Light mode adds a barely visible card shadow. Dark mode removes it and relies on the step from `#080f14` to `#101e1b`. Only menus, the drawer and tooltips actually float.

## 7. Interaction & Motion

### Hover States

- Buttons lighten toward white (`--button` 82%) and press to `scale(.97)` on `:active`
- Nav rows get the `--hover` ink-6% wash, the text goes from muted to ink, and the icon scales to `1.08` (`0.92` on press)
- Text links underline on hover with a 3px offset
- Theme preview cards lift `translateY(-2px)`

### Focus States

- Inputs: accent border plus a 4px ring at 18% accent, no outline
- Nav rows and icon buttons: `outline: 2px solid var(--button)` with `outline-offset: -2px`
- Switches: `outline: 3px solid color-mix(--button 45%)`, offset 2px

### Transitions

- Colours: `.15s–.2s` default easing on `background`, `color`, `border-color`, `box-shadow`
- Sidebar width, pill and drawer: `.38s–.45s cubic-bezier(.22, 1, .36, 1)` (`--ease-out`)
- Drawer list items stagger in at `--i * 22ms + 80ms`
- `prefers-reduced-motion: reduce` disables all transitions and animations

## 8. Responsive Behavior

### Breakpoints

All queries are max-width (desktop-first).

| Name | Max width | Primary changes |
| --- | --- | --- |
| desktop | > 900px | Two-column shell with sticky sidebar |
| tablet | ≤ 900px | Shell becomes a single column, a sticky 64px top bar appears, the sidebar becomes an off-canvas drawer |
| narrow | ≤ 700px | Field grids collapse to one column; event cards shrink the image to 104px |
| phone | ≤ 600px | Settings choices tighten; profile list rows wrap |
| small phone | ≤ 560px / 400px | Remaining two-up layouts stack |

### Touch Targets

Inputs are `min-height: 44px`, nav rows 40px, the drawer close button 40px, primary buttons 42px.

### Collapsing Strategy

On desktop the sidebar can be collapsed by the user to a 72px rail with tooltips. At ≤900px it leaves the grid entirely and becomes a drawer opened from the top-bar menu button, with a translucent backdrop that closes it on tap.

### Image Behavior

`object-fit: cover` on fixed square boxes; images never stretch the card.

## 9. Agent Prompt Guide

### Quick Color Reference

```text
#080f14  // dark  bg (page)
#0b161a  // dark  sidebar
#101e1b  // dark  paper (cards, inputs)
#1b3129  // dark  tint (secondary buttons, chips)
#e7eee8  // dark  ink
#a3b5ad  // dark  muted
#c6dbba  // dark  accent / primary button (text #10251b)
#f4efe6  // light bg
#fbf8f0  // light paper
#173b36  // light ink
#244e43  // light accent / primary button (text #fbf8f0)
#22352d  // dark  soft line
```

### Example Prompts

1. "Build an app shell with a 248px sticky left sidebar (`#0b161a`) and content on `#080f14`. Nav rows are 40px, radius 8px, 20px lucide icons and `.88rem` text in `#a3b5ad`. The active row has `#e7eee8` text at 600 with a `#c6dbba` icon on a 12% `#c6dbba` pill."
2. "Make a dashboard card: `#101e1b` fill, no border, 16px radius, 24px padding, a 1.25rem/600 title in `#e7eee8`, a muted `#a3b5ad` description, and a 42px primary button with 10px radius (`#c6dbba` bg, `#10251b` text, weight 500)."
3. "Style form inputs at 44px tall with `#101e1b` fill, a 1px `#22352d` border and 10px radius. On focus, use a `#c6dbba` border and a 4px ring at 18% of it. Labels are `.86rem` and errors `#f4a297` at `.78rem`."

### Iteration Guide

- Add a new surface by stepping between `--bg` and `--tint`. Don't introduce a new hue.
- Keep the accent to actions and the current selection. If a passive element starts using `--button`, it will compete with the CTA.
- For status colour, always pair the text colour with its `-bg` fill (e.g. `#f4a297` on `#351d1b`). Avoid solid saturated blocks.
- To retheme, swap only the residency token block (as the `classic` and `graphite` palettes do). Structure, radii and type stay the same.
- In dark mode, convey hierarchy with surface steps instead of adding shadows.
- Keep headings in the system stack at 700 / -0.028em. Reintroducing the marketing serif here breaks the app-vs-site distinction.
