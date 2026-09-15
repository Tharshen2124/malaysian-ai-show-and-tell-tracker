# Malaysian AI Design System

> Reverse-engineered from `https://www.malaysian.ai/` (Astro v7.2.2). All CSS ships inline in five `<style>` blocks (~57 KB) — there are no linked stylesheets. Every value below is traceable to a CSS declaration, a CSS custom property, a computed style, or a 1440×900 / 390×900 headless-Chrome screenshot of light **and** dark mode.

## 1. Visual Theme & Atmosphere

Malaysian AI reads like a printed field guide to a city at night. It is the front door of a Kuala Lumpur AI community — events, builder groups, a startup residency — and the page carries the warmth of a community noticeboard rather than the chrome of a SaaS product. The tone is confident and unhurried: an editorial serif at near-`0.9` line-height, a single full-bleed illustration of the KL skyline, and enormous stretches of quiet.

The dominant design language is **framed editorial minimalism with a dual-personality theme**. A full-viewport image sits inset by `--hero-gap` (`1rem` desktop, `0.6rem` mobile) inside a `1.5px` hairline frame; the header, nav pill and CTA are not laid *on* the image, they are *cut out of it* — solid `--page-background` panels with inward `border-bottom-right-radius: .95rem` corners that make the frame look notched. Depth comes almost entirely from that hairline and from transform, not from shadow. Light mode is warm parchment (`#f4efe6`) with pine-green ink (`#102b2a`); dark mode is near-black ocean navy (`#06090f`) with pale blue-white text (`#e0e8f4`). Both are authored in one pass with CSS `light-dark()`.

Typography does the heavy lifting: Instrument Serif for every heading, Atkinson Hyperlegible (an accessibility-first face) for all body copy, and Mondwest — a pixel serif — for one single element, the wordmark floating in the hero sky. That one deliberate glitch of pixel type is the brand's signature wink.

### Key Characteristics

- Full-bleed hero image inset by a `1.5px` hairline frame, with nav/brand/CTA panels **notched into** the frame via inward `.95rem` corner radii
- Two fully-authored themes expressed as `light-dark()` pairs on a single `:root` — warm cream/pine vs. ink-navy/pale-blue
- Instrument Serif headings at `line-height: .88–.91` and `letter-spacing: -.035em`, set so tight the lines nearly touch
- Atkinson Hyperlegible as the body face — legibility chosen as a brand value, not a default
- Mondwest pixel serif used exactly once, for the `.sky-wordmark` hovering over the skyline
- Near-zero shadows on structural surfaces; borders and `translateY(-2px)` carry hierarchy instead
- Uppercase `.7rem` section kickers at `letter-spacing: .16em` label every chapter
- A `14vw` (up to `224px`) ghost wordmark anchors the footer at ~10% opacity
- Interaction is stacked and physical: fanned event cards, a 3D community carousel, a deck of testimonial cards that peels off the top

## 2. Color Palette & Roles

The palette is a **duotone system with no semantic set**. Every surface and text token is declared once in `:root` as `light-dark(<light>, <dark>)`, so the two themes share structure and differ only in value. Light mode is warm and paper-like (cream, clay, deep pine); dark mode is cool and nocturnal (ink navy, cornflower hairlines, pale-blue text). A single hard-coded blue, `#315d9f`, is the only color that does *not* change between themes.

### Surfaces

| Hex | Role | Where seen |
| --- | --- | --- |
| `#f4efe6` / `#06090f` | Page background | `--page-background`; `<meta name="theme-color">`; sampled at pixel `(3,890)` in both themes |
| `#efe8d8` / `#07101a` | Site background (outer shell, footer) | `--site-background`; `body`, `.immersive`, `.site-footer` |
| `#e7dfd0` / `#0a1422` | Recessed surface | `--surface-background`; `.event-card-image-wrap` |
| `#fffaf2` / `#0b1422` | Card background | `--card-background`; active `.theme-toggle button` |
| `#fffaf2` / `#0a111c` | Raised card | `--card-raised`; `.voice-card`, mobile `.community-room`, mobile nav sheet |
| `#e7dfd0` / `#121a29` | Image placeholder | `--image-background`; `.hero-media` before art loads |
| `#e9edf3` | Logo plate (theme-independent) | `.community-portrait`, `.resident-face` — `radial-gradient(circle at 50% 40%, #ffffffe6, #0000 62%), #e9edf3` |

### Text

| Hex | Role | Where seen |
| --- | --- | --- |
| `#102b2a` / `#e0e8f4` | Body text | `--page-text`; `:root` color |
| `#0c2221` / `#f4f7fc` | Heading | `--text-heading` |
| `#102b2a` / `#f2f5fa` | Bright text | `--text-bright`; `--footer-text` |
| `#2c5c59` / `#a9c7ef` | Accent text | `--text-accent`; `.section-kicker`, `.residency-kicker`, `.voices-kicker`, `.voice-card strong` |
| `#1d4f5c` / `#b7c9e2` | Link | `--text-link` |
| `#4d6664` / `#8da7ca` | Muted | `--text-muted`; `--footer-label`, `.events-selected p` |
| `#102b2ab8` / `#e0e8f4b8` | Soft body (72%) | `--text-soft`; `.community-lede`, `.residency-lede` |
| `#102b2a94` / `#e0e8f48c` | Softer (58% / 55%) | `--text-softer` |
| `#102b2a73` / `#e0e8f480` | Faint (45% / 50%) | `--text-faint`; `--footer-meta` |
| `#102b2adb` / `#eef4fcd1` | Long-form story copy | `--story-copy` |
| `#102b2a` / `#dce9fb` | Emphatic link | `--link-bright` |
| `#fff` | Pure white | `--color-white`; `.event-card` text, `--quote-text` (dark) |

