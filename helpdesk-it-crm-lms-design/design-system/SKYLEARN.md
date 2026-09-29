Skylearn is the visual language of the Helpdesk IT CRM + LMS: warm, bright and legible. Sky blue carries the brand and every primary action, sun yellow is kept for achievements, leaf green means progress and correct answers, and coral says “let’s try again” without ever feeling punitive. Surfaces are white and generous, corners soft, and type large and dyslexia-friendly. It serves students aged 14–16, their teachers, the front desk, the administrator and the CEO — the same components, denser on staff screens.

## Content fundamentals

- Speak like a good teacher: friendly, specific, never babyish. Write “Not quite — a switch sends data only to the port it’s meant for. Try again.”, never “Oopsie!”.
- Praise the specific thing: “You finished 3 tasks this week — your best week so far.” Not “Great job!”.
- Staff copy is plain and direct: “7 present · 2 absent — 1 parent will get a Telegram message.”
- Empty states invite: “Nothing here yet — pick a task to start.”
- Sentence case for everything, including buttons (“Book a free trial lesson”). Address the reader as “you”. No emoji, no exclamation marks except the “Keep going!” CTA.
- Every string exists in four variants: English, Русский, O‘zbekcha (Latin) and Ўзбекча (Cyrillic). Leave 30% width headroom for Russian and Uzbek.
- Money is written “600 000 so‘m” (space thousands); times 24-hour “14:00”; dates “Tue 29 Sep”.

## Visual foundations

**Color.** `sky` for primary buttons, active nav (`sky-soft` fill, `sky-deep` text) and single-series charts. `sun` only for stars, badges, streaks and rank #1 — never a button or a warning. `leaf` fills progress; `leaf-soft` + `leaf-ink` mark Paid / Present / Active / correct. `coral` borders an incorrect answer; `coral-soft` + `coral-ink` mark Overdue / Absent / Declined. `berry` marks trial lessons, bonus content and the second chart series. Text is `ink` or `ink-muted`; `ink-subtle` fails contrast on white and is kept for placeholders only. Color never carries meaning alone: pair it with an icon and a word (a pill reads “Overdue 11 days” with an alert icon; an incorrect tile also gets a dashed border and an × badge).

**Type.** Headlines in `display` (Hubot Sans, rounded warmth), everything else in `body` (Atkinson Hyperlegible — chosen for open apertures and distinct b/d/p/q). Body letter-spacing 0.01em. Student-facing text is 16px minimum and instructions 18–20px (`body-lg`); staff tables may use `caption` 14px, never smaller. Numbers that line up use `data` (JetBrains Mono, tabular).

**Spacing.** 4px base: `space-1` … `space-32`. Cards pad `space-6` (20px on mobile); card grids gap `space-8` desktop / 20px mobile; sections are `space-12` apart. Every control is at least `tap-min` (56px) — the attendance checkbox is a 32px box centred in a 56px target.

**Shape & elevation.** `radius-input` 12 on inputs, `radius-btn` 16 on buttons and tiles, `radius-card` 20 on cards, `radius-modal` 28 on sheets, `radius-pill` on avatars, badges and pills. Cards rest on a 1px `outline` border and lift with `shadow-hover`. The active lesson card has a 3px `sky` border plus `shadow-active`. Modals use `shadow-modal` over a soft blurred wash.

**Motion.** 240ms with a gentle spring, `cubic-bezier(0.34, 1.56, 0.64, 1)`. Progress bars fill over 480ms ease-out. An incorrect tile shakes 4px twice (240ms). Star badges scale in over 480ms with a `shadow-glow` that fades after 2s. Confetti (1.6s, sky/sun/leaf/berry) plays only when a task is completed — never for a single correct answer. `prefers-reduced-motion` removes confetti and shortens transitions to 120ms.

**Focus.** A solid 3px `sky-deep` outline 3px off the element; inputs instead get a `sky-deep` border plus a 4px `sky-soft` ring.

**Layout.** One responsive source per screen. At 1024px and wider: a 280px `surface` sidebar listing only the modules the role may use (from the RBAC matrix), a sticky 80px top bar (title, streak for students, language switch, notifications, avatar) and content up to `container`. Below 1024px: the sidebar becomes a bottom tab bar of at most five items; the Full Administrator’s fifth tab, “More”, opens the rest of the same list as a bottom sheet. No other navigation panels exist.

**Accessibility.** WCAG AAA (7:1) is the target for body text; `ink` and `ink-muted` meet it on white. The source’s family colors fail as text on their own soft tints, so this system adds `leaf-ink`, `coral-ink` and `berry-ink` for text and uses `sky-deep` for text on `sky-soft`. White on `sky` is 3.7:1, so primary-button labels stay at 20px/600. Every reading passage offers “Read to me”; audio never autoplays.

## Iconography

The source asks for a custom hand-drawn-adjacent set (2px stroke, rounded caps). None was supplied, so the screens use **Lucide** (same 2px rounded stroke) as a stand-in: 24px default in `ink-muted`, 32px in lesson cards, 48px in feature spots, `sky` when active, `sun` for achievements. Replace with the illustrated set when it exists; keep the same names and sizes.

## Components

Built as plain CSS classes in `components/bundle.css` (the same file as `assets/skylearn.css` in the screens pack), so they port straight to React or native. From the source: Big Friendly Button, Lesson Card, Answer Tile, Star Badge, Streak Counter, Progress Bar, Confetti, Drag-and-Drop Zone, Reading Passage, Avatar, Quiz Score Card, Help Bubble, Tag Pills, Inputs.

Left out on purpose: the **Parent View Switcher** (parents have no account — they only receive Telegram messages) and the **mascot** (no character art exists; help bubbles stand alone).

Intentional additions, required by the CRM + LMS technical task: **App Shell** (role sidebar, top bar, bottom tabs), **Status Pill** (CRM stages, payment and attendance states), **Attendance Checkbox**, **Segmented Control** (daily/weekly/monthly report periods), **Stat Tile** and **Bar Chart** (CEO and admin dashboards), **Data Table**, and **Chat Bubble** (Telegram-style chat).
