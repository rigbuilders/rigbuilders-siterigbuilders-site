# Chatbot widget toggle & navbar responsiveness

This doc covers two things that are tightly coupled and easy to break
independently:

1. How to turn the **Rix AI chat widget** on/off site-wide without touching
   its code.
2. Why the **navbar's responsive layout depends on the chat widget's DOM
   structure**, and how to keep it working correctly in either state.

If you only read one section before making changes, read
["The container-query dependency"](#the-container-query-dependency) — this is
what broke (navbar stuck in mobile/tablet mode on desktop) the last time the
chat widget was disabled without accounting for it.

## Current state (as of this doc)

- Chat widget: **OFF**. `app/layout.tsx` renders a plain wrapper div instead
  of `<ChatWidget>`.
- Floating Build Now / Consult an Expert widgets: **ON**.
  `components/DesktopWidgets.tsx` has `WIDGETS_ENABLED = true`.

These two are meant to be inverses of each other — they both render in the
same bottom-right spot, so only one pair should be on at a time.

## Turning the chat widget back ON

Two files, both straightforward flag/comment flips:

**1. `app/layout.tsx`** — inside `<CartProvider>`, find this block:

```tsx
{/* <ChatWidget>{children}</ChatWidget> */}
<div className="min-h-screen [container-type:inline-size] [container-name:rb-page]">
  {children}
</div>
```

Replace it with:

```tsx
<ChatWidget>{children}</ChatWidget>
```

(Delete the stand-in div entirely — `ChatWidget`'s own wrapper carries the
same `[container-type]`/`[container-name:rb-page]` classes, so you're not
losing that; see below.)

**2. `components/DesktopWidgets.tsx`** — flip the flag back off so the two
widget sets don't both render in the same spot:

```ts
const WIDGETS_ENABLED = false;
```

That's the whole toggle. Nothing in `lib/chatbot/**`, the chat API routes, or
`components/Chat*.tsx` needs to change — none of that was touched when the
widget was disabled.

## Turning the chat widget back OFF

The inverse of the above:

1. In `app/layout.tsx`, comment out `<ChatWidget>{children}</ChatWidget>` and
   put back the stand-in div shown above in its place.
2. In `components/DesktopWidgets.tsx`, set `WIDGETS_ENABLED = true`.

## The container-query dependency

Read this before changing either file above, or before adding/removing
anything that wraps `{children}` in `app/layout.tsx`.

### Why it exists

When the chat widget is docked open on desktop, it squeezes the page into
less width via `margin-right` on a wrapper div — a genuine reflow, not an
overlay. `components/Navbar.tsx`'s desktop row (nav links, cart/account/search
icons, the "Build Yours" button) has fixed-width content that doesn't fit in
that squeezed space on some screen sizes (verified: fine on a 2K monitor,
broken on 1920px-wide "1080p" screens) — but Tailwind's normal `lg:`
responsive classes only look at the **browser viewport**, which doesn't
shrink just because the chat squeezed the page. So the navbar's own
mobile/tablet fallback (the hamburger menu it already has) never kicked in,
and the desktop row just overflowed and got hidden behind the chat panel.

The fix: CSS **container queries** instead of viewport media queries. The
navbar's top row measures the width of a specific ancestor element instead of
the browser window, and falls back to its own existing tablet/mobile layout
once *that* element gets narrow — whether that's because the real screen is
narrow, or because the chat widget squeezed it.

### The pieces

**`app/globals.css`** defines the container-query classes (inside
`@layer components`):

- `.cq-mobile-flex` / `.cq-mobile-block` — visible below the 1024px
  container-width threshold, hidden above it.
- `.cq-desktop-flex` / `.cq-desktop-block` — the inverse.
- `.cq-build-btn` — an extra intermediate step: hidden once the container
  drops below **1200px** (while `.cq-desktop-flex` content is still fully
  visible), so the "Build Yours" button is the first thing to go as space
  gets tight, before the full hamburger switch at 1024px.

All of these key off a **named CSS container**:

```css
@container rb-page (min-width: 1024px) { ... }
```

**`components/Navbar.tsx`** uses these classes (`cq-mobile-flex`,
`cq-desktop-block`, `cq-build-btn`, etc.) instead of Tailwind's `hidden
lg:flex` / `lg:hidden` on its top row (mobile hamburger, logo, mobile search,
desktop nav+icons+button). Everything else in Navbar (mega menus, mobile
drawer) is untouched and still viewport-based, which is fine — those are only
reachable through the desktop row's hover handlers, so they're inert whenever
the desktop row itself is hidden.

**The container itself** must exist somewhere between `<body>` and
`<Navbar>` in the DOM, with:

```
container-type: inline-size;
container-name: rb-page;
```

This is what makes `@container rb-page (...)` resolve at all. **If no
ancestor element has `container-name: rb-page`, the query never matches —
`.cq-desktop-flex` stays `display: none` and `.cq-mobile-flex` stays
`display: flex` permanently, regardless of real screen size.** That's
exactly the bug that happened: `<ChatWidget>` (which carried this container)
was commented out in `app/layout.tsx` and replaced with a bare `{children}`,
with nothing else providing the container context — so the navbar was stuck
showing its mobile layout on every screen size, desktop included.

### The invariant to preserve

**Exactly one element wrapping `{children}` in `app/layout.tsx` must always
carry `[container-type:inline-size] [container-name:rb-page]`**, whether the
chat widget is on or off:

- Chat ON: `<ChatWidget>` provides it (see the wrapper div inside
  `components/ChatWidget.tsx`, which also carries the `md:mr-[420px]` squeeze
  margin on the same element — that's intentional, see below).
- Chat OFF: the plain stand-in `<div className="min-h-screen
  [container-type:inline-size] [container-name:rb-page]">` in
  `app/layout.tsx` provides it instead, with no margin logic since there's
  nothing to squeeze from.

**Do not put the container-type on an element that ISN'T also the one being
squeezed.** A parent wrapping `ChatWidget`'s own margin div wouldn't work —
`margin-right` on a child doesn't shrink the parent's box, only the child's
own auto-width box. The container query needs to measure the element that
actually gets narrower, which is the same element the margin is applied to.

### If you add a new responsive component that also needs to react to the squeeze

Add new `@container rb-page (...)` rules in `globals.css` next to the
existing `.cq-*` classes, following the same naming pattern, and use them
instead of Tailwind's `sm:`/`md:`/`lg:`/etc on that component. Don't invent a
new container name unless you have a good reason — reuse `rb-page` so
everything reacts consistently to the same squeeze.

### Quick troubleshooting

**Symptom:** Navbar (or another component using `cq-*` classes) shows its
mobile/tablet layout on desktop, at any width.

**Cause:** No ancestor has `container-name: rb-page` in the DOM right now —
almost certainly because `app/layout.tsx` was edited and the stand-in div (or
`<ChatWidget>`) was removed or renamed without noticing it carried this.

**Fix:** Confirm exactly one wrapper around `{children}` in
`app/layout.tsx` has both `container-type: inline-size` and `container-name:
rb-page` (check the rendered HTML / inspect element if unsure — Tailwind's
arbitrary-value classes `[container-type:inline-size]
[container-name:rb-page]` compile straight to those CSS properties).