### Hero (over-image text)

| Hex | Role | Where seen |
| --- | --- | --- |
| `#102b2a` / `#fffdf6` | Hero copy | `--hero-copy` |
| `#102b2acc` / `#ffffffe6` | Hero muted | `--hero-muted`; `.intro`, `.card-secondary` |
| `#102b2a` / `#ffd29a` | Hero focus ring (amber in dark) | `--hero-focus` |
| `#fffdf8` | Pixel sky wordmark | `.sky-wordmark` color |

### Accent & Borders

| Hex | Role | Where seen |
| --- | --- | --- |
| `#315d9f` | Fixed brand blue — never theme-swapped | `--accent-line`, `--hero-accent` |
| `#8a9e9b` / `#7398cf` | Border | `--border-color`, `--page-border`, `--hero-line` |
| `#102b2a29` / `#7398cf8c` | Hairline | `--hairline`; `.voice-card`, `.luma-frame`, mobile nav |
| `#102b2a1f` / `#7398cf52` | Soft hairline | `--hairline-soft`; `.theme-toggle` |
| `#97b8e7` (`d1`, `a8`, `6b`, `59`) | Events-chapter stroke & card border | `.events-outline-line`, `.event-card` border, focus rings |
| `#aeccf2` (`f2`, `4d`) | Active/hover event-card border + glow ring | `.event-card:hover`, `.event-card.is-active` |
| `#12233d` | Resident wordmark ink + border | `.resident-wordmark` |
| `#0d1622` | Community card text | `.community-card` color |

### Buttons

| Hex | Role | Where seen |
| --- | --- | --- |
| `#102b2a` / `#fff` | Button fill | `--button-background` |
| `#1a3d3b` / `#edf0f4` | Button hover fill | `--button-hover-background` |
| `#f4efe6` / `#101820` | Button label | `--button-text` |

### Footer

| Hex | Role | Where seen |
| --- | --- | --- |
| `#102b2ab8` / `#e0e8f49e` | Footer body copy | `--footer-copy` |
| `#102b2ad1` / `#e0e8f4b3` | Footer link | `--footer-link` |
| `#102b2a73` / `#e0e8f461` | Footer meta / © line | `--footer-meta` |
| `#102b2a1a` / `#9bbbe72e` | Giant ghost wordmark (~10% / 18%) | `--footer-wordmark-color` |

### Alternate page theme

Interior pages (`/about`, `/blog`) add `html.neutral-page`, which overrides the warm palette with a neutral one: `--site-background` and `--page-background` become `light-dark(#f3f0ea, #090909)`, `--page-text` `light-dark(#111, #fff)`, `--card-background` `light-dark(#fff, #111)`, `--page-border` `light-dark(#11111129, #ffffff29)`.

### Notes

There are **no** success / warning / error / info tokens anywhere in the stylesheet — the site never renders validation state, so no semantic ramp exists. (The colored pills visible in the events panel — pink "Hangout", green "Co-working", amber "Demo / Showcase" — come from an embedded lu.ma iframe and are not Malaysian AI tokens.) Accent color is used only for uppercase kickers, `<strong>` inside testimonial quotes, and link emphasis; it never appears as a fill. CTA fills invert with the theme — near-black on cream in light, pure white on navy in dark — so the primary button is always maximum contrast. Theme preference persists in `localStorage['malaysianai-theme']` as `system` \| `light` \| `dark`, and an inline head script stamps `data-theme` on `<html>` before first paint.

## 3. Typography Rules

Three self-hosted families, all `woff2` from `/_astro/fonts/` with `font-display: swap` and preloaded in `<head>`: **Display — Instrument Serif** (400 only, `--font-display`), **Body — Atkinson Hyperlegible** (400 + 700, `--font-body`), **Pixel — Mondwest** (400, `--font-pixel`). Each has a metric-matched local fallback declared via `@font-face` with `size-adjust` / `ascent-override` (Instrument Serif → Times New Roman at `size-adjust: 83.9385%`; Atkinson → Arial at `99.3717%`; Mondwest → Times New Roman at `97.9567%`), so swap causes no reflow. `font-synthesis: none` on `:root` forbids faux bold/italic. The only monospace is a system stack (`ui-monospace, SFMono-Regular, monospace`) used on one component.

### Hierarchy

| Role | Font | Size | Weight | Line height | Letter spacing |
| --- | --- | --- | --- | --- | --- |
| Display (`.about-statement h2`) | Instrument Serif | `clamp(2.65rem, 4.6vw, 5rem)` → 42.4–80px | 400 | 0.91 | -0.045em |
| H1 hero (`.hero-card h1`) | Instrument Serif | `clamp(2.55rem, 3.1vw, 3.45rem)` → 40.8–55.2px (44.64px @1440) | 400 | 0.88 | -0.035em |
| H2 events (`.events-header h2`) | Instrument Serif | `clamp(2.25rem, 3.45vw, 3.8rem)` | 400 | 0.88 | -0.035em |
| H2 section (`.residency-heading h2`, `.voices-heading h2`) | Instrument Serif | `clamp(2.3rem, 3.8vw, 3.6rem)` | 400 | 0.9 | -0.035em |
| H2 communities (`.community-copy h2`) | Instrument Serif | `clamp(2.2rem, 3.6vw, 3.4rem)` | 400 | 0.9 | -0.035em |
| H3 (`.events-selected h3`) | Instrument Serif | `clamp(1.35rem, 1.9vw, 2rem)` | 400 | — | -0.035em |
| Pixel wordmark (`.sky-wordmark`) | Mondwest | `clamp(1.35rem, 1.8vw, 1.7rem)` | 400 | 1 | normal |
| Lede (`.community-lede`, `.residency-lede`, `.voice-card blockquote p`) | Atkinson | `clamp(.92rem, 1.25vw, 1.08rem)` | 400 | 1.6 (`--leading-body`) | normal |
| Body (`--text-base`) | Atkinson | 1rem / 16px | 400 | 1.6 | normal |
| Hero intro (`.intro`) | Atkinson | `clamp(.86rem, 1vw, .94rem)` → 13.76–15.04px | 400 | 1.42 | normal |
| Button / nav (`.site-button`, `.hero-nav a`) | Atkinson | 0.82rem / 13.12px | 400 | 1.2 | normal |
| Small (`.card-secondary`) | Atkinson | 0.86rem | 400 | — | normal |
| Meta (`.resident-name`, `.voice-context`, `.footer-company span`) | Atkinson | 0.76rem | 400 | — | normal |
| Kicker (`.section-kicker`, `.residency-kicker`, `.voices-kicker`) | Atkinson | 0.7rem, uppercase | 400 | 1.4 | 0.16em |
| Footer group label | Atkinson | 0.78rem, uppercase | 400 | — | 0.08em |
| Theme toggle | Atkinson | 0.72rem | 400 | 1.2 | 0.02em |
| Footer wordmark (`.footer-wordmark`) | Atkinson | `clamp(6rem, 14vw, 14rem)` → 96–224px (201.6px @1440) | 400 | 0.72 | -0.06em |
| Mono (`.resident-wordmark`) | `ui-monospace, SFMono-Regular` | `clamp(.72rem, .9vw, .85rem)`, uppercase | 700 | 1 | 0.06em |

### Principles

- **Every heading is Instrument Serif at weight 400.** The face ships in one weight; emphasis comes from size and tightness, never from bolding.
- **Display sizes run below single line-height** (0.88–0.91) with `-0.035em` to `-0.045em` tracking, so multi-line headings read as a solid typographic block.
- `text-wrap: balance` on all section headings, `text-wrap: pretty` on the display statement — no orphaned words.
- **Body copy locks to `--leading-body: 1.6`** and measure caps of `24rem` / `30rem` / `36rem` / `38rem` / `40rem` depending on the block; the widest heading measure is `64rem`.
- **Uppercase is reserved for labels**, always at `.66–.78rem` with wide positive tracking (`.08em`–`.16em`) — the inverse of the headings' negative tracking.
- The only two `--text-*` size tokens declared in `:root` (`--text-page-title`, `--text-section-title`) are held for interior pages; the homepage sets `clamp()` per component instead.

## 4. Component Stylings

### Buttons

`.site-button` is the single button primitive — every CTA on the page is this class plus a modifier.

```css
.site-button {
  display: inline-flex; align-items: center; justify-content: center;
  gap: .55rem;
  min-height: 2.25rem;
  padding: .35rem .85rem;
  border: 0;
  border-radius: var(--button-radius);      /* .45rem → 7.2px */
  background: var(--button-background);     /* #102b2a light / #fff dark */
  color: var(--button-text);                /* #f4efe6 light / #101820 dark */
  font: 400 .82rem/1.2 var(--font-body);
  white-space: nowrap;
  transition: background .18s, transform .18s;
}
.site-button:hover,
.site-button:focus-visible { background: var(--button-hover-background); } /* #1a3d3b / #edf0f4 */
.site-button:focus-visible { outline: 2px solid var(--focus-color); outline-offset: 3px; }
```

- **Primary** — the base class, a solid inverted fill. Used for "View upcoming events", "Find an event", "Explore the residency", "See the event calendar", the footer "View events".
- **Lift variants** — `.card-link`, `.footer-cta`, `.residency-cta` add `transform: translateY(-2px)` on hover/focus; `.events-calendar-link` uses `-1px`.
- **Secondary / ghost** — `.card-secondary`, `.community-actions a:not(.site-button)`: no fill, no border, inherited or `--hero-muted` color, underlined with `text-underline-offset: .22em`, `font-size: .86rem`. ("Explore communities", "Add your community", "Meet the residents ↗".)
- **Outline** — `.residency-directory` hovers to `border-color: var(--link-bright); color: var(--link-bright)`.
- Mobile (`≤700px`): `min-height: 2rem; padding: .3rem .6rem; font-size: .68rem`.

### Cards

| Card | Surface | Border | Radius | Shadow |
| --- | --- | --- | --- | --- |
| `.hero-card` | `var(--hero-frame)` = `--page-background` | none; a `::after` draws `1.5px` top+right hairline | `0 1rem 0 0` (top-right only; `0 .85rem 0 0` ≤700px) | `none` |
| `.voice-card` | `var(--card-raised)` | `1.5px solid var(--hairline)` | `.95rem` | none |
| `.event-card` | `#06090fd1` | `1px solid #97b8e76b` | `.6rem` | `0 16px 40px #00000073, 0 0 0 1px #aeccf24d` when active |
| `.community-card` | transparent (art plate inside) | none | `var(--radius-media)` = `.7rem` | `0 8px 18px #0003` |
| `.luma-frame` | `var(--page-background)` | `1px solid var(--hairline)` | `1rem`, inner iframe `.75rem` | none |
| `.residency-frame` | `var(--page-background)` | `1.5px solid var(--hairline)` | `.95rem .95rem 0` | none |
| `.community-room` (mobile only) | `var(--card-raised)` | `1.5px solid var(--hairline)` | `.95rem` | none |

`.hero-card` padding is `2.1rem 3rem 2rem` (→ `1.5rem 2rem 1.4rem` ≤700px); `.voice-card` uses `clamp(1.35rem, 2vw, 1.75rem)` with `min-height: 13rem` (`15rem` on mobile).

### Inputs

The homepage renders **no form inputs** — the only interactive controls are buttons, links, a `<details>` disclosure and a radio-style toggle group. Input styling is therefore not part of this system; when adding one, inherit `--card-background`, `1.5px solid var(--hairline)`, `border-radius: var(--button-radius)`, and the shared `outline: 2px solid var(--focus-color); outline-offset: 3px` focus treatment.

### Navigation

Desktop header is an absolutely-positioned assembly that **cuts panels out of the hero frame** rather than sitting on top of it:

- `.hero-header` — `position: absolute; top/left: 0`, `width: var(--hero-panel-width, 29rem)`, `height: var(--hero-brand-width, 7.2rem)`, `pointer-events: none` (children re-enable).
- `.brand-panel` — a `7.2rem` square of `--page-background` in the top-left corner with `border-bottom-right-radius: .95rem`, holding the black-and-white batik `.brand-mark` logo at `5.2rem`.
- `.hero-nav` — a pill of `--button-background` at `top/right: var(--hero-gap)`, `left: var(--hero-brand-width)`, `height: 2.25rem`, `border-radius: var(--button-radius)`, `padding: .35rem .85rem`, `justify-content: space-between`. Links are `.82rem/1.2`, undecorated; `:hover` and `[aria-current=page]` add `text-decoration: underline; text-underline-offset: .3rem`.
- `.hero-cta-panel` — mirrored top-right panel with `border-bottom-left-radius: .95rem` carrying the "Find an event" button.
- The joins between panels are drawn by `::before` / `::after` pseudo-elements with `1.5px solid var(--hero-line)` and matching `.95rem` corner radii — this is what produces the continuous notched outline in the screenshots.
- `.is-minimal` on the header or CTA panel hides all four connector pseudo-elements for interior pages.

**Mobile collapse (`≤700px`):** `.hero-nav { display: none }` and `.mobile-navigation` (a native `<details>`) appears at `left: var(--hero-brand-width, 4.4rem)`. Its `<summary>` is a `.site-button` reading "Menu ⌄"; `[open] summary span { transform: rotate(180deg) }` at `.15s`. The panel is `width: min(18rem, calc(100vw - var(--hero-brand-width) - 2rem))`, `border: 1px solid var(--hairline)`, `background: var(--card-raised)`, `border-radius: .7rem`, `padding: .5rem`, `top: calc(100% + 1rem)`, with `box-shadow: 0 .75rem 1.75rem #00000057`. Header metrics shrink to `--hero-gap: .55–.6rem`, `--hero-control-height: 2rem`, `--hero-brand-width: 4.4rem`, logo `3.2rem`.

### Image Treatment

- Global reset: `img { max-width: 100%; height: auto }`.
- **Hero art** — `.hero-media` is `position: absolute; inset: var(--hero-gap)`, `border: 1.5px solid var(--hero-line)`, `border-radius: .95rem`, `overflow: hidden`, with `background: var(--image-background)` as the pre-load plate. Inside, `.hero-art` is `object-fit: cover; object-position: center` (`61.8% 38.2%` on mobile — a golden-ratio crop toward the towers). On mobile the frame drops its bottom and left borders and becomes `border-radius: .75rem .75rem 0 0`, so the image reads as flowing into the copy card below.
- **Hero scrim** — `.hero-shade` is a two-layer gradient: `linear-gradient(#0a0d161f, #0a0d1608 35%, #090a0e99 100%), linear-gradient(90deg, #04091447, #0000 55%)` — darkening down and to the left, exactly where the headline sits.
- **Logo plates** — `.community-portrait` and `.resident-face` share `radial-gradient(circle at 50% 40%, #ffffffe6, #0000 62%), #e9edf3` with `border-radius: var(--radius-media)`; the logo is `object-fit: contain` at 76% (86% for `.is-wide`, 64% mobile). A `#e9edf357` veil sits over unfocused cards and fades with `--focus`.
- **Partner logos** — `.host-mark img` uses `filter: grayscale() invert() brightness(1.4)` in dark mode, reset to `filter: none` under `html[data-theme=light]`, so monochrome partner marks work on both grounds.
- **Aspect ratios in play:** `.event-card` `.78`, `.community-card` `1.08`, `.resident-face` `1.35` (`1.2` ≤700px).

### Distinctive

1. **Notched hero chrome.** The brand square, nav pill and CTA panel are opaque page-colored cut-outs with inward `.95rem` corners, stitched together by `1.5px` hairline pseudo-elements. Nothing floats — the frame appears physically die-cut.
2. **Fanned event deck.** Five `.event-card`s share a `transform-origin: 50% 100%` and are positioned by a `--event-slot` custom property: `translateX(calc(-50% + var(--event-slot) * min(8.4vw, 8.4rem))) translateY(calc(var(--event-distance) * .45rem + var(--preview-lift))) rotate(calc(var(--event-slot) * 1.5deg)) scale(calc(var(--preview-scale) - var(--event-distance) * .035))`. Resting cards sit at `opacity: .66` with `filter: saturate(72%) brightness(.78)` on the image; the hovered/active card sets `--preview-lift: -.75rem; --preview-scale: 1.08`, full opacity, `border-color: #aeccf2f2`, and its image un-scales from `1.04` to `1` over `.9s cubic-bezier(.2,.75,.2,1)`. Entry is staggered 60ms → 260ms per nth-child.
3. **SVG chapter outline.** `.events-outline` is an inline SVG at `inset: 0` with `stroke: #97b8e7d1; stroke-width: 1px; vector-effect: non-scaling-stroke` plus an `.events-outline-matte` fill of `--page-background` — the frame around the events photo is drawn as vector geometry, not borders. Below `800px` it is replaced by a simple `border: 1px solid #97b8e7d1; border-radius: .75rem; inset: .6rem` pseudo-element.
4. **3D community carousel.** `.community-card` uses `transform-style: preserve-3d`, `width: clamp(128px, 13vw, 188px)`, and a `--focus` variable that drives both a deeper `::before` shadow (`0 24px 46px #0000006b`) and the veil opacity. Below `700px` the whole carousel is hidden and replaced by `.community-room` rows: a `6.5rem | 1fr` grid with the logo plate on the left.
5. **Peeling testimonial deck.** `.voice-card`s stack in one grid cell (`grid-area: 1/1`) and are positioned by `data-pos`: `0` → `opacity 1, transform none`; `1` → `.5, translateY(-1.1rem) scale(.955)`; `2` → `.25, translateY(-2.15rem) scale(.912)`; `3` → `0, translateY(-3rem) scale(.88)`. Tapping sends the top card to `.is-leaving` → `opacity 0; translateY(2.4rem) rotate(1.8deg)`. Non-top cards get `visibility: hidden` on their text so only one quote is ever readable.
6. **Ghost footer wordmark.** "Malaysian AI" set in Atkinson at `clamp(6rem, 14vw, 14rem)`, `line-height: .72`, `letter-spacing: -.06em`, `white-space: nowrap`, `user-select: none`, colored `--footer-wordmark-color` (10% ink / 18% blue). At `≤620px` it wraps (`white-space: normal`) and drops to `clamp(5rem, 23vw, 8rem)` at `line-height: .76`.
7. **Segmented theme toggle.** `.theme-toggle` is a `1px solid var(--hairline-soft)` shell at `border-radius: var(--button-radius)` with `padding: .12rem`; its three buttons (System / Light / Dark) are `min-height: 1.7rem`, `.72rem/1.2`, `letter-spacing: .02em`, `border-radius: calc(var(--button-radius) - .08rem)`, and the selected one (`[aria-checked=true]`) fills with `var(--card-background)`.
8. **Embedded calendar frame.** `.luma-frame` wraps a third-party lu.ma iframe in `1px solid var(--hairline)`, `border-radius: 1rem`, `padding: .35rem`, `height: min(56dvh, 32rem)`, with `content-visibility: auto; contain-intrinsic-size: 720px` so it never blocks first paint.

## 5. Layout Principles

### Spacing Scale

`rem`-based, on a loose **0.05rem-quantised ramp** rather than a strict 4/8px grid. Values actually declared, in rem:

`.12 · .2 · .25 · .35 · .4 · .45 · .55 · .6 · .65 · .7 · .75 · .8 · .85 · .9 · .95 · 1 · 1.1 · 1.25 · 1.35 · 1.5 · 1.75 · 2 · 2.5 · 3 · 3.5 · 4 · 5 · 6 · 7`

Micro-spacing (`.12–.55rem`) is for control interiors and icon gaps; `.65–1rem` for card padding and frame insets; `1.5–2rem` for stack rhythm; `3rem+` for chapter separation. Section padding is almost always fluid rather than fixed — e.g. `clamp(4rem, 7vw, 6rem) clamp(1.5rem, 4vw, 4rem)` on chapters, `clamp(4rem, 7vw, 6.5rem) clamp(1.25rem, 4vw, 4rem) clamp(2.5rem, 5vw, 4rem)` on the footer, `clamp(2rem, 4vw, 3.5rem) clamp(1.5rem, 3.5vw, 3.25rem)` on framed panels. Mobile collapses chapters to a flat `.65rem` gutter so framed sections nearly bleed to the edge.

### Grid

There is no global container: `main` is `max-width: none; padding: 0` and each chapter owns its own shell.

- **Footer** — `.footer-grid` is `grid-template-columns: minmax(16rem, 1.7fr) repeat(2, minmax(8rem, .72fr)) minmax(9rem, .8fr)`, `gap: clamp(2.5rem, 6vw, 7rem)`, `width: min(92rem, 100%); margin: 0 auto`. The `.footer-wordmark` shares that `min(92rem, 100%)` measure.
- **Residency** — `.residency-frame` is `width: min(72rem, 100%); margin: 0 auto`.
- **Events** — `.events-frame` is `min-height: 100dvh`, full-bleed, with `.events-header` absolutely placed at `top: clamp(3rem, 6vw, 5.5rem); left: clamp(4rem, 6.5vw, 6rem)` and capped at `max-width: min(30rem, 44vw)`.
- **Hero** — `.hero-shell` is `min-height: max(42rem, 100svh)`; the copy card is `--hero-panel-width: 29rem` desktop (`32rem` at wider steps), `calc(100% - var(--hero-gap))` on mobile.
- **Text measures** — `24rem`, `30rem`, `31rem`, `36rem`, `38rem`, `40rem`, `64rem` caps depending on the block.

### Whitespace

Density is deliberately low and asymmetric. The hero devotes roughly two-thirds of the viewport to image with a single copy card pinned to the bottom-left corner; chapters routinely run `100svh`/`100dvh` tall with one heading, one lede and one CTA row. Whitespace is not decoration here — it is the pacing device that turns the page into a sequence of full-screen chapters, each introduced by a small uppercase kicker and a very large serif line.

### Radius Scale

| Name | Value | Use |
| --- | --- | --- |
| `xs` | `.4rem` | `.4rem` event-card image well |
| `button` | `var(--button-radius)` = `.45rem` (7.2px) | buttons, nav pill, theme toggle (inner: `calc(var(--button-radius) - .08rem)`) |
| `sm` | `.6rem` | `.event-card` |
| `media` | `var(--radius-media)` = `.7rem` | community/resident logo plates, mobile nav sheet |
| `md` | `.75rem` | inner iframe, mobile hero frame (`.75rem .75rem 0 0`) |
| `panel` | `.95rem` | hero frame + every notched corner, `.voice-card`, `.residency-frame` |
| `lg` | `1rem`–`1.15rem` | `.hero-card` top-right corner, `.luma-frame` |
| `pill` | `50%` | avatar circle in testimonial cards |
| `tag` | `.9rem .9rem .9rem .2rem` | `.resident-wordmark` (one deliberately squared corner) |

Directional radii are a system feature, not an exception: `0 1rem 0 0`, `.95rem .95rem 0 0`, `0 0 .95rem .95rem`, `0 .85rem 0 0` all appear, because panels are meant to read as pieces cut from a larger frame.

## 6. Depth & Elevation

### Levels

| Level | Use | Shadow |
| --- | --- | --- |
| 0 | Structural surfaces — hero card, framed chapters, footer | `none` (explicitly `box-shadow: none` on `.hero-card`) |
| 1 | Resting carousel cards | `0 8px 18px #0003` — `.community-card` |
| 2 | Floating menus | `0 .75rem 1.75rem #00000057` — mobile nav sheet |
| 3 | Active / hovered event card | `0 1rem 2.5rem #00000085, 0 0 0 1px #aeccf24d` |
| 3b | Deep hover on event card | `0 1.8rem 5rem #0000008c` |
| 4 | Focused carousel card | `0 24px 48px #0000007a, 0 0 0 3px #97b8e759` |
| 4b | Carousel focus bloom (`::before`) | `0 24px 46px #0000006b` |
| — | Chip outline | `0 0 0 1px #ffffff1f, 0 4px 12px #0000003d` |
| — | Ambient drop | `0 20px 55px #00000038`, `0 24px 46px #0000006b` |

Text shadows carry their own small scale, used only over imagery: `0 2px 24px var(--hero-title-shadow-color)` and `0 .15rem 1.75rem` for headings, `0 1px 14px var(--hero-copy-shadow-color)` and `0 .1rem .8rem` for copy — both transparent (`#0000`) in light mode and `#020c0d59` / `#020c0d80` in dark. The pixel wordmark gets a glow instead: `0 0 7px #ffffff6b, 0 3px 20px #0d204db3`.

### Philosophy

Elevation is earned, not assumed. Every structural surface is flat and separated by a `1.5px` hairline in `--border-color`/`--hairline`; shadows appear only on things that are *lifted by interaction* — a card you hover, a carousel item in focus, a menu you opened. Because the dark theme's ground is near-black, shadows there are pushed very large and soft (`24px`/`5rem` blurs at 50–85% black) and are usually paired with a `0 0 0 1px` light ring in `#aeccf2`/`#97b8e7` so the lifted edge stays visible against the dark. In light mode the same components rely on the hairline alone.

## 7. Interaction & Motion

### Hover States

- **Buttons** — swap `--button-background` → `--button-hover-background` over `.18s`; lift variants add `translateY(-2px)` (`-1px` for the events calendar link) on the same `.18s` curve.
- **Nav links** — `text-decoration: underline; text-underline-offset: .3rem`. No color change.
- **Footer links** — color shifts to `--text-hover` (`#0c2221` light / `#fff` dark).
- **Event cards** — `--preview-lift: -.75rem`, `--preview-scale: 1.08`, `opacity: .66 → 1`, `border-color → #aeccf2f2`, shadow to level 3, and the inner image de-zooms `scale(1.04) → scale(1)` while its `saturate(72%) brightness(.78)` filter is dropped.
- **Resident tiles** — `.resident-face { transform: translateY(-3px) }` over `.2s`.
- **Outline links** — `.residency-directory` swaps border and text to `--link-bright`.

### Focus States

Visible focus is implemented everywhere, never suppressed. The default is `outline: 2px solid var(--focus-color); outline-offset: 3px` on `a` and `.site-button`; `--focus-color` is `light-dark(#102b2a, #97b8e7)`. Larger components use `outline-offset: 4px` (`.event-card`, `.resident-tile`, `.community-actions a`, `.about-summary > a`, host links) or `6px` (`.voices-deck`, which also rounds the ring to `.95rem`). Over the hero image the ring switches to `--hero-focus` (`#ffd29a`, warm amber) at `outline-offset: 4px` so it survives against photography. `.community-card:focus-visible` uses a `0 0 0 3px #97b8e759` ring instead of an outline because the card is 3D-transformed. The one `outline: none` — `.community-stage:focus-visible` — is a scroll container whose children each carry their own ring.

### Transitions

| Duration | Easing | Properties | Where |
| --- | --- | --- | --- |
| `.15s` | default | `transform` | mobile menu chevron rotate |
| `.18s` | default | `background`, `transform` (+`gap` on one) | `.site-button`, `.card-link`, `.footer-cta` |
| `.18s` | default | `color`, `border-color` | link and outline-button states |
| `.2s` | default | `transform` / `opacity` | `.resident-face`, `.voice-card` under reduced motion |
| `.3s` | default | `box-shadow`, `border-color` | `.event-card` |
| `.42s` / `.48s` | `cubic-bezier(.3,.8,.3,1)` | `opacity`, `transform` | `.voice-card` deck shuffle |
| `.5s` / `.76s` | `cubic-bezier(.2,.8,.2,1)` | `opacity`, `transform` | event-card entrance |
| `.65s` | `cubic-bezier(.2,.75,.2,1)` | `opacity`, `transform` | `.events-header` reveal |
| `.9s` | `cubic-bezier(.2,.75,.2,1)` | `transform` (+`filter .4s`) | `.event-card-image` de-zoom |
| `6s` | default | `transform` (with `opacity .7s`) | slow ambient drift |

Entrance is orchestrated by named keyframe animations on a delay ladder rather than by scroll position alone: `media-reveal` `1.2s cubic-bezier(.2,.75,.2,1) 50ms`, `hero-settle` `1.8s cubic-bezier(.2,.72,.2,1) 50ms`, `panel-arrive` `.8s ease-out .35s`, then `soft-rise` on the headline at `.7s ease-out .7s`, the intro at `.85s`, the primary CTA at `1s` and the secondary link at `1.05s`. Chapters gate their own reveals on an `.is-in-view` class (IntersectionObserver), with per-card `transition-delay` of 60ms → 260ms.

**Reduced motion is handled properly.** Six `@media (prefers-reduced-motion: reduce)` blocks: `html { scroll-behavior: auto }`; all Astro view transitions clamped to `1ms` / `animation: none !important`; every hero entrance animation set to `none`; event-card transitions cut to `1ms` with `opacity: 1` forced so content is never left invisible; the residency marquee's `animation: none` with `overflow-x: auto` and its duplicate `[aria-hidden=true]` track hidden; `will-change` released on the carousel.

## 8. Responsive Behavior

### Breakpoints

All queries are **max-width**, written in modern range syntax (`@media (width<=700px)`) — a desktop-first system with one dominant phone breakpoint.

| Name | Max width | Primary changes |
| --- | --- | --- |
| `lg` | 900px | Footer grid → 3 columns, `.footer-company` spans `2/-1`; mission section drops to a single column, max `38rem`, `height: auto`; lu.ma frame → `min(62dvh, 32rem)` |
| `md` | 860px | `.voices-shell` → 1 column, `gap: 2rem`; `.about-statement` and `.host-row` → 1 column; display heading drops to `clamp(2.5rem, 8.2vw, 4rem)` |
| `sm+` | 800px | Events chapter reflows: SVG outline hidden for a simple inset border, `.events-selected` becomes a right-aligned rail at `inset: auto 1.5rem 12rem auto` with a `1px` right border, header moves to `top: 2rem; left: 1.5rem`, deck height `8.5rem`, card width `clamp(4.75rem, 19vw, 6rem)` with `20vw` slot spacing |
| `sm` | 700px | **The main phone breakpoint** — nav collapses, chapters flatten, most headings re-clamp to `vw` units |
| `xs` | 620px | Footer grid → 2 columns (`gap: 3rem 1.5rem`), intro and company span full width; footer wordmark wraps at `clamp(5rem, 23vw, 8rem)` / `line-height: .76` |

### Touch Targets

`.site-button` guarantees `min-height: 2.25rem` (36px) desktop and `2rem` (32px) at `≤700px`; `--hero-control-height` drops `2.25rem → 2rem` on the same breakpoint, and `.theme-toggle` buttons are `1.7rem` (27px) tall. These sit below the 44px WCAG 2.5.5 AAA target — a genuine gap worth closing if you adapt this system. Nav links inside the mobile `<details>` sheet get `.5rem` sheet padding with `.25rem` row gaps. Focus and hover targets are otherwise generous: cards are `≥128px` wide and the tap area of a `.voice-card` is the whole `15rem`-tall surface.

### Collapsing Strategy

At `≤700px` the frame system rescales through custom properties rather than being rewritten: `--hero-gap` `1rem → .6rem` (`.55rem` on the interior header), `--hero-brand-width` `7.2rem → 4.4rem`, `--hero-control-height` `2.25rem → 2rem`, `--hero-panel-width` → `calc(100% - var(--hero-gap))`, logo `5.2rem → 3.2rem`. `.hero-nav` is replaced by the `<details>` menu; `.hero-cta-panel` sheds its background and connector so only the button remains. The hero card goes full-width with `border-radius: 0 .85rem 0 0` and its headline re-clamps to `clamp(2.15rem, 10vw, 2.75rem)` at `line-height: .86`. Chapters lose their `min-height: 100svh` (`min-height: auto`) and shrink to a `.65rem` gutter. The 3D community carousel and its focus panel are hidden outright (`display: none`) in favour of a stacked `.community-grid` of `1fr` rows; the residency marquee becomes a centered grid of `clamp(7.25rem, 34vw, 8.75rem)` tiles. Section headings switch from `vw`-of-viewport clamps to `9.5vw`–`13vw` clamps so type stays large relative to the phone.

### Image Behavior

`img { max-width: 100%; height: auto }` globally. Full-bleed photography uses `object-fit: cover` with art-directed `object-position` (`center` desktop, `61.8% 38.2%` mobile for the hero). Logos and portraits use `object-fit: contain` at a percentage width inside a gradient plate, so wordmarks of different proportions ("is-wide" vs "is-square") stay optically balanced. The hero `<img>` is served as `webp` (`malaysian-ai-kl-hero-restored-1920.webp`, 1920×1080, also the OG image) and every image well sets an explicit `background` so there is no flash of empty box. `.resident-face` shifts aspect ratio `1.35 → 1.2` on mobile to keep tiles from getting too letterboxed.

## 9. Agent Prompt Guide

### Quick Color Reference

```text
/* Light theme */
#f4efe6  // page background (warm parchment)
#efe8d8  // site background / footer
#fffaf2  // card surface
#102b2a  // body text (deep pine)
#2c5c59  // accent text / kickers
#8a9e9b  // border
#102b2a  // button fill  (text: #f4efe6)

/* Dark theme */
#06090f  // page background (ink navy-black)
#07101a  // site background / footer
#0b1422  // card surface
#e0e8f4  // body text (pale blue-white)
#a9c7ef  // accent text / kickers
#7398cf  // border
#ffffff  // button fill  (text: #101820)

/* Shared */
#315d9f  // fixed brand blue — never theme-swapped
#97b8e7  // events-chapter stroke / focus ring (dark)
#ffd29a  // hero focus ring (dark, over imagery)
#e9edf3  // logo plate ground
```

### Example Prompts

**1 — Full system**
> Build a landing page in the Malaysian AI style: dual theme authored with CSS `light-dark()` on a single `:root` — light is `#f4efe6` background with `#102b2a` text, dark is `#06090f` with `#e0e8f4`. Headings in Instrument Serif 400 at `line-height: .88` and `letter-spacing: -.035em`, sized `clamp(2.3rem, 3.8vw, 3.6rem)`. Body in Atkinson Hyperlegible at `line-height: 1.6`. Section labels uppercase `.7rem` at `letter-spacing: .16em` in `light-dark(#2c5c59, #a9c7ef)`. One button primitive: `min-height: 2.25rem`, `padding: .35rem .85rem`, `border-radius: .45rem`, fill `light-dark(#102b2a, #fff)`, `transition: background .18s, transform .18s`. No shadows on structural surfaces — separate everything with `1.5px solid light-dark(#8a9e9b, #7398cf)` hairlines.

**2 — The notched hero**
> Create a full-viewport hero where a cover image sits `position: absolute; inset: 1rem` inside a `1.5px` hairline frame with `border-radius: .95rem`. Cut three opaque panels out of the frame's edge, all filled with the page background: a `7.2rem` square logo panel top-left with `border-bottom-right-radius: .95rem`, a nav pill top-center (`height: 2.25rem`, `border-radius: .45rem`, background `#102b2a`, links at `.82rem/1.2`), and a CTA panel top-right with `border-bottom-left-radius: .95rem`. Stitch the panels to the frame with `::before`/`::after` pseudo-elements carrying `1.5px` borders and matching `.95rem` corners. Pin a copy card to the bottom-left at `width: 29rem`, `border-radius: 0 1rem 0 0`, `padding: 2.1rem 3rem 2rem`, with an Instrument Serif `clamp(2.55rem, 3.1vw, 3.45rem)` headline at `line-height: .88`. Overlay the image with `linear-gradient(#0a0d161f, #0a0d1608 35%, #090a0e99 100%), linear-gradient(90deg, #04091447, #0000 55%)`.

**3 — The event deck**
> Build a fanned card deck of five `aspect-ratio: .78` cards, each `width: clamp(5.75rem, 7.4vw, 7.5rem)`, `background: #06090fd1`, `border: 1px solid #97b8e76b`, `border-radius: .6rem`, `padding: .25rem`, `transform-origin: 50% 100%`. Position each by a `--event-slot` custom property: `translateX(calc(-50% + var(--event-slot) * min(8.4vw, 8.4rem))) rotate(calc(var(--event-slot) * 1.5deg))`. Resting cards are `opacity: .66` with their image at `filter: saturate(72%) brightness(.78)` and `transform: scale(1.04)`. On hover or `.is-active`, set `--preview-lift: -.75rem`, `--preview-scale: 1.08`, `opacity: 1`, `border-color: #aeccf2f2`, `box-shadow: 0 1rem 2.5rem #00000085, 0 0 0 1px #aeccf24d`, and de-zoom the image to `scale(1)` over `.9s cubic-bezier(.2,.75,.2,1)`. Stagger entrance `transition-delay` from 60ms to 260ms.

### Iteration Guide

- **Keep the two themes symmetric.** Every color belongs in the `light-dark(a, b)` pair on `:root` — never define a color only inside a `@media (prefers-color-scheme)` or `[data-theme]` block, or you will break the toggle in one direction. If you add a token, add both halves.
- **Change the accent by hue, not by saturation.** `#2c5c59` / `#a9c7ef` are ~25% and ~55% saturation. Rotating hue while holding saturation under ~60% keeps the muted, printed feel; a vivid accent will read as a different brand immediately.
- **Don't reach for shadows to add hierarchy.** The system separates surfaces with a `1.5px` hairline and reserves shadow for interaction only. If a new component looks flat, add a hairline and more whitespace before adding elevation. In dark mode, any shadow you do add needs a `0 0 0 1px` light ring to stay visible.
- **Headings must stay at weight 400.** Instrument Serif ships one weight and `font-synthesis: none` blocks faux-bolding. Increase size and tighten tracking (`-.035em` → `-.045em` as you go past ~4rem) instead of reaching for bold.
- **Respect the radius directionality.** Corners are asymmetric on purpose (`0 1rem 0 0`, `.95rem .95rem 0 0`) because panels are cut from a frame. A uniform radius on a panel will visually detach it from the frame it belongs to.
- **Preserve the reduced-motion contract.** Any new scroll-reveal must have a `@media (prefers-reduced-motion: reduce)` rule that forces `opacity: 1` — the existing code does this explicitly so content is never stranded invisible.
- **Fix the touch targets if you ship this.** Buttons are 32–36px tall; raising `min-height` to `2.75rem` (44px) on `≤700px` is the one change that improves the system without altering its look on desktop.
- **Use the pixel font once.** Mondwest appears on exactly one element. Adding a second usage dilutes the joke and the hierarchy — if you need a third voice, use the mono stack (`ui-monospace`) the resident tags already use.
