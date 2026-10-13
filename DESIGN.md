# DESIGN.md — Interest to Action Visual Design System

**Status:** v0.1, ready for prototype implementation · **Platform:** mobile first (iOS reference), scaling to tablet and web
**Scope:** This document defines the *visual and interaction system*: tokens, components, motion, responsive behaviour, and accessibility.
**Companion docs:** Screen flows, copy, and states are specified in [`docs/design.md`](docs/design.md). Product requirements are in [`docs/product-spec.md`](docs/product-spec.md), and AI behaviour is in [`docs/ai-approach.md`](docs/ai-approach.md). Where this document and `docs/design.md` overlap, `docs/design.md` owns *what* a screen does and this file owns *how it looks and moves*.

---

## 1. Design Concept: "Daybreak"

Interest to Action moves a person from a vague, hazy *interest* to one clear, warm *action*. The visual system encodes that journey:

| Idea | Visual expression |
|---|---|
| **Interest** is soft, open, and not yet decided | **Lilac haze**: cool and diffuse, used for the user's raw input and for AI "thinking" |
| **Action** is warm, specific, and started | **Ember**: a sunrise orange, used for progress, selection, and the trigger of a plan |
| **The bridge** between them is the AI suggestion | **Daybreak gradient** (lilac → peach → ember), reserved for AI moments only |
| **The user's own words** matter most | Set in a **soft serif** (Fraunces), so the interest and the plan read like a personal note rather than a database row |
| **Calm, not a productivity system** | **Paper and ink**: a warm off-white canvas, near-black ink, generous space, and no red "overdue" states |

**Signature elements** (what makes this product recognisable):

1. **The If–Then plan card.** "WHEN" sits above a short dotted *bridge line*, which leads to "I'LL" set in serif. The trigger leads to the action, visually.
2. **Daybreak glow.** A soft radial wash appears only when AI is involved, on Welcome, during generation, and on Suggestions. It never appears in My Plans, which stays calm paper.
3. **Dashed "ghost" placeholders.** Empty and loading states show the *shape* of what will exist, with an inviting line of copy instead of a void.
4. **Provenance tags.** AI-suggested values carry a small `✦ Suggested` tag. Once the user edits a value, the tag becomes `Edited by you`. The user can always see who decided what.

---

## 2. Research Basis (Mobbin, iOS)

### 2.1 Method

I ran ten Mobbin searches (eight screen searches and two flow searches) on iOS, covering to-do lists, AI plan generation, habit trackers, empty states, AI loading states, goal and habit creation flows, free-text capture screens, daily planners, completion moments, and AI goal breakdown. I inspected every result visually and noted the observations per batch.

### 2.2 The 10 Most Relevant Apps

These were **selected for relevance to Interest to Action's core journey, not ranked by popularity or quality**. Mobbin does not expose rankings, and none are claimed here. To be selected, an app had to appear with real screens in at least one of these areas: task or habit lists, goal creation, AI-generated plans, or empty and loading states. Apps are listed alphabetically.

| App | Category | Screens inspected | What we adopt | What we avoid |
|---|---|---|---|---|
| **Alma** | Habit / nutrition | [Streak home](https://mobbin.com/screens/ea9f1fd5-652e-4cb3-afb6-7a6a30e53d78), [Free-text input](https://mobbin.com/screens/f9c97040-1c77-4bd1-b3b8-42c85d407fc3) | Warm cream canvas, white 24px-radius cards, serif reassurance ("Just type it. I'll handle it."), forgiving mechanics ("Vacation mode") | Streak counters as the primary motivator |
| **Atoms** | Habit tracking | [Home](https://mobbin.com/screens/686ea6d8-6679-4bbd-af5d-4573047dda2a) | Cream paper with a faint dot texture, gradient "orbs", lowercase serif tiny-habit labels ("write one sentence"), a suggestion sheet marked with a sparkle | Bubble layout, which is not scannable for a list of plans |
| **Finch** | Goals / self-care | [Today list](https://mobbin.com/screens/529f7643-124b-4819-bb6a-34f941ab1816), [Goal ideas flow](https://mobbin.com/flows/bebf1de7-904b-4073-944b-7fa51d350495), [Celebration](https://mobbin.com/screens/7004eb96-c2e5-4d63-a8df-5f4bb450e873) | Per-suggestion **add / dismiss** controls, the "Add my own" fallback, and keyword emphasis inside a sentence ("Drink **water**") | Count-of-remaining copy ("8 goals left"), confetti, and gamified currency |
| **Jomo** | Habit creation | [Create habit flow](https://mobbin.com/flows/b890a2b7-956c-42d1-92da-1cd7e1e95442) | Example hints under each section ("E.g., 'Use Books for 15min'"), a dashed "Create your own" row, and a primary CTA that is disabled until a choice is made | Multi-select, since we want one decision |
| **Liven** | Wellbeing to-do | [To-do](https://mobbin.com/screens/f399e97e-14c4-488e-9df8-9ea7f5a59147), [Reflection input](https://mobbin.com/screens/880da7b2-3302-41fc-8a70-f4eff9a100b6) | Soft top gradient wash, a full-width CTA in thumb reach that sits on top of the keyboard, "0 of 3 completed" as neutral progress | Coloured left-stripe cards, which add noise |
| **Me+** | Habit + AI planner | [AI plan in chat](https://mobbin.com/screens/e3d6a34a-b9a7-40c2-bee2-04ae1790d8d9), [Today](https://mobbin.com/screens/138585b7-ea1e-43d1-9bdf-3a90118dcaff) | AI plan presented as a contained card with three explicit choices: **Add / Help me edit / Discard** | Stacked equal-weight purple buttons, ad banners, and saturated pastel fills |
| **Numo** | ADHD to-do + AI | [Today](https://mobbin.com/screens/ce69ef20-ae7a-4f09-85e7-cb7e621f5aae), [AI subtasks flow](https://mobbin.com/flows/00adb565-e7cc-4c60-bed8-b710cd9dbd15) | An **"AI" badge on the AI-chosen value** (provenance), an × on each AI-generated row, and effort sizing as chips | Loud condensed display type, saturated blue chrome, and long subtask lists |
| **Structured** | Day planner + AI | [Timeline](https://mobbin.com/screens/f87538a4-bf7c-46ac-80ed-061e9ee855a5), [AI result with Undo](https://mobbin.com/screens/03f22cd7-b6f1-42ec-b472-e04e40dc28b2), [AI flow incl. privacy](https://mobbin.com/flows/ab378534-bc59-4f61-bec1-d74c9972c44e) | Dashed connector between items (our *bridge line*), kind copy in gaps ("A well-deserved break."), echoing the user's input above the AI result, an AI disclaimer, **Undo** on discard, and a plain-language data disclosure | Dense timeline, floating tab bar, and FAB, since we have only two areas |
| **Tiimo** | Visual planner + AI | [Today](https://mobbin.com/screens/f6a61b24-612d-4536-8ca0-375231808968), [Empty day](https://mobbin.com/screens/5e32cde9-6a17-4cdc-9c9f-4de680be0337), [Weekly plan AI flow](https://mobbin.com/flows/ecbe2b3c-40dd-4b51-b149-f2127f8d0483), [Widget list](https://mobbin.com/screens/328f199c-2624-429a-aa4f-60ebf1ada74d) | Serif display heading on calm off-white, **dashed ghost rows with inviting placeholders** ("End the day your way"), tinted overline section chips, an AI echo field with ↻ regenerate and ✎ edit, and a near-black pill CTA | Mascot, and time-of-day sections, which the scope doesn't need |
| **Todoist** | To-do | [Inbox empty state](https://mobbin.com/screens/da55b0b7-581f-4b7c-90ea-5e1e57da7c21), [Today widget](https://mobbin.com/screens/e3664e12-9fd4-4240-aca2-522f44003b9e) | An empty state that **frames value** ("Capture now, plan later") rather than lack | **Red overdue dates plus "Reschedule"**, which is the guilt pattern `docs/design.md` §6 forbids |

### 2.3 Supporting References (single screens)

- **AI plan cards:** [Google Gemini](https://mobbin.com/screens/319ea467-c382-4bb6-957f-ac3730f49097) (outline "Edit plan" next to a filled primary, plus "AI can make mistakes") and [Bevel](https://mobbin.com/screens/0fd25cbb-bfc8-406a-adb8-34b4a43b6379) ("Does this look correct? Report an issue" under Save).
- **AI loading:** [Bevel "Generating template"](https://mobbin.com/screens/f9128f3d-58bf-47a2-9a70-03cee23d9c28) (faded ghost cards with a specific caption), [Manus](https://mobbin.com/screens/420d6f5d-b7e4-4e75-bda9-569417434dc5) (skeleton inside a card), and [Finimize](https://mobbin.com/screens/a0ac7917-f698-42e8-85ce-8d6cf3949eb9) ("Building your feed…").
- **Capture screens:** [Future Pro](https://mobbin.com/screens/282bfce4-31be-49d1-a4f6-7d0e5468d2a6) (explains *why* context helps), [Pool](https://mobbin.com/screens/b19d27e0-15fc-4632-8eed-21f81a584652) (serif question with suggestion chips inside the field), and [Plenty of Fish](https://mobbin.com/screens/e87b5b07-ef19-4d55-a61e-8dddf2d6ff95) (small label above a large serif question).
- **Habits:** [Insight Timer](https://mobbin.com/screens/17c807f9-4fd0-4637-978c-bbe1af678947) (serif "0 / 2 complete", overline category labels, deep teal accent).
- **Empty states:** [Grok](https://mobbin.com/screens/bc0ad1d2-47a9-4806-8d83-573f0a3ccb1f) (icon, title, one line, pill) and [Saturn](https://mobbin.com/screens/c1c6d90c-bcf2-4334-b936-630a87738d1e) (dashed "Add something" rows).
- **Completion:** [pliability](https://mobbin.com/screens/b7793a62-21d3-499f-91a2-c8d517dd4155) (typographic celebration that uses dim and bright words instead of confetti) and [Headway](https://mobbin.com/screens/cdeb5a3e-3b24-45b8-8562-ba55d432dc41) ("next step's unlocked" on cream).
- **Anti-patterns noted:** [Life Reset](https://mobbin.com/screens/021f5bea-a6ea-4fb6-a84c-09cacc455b30) ("It's your first day. Don't screw it.") and [Anything](https://mobbin.com/screens/5d0e3b4b-a4a5-4e4d-b969-7577157db613) ("0 day streak" pills).

### 2.4 What the Research Tells Us

1. **Calm planners converge on warm paper and a serif display.** Tiimo, Atoms, Alma, Insight Timer, and Pool all pair an off-white canvas with a serif heading to signal reflection rather than throughput. Productivity-first tools (Todoist, Attio, monday.com) use cool white, sans-serif type, and red urgency. We deliberately sit in the first camp.
2. **Trustworthy AI-planning UIs share four moves:** they echo the user's input (Structured, Tiimo), contain the AI output in one card (Me+, Gemini), offer explicit accept, edit, and discard controls (Me+, Finch, Numo), and make reversal cheap through Undo (Structured). This maps one-to-one onto the agency principles in `docs/ai-approach.md` §3.
3. **Provenance is rare but powerful.** Only Numo marks which value the AI picked. Making that a system-wide pattern is a differentiator for "The user decides".
4. **The best empty states preview structure.** Dashed ghost rows (Tiimo, Saturn, Jomo) teach the layout and invite input. Illustration-led empty states (Evernote, Asana) are friendly but generic.
5. **AI loading is better as a preview than a spinner.** Bevel and Manus show faded versions of the result's shape with a specific caption, which reduces uncertainty about what is coming.
6. **Celebration polarises.** Gamified apps (Finch, Brilliant, Nibble) use confetti and points. Calm apps (pliability, Headway) use type and a single check. Our tone ("no guilt", "not pushy") calls for the quiet version.

---

## 3. Colour

### 3.1 Primitive Palette

| Token | Light | Dark | Notes |
|---|---|---|---|
| `paper` | `#FAF6EF` | `#14110E` | App background, a warm off-white |
| `surface` | `#FFFFFF` | `#1F1B17` | Cards, sheets, fields |
| `sunken` | `#F2ECE2` | `#0E0C0A` | Inset areas: text areas, segmented-control track, skeletons |
| `ink` | `#1E1A16` | `#F4EEE6` | Primary text and primary button fill |
| `ink-2` | `#5A5148` | `#C2B8AC` | Secondary text and labels |
| `ink-3` | `#6F665C` | `#A3988B` | Tertiary text: placeholders, captions, timestamps |
| `line` | `#E4DCCF` | `#3A332C` | Hairline dividers and card borders (decorative) |
| `line-strong` | `#8F8578` | `#7D7266` | Input borders and checkbox outlines (≥3:1 non-text) |
| `ember` | `#E2622B` | `#F08452` | Accent for graphics only: progress, selection ring, bridge dot, focus ring |
| `ember-text` | `#A8481C` | `#F5A37A` | Accent for text and icons on light surfaces |
| `ember-tint` | `#FCE6D8` | `#3B2418` | "In progress" badge fill and selected-card wash |
| `lilac` | `#D9D0F7` | `#3A3060` | Interest haze and gradient stop |
| `lilac-text` | `#5B4BB0` | `#B9ACF2` | `✦ Suggested` tag text and AI glyph |
| `lilac-tint` | `#EFEBFC` | `#262040` | Suggested tag fill and the interest echo chip |
| `peach` | `#FFD3B5` | `#5A3424` | Gradient midpoint only |
| `fern` | `#276B44` | `#6CC38F` | Success and Completed |
| `fern-tint` | `#E1F0E6` | `#17301F` | Completed badge fill |
| `rose` | `#B4233F` | `#F27A90` | Error text and icon |
| `rose-tint` | `#FBE4E8` | `#3A1820` | Error message background |
| `scrim` | `rgba(30,26,22,.40)` | `rgba(0,0,0,.60)` | Behind sheets |

### 3.2 Semantic Tokens

| Semantic token | Maps to | Used for |
|---|---|---|
| `bg/app` | `paper` | Screen background |
| `bg/card` | `surface` | Plan cards, list rows, sheets |
| `bg/input` | `sunken` | Text areas (borderless at rest, see §8.2) |
| `text/primary` | `ink` | Headings, body, user content |
| `text/secondary` | `ink-2` | Field labels, rationale, supporting copy |
| `text/tertiary` | `ink-3` | Placeholder, meta, dates |
| `action/primary/bg` | `ink` | Primary button fill (one per screen) |
| `action/primary/fg` | `surface` (light) / `ink` dark-mode inverse | Primary button label |
| `accent/graphic` | `ember` | Selected ring, step progress fill, bridge-line dots, focus ring |
| `accent/text` | `ember-text` | "WHEN" overline, duration chip text, links |
| `ai/text` · `ai/bg` | `lilac-text` · `lilac-tint` | Provenance tag, interest echo, AI glyph |
| `status/not-started` | `ink-2` on `sunken` | Badge |
| `status/in-progress` | `ember-text` on `ember-tint` | Badge |
| `status/completed` | `fern` on `fern-tint` | Badge with check icon |
| `feedback/error` | `rose` on `rose-tint` | Inline error and save failure |
| `feedback/success` | `fern` | Toast icon and save confirmation check |

### 3.3 Usage Rules

- **Primary buttons are ink, not ember.** The research shows near-black pill CTAs across calm planners (Tiimo, Jomo, Future Pro, Bevel). Ink gives 17.3:1 contrast and keeps ember free to mean *action and progress* rather than "button". This refines the "one accent colour for primary actions" line in `docs/design.md` §7: ember is the single *chromatic* accent, and the primary action is ink.
- **Ember never fills large areas** and never carries body text. White text on `ember` is only 3.49:1, so it fails for text.
- **Never use red for time.** There are no overdue colours anywhere. `rose` is reserved for genuine errors and always appears with an icon and text.
- **Lilac means "AI touched this".** Do not use it decoratively elsewhere, or provenance loses meaning.
- **At most one tinted badge colour per row.** Cards are otherwise neutral.

### 3.4 Verified Contrast (WCAG 2.2)

| Pair | Light | Dark | Requirement |
|---|---|---|---|
| `ink` on `paper` / `surface` | 16.05 / 17.29 | 16.32 / 14.84 | ✅ AAA |
| `ink-2` on `paper` / `surface` | 7.21 / 7.76 | 9.63 / 8.75 | ✅ AAA |
| `ink-3` on `paper` / `surface` / `sunken` | 5.22 / 5.63 / 4.79 | 6.65 / 6.05 / 6.90 | ✅ AA text |
| `ember-text` on `paper` / `surface` | 5.40 / 5.82 | 9.32 / 8.48 | ✅ AA text |
| `ember-text` on `ember-tint` | 4.84 | 7.17 | ✅ AA text |
| `lilac-text` on `lilac-tint` | 5.83 | 7.52 | ✅ AA text |
| `fern` on `fern-tint` | 5.44 | 6.65 | ✅ AA text |
| `rose` on `rose-tint` | 5.34 | 5.98 | ✅ AA text |
| `surface` on `ink` (primary button) | 17.29 | 15.00 | ✅ AAA |
| `ember` on `paper` / `surface` (graphics) | 3.24 / 3.49 | 7.28 / 6.62 | ✅ 3:1 non-text. ⚠️ Do not use on `sunken` in light mode (2.97). |
| `line-strong` on `paper` / `surface` | 3.36 / 3.62 | 4.01 / 3.64 | ✅ 3:1 input boundary |

---

## 4. Gradients

Gradients are **reserved for AI moments**. They express the bridge from interest to action and nothing else.

| Token | Definition | Where |
|---|---|---|
| `gradient/daybreak` | `linear-gradient(135deg, #D9D0F7 0%, #FFD3B5 55%, #F6A26B 100%)` | The ✦ spark mark (24–64px), the selected plan's top edge (3px), and the save-confirmation check halo |
| `gradient/daybreak-wash` | `radial-gradient(120% 60% at 50% 0%, rgba(217,208,247,.55) 0%, rgba(255,211,181,.35) 45%, rgba(250,246,239,0) 75%)` over `paper` | The top ~40% of Welcome, Generating, and Suggestions screens |
| `gradient/daybreak-wash` (dark) | Same stops at `.22` and `.14` alpha over `#14110E` | As above |
| `gradient/shimmer` | `linear-gradient(90deg, sunken 0%, surface 50%, sunken 100%)`, `background-size: 200% 100%` | Skeleton bars (§10) |

**Rules:**
- Text never sits on the saturated end of a gradient. Washes fade to `paper` before content begins, and `ink` remains ≥11.7:1 against the lightest stops.
- My Plans, Plan Detail, and Edit Plan are gradient-free, because they belong to the user, not the AI.
- Optional texture: a 4% opacity dot grid (1px dots, 12px pitch) on Welcome only, inspired by Atoms. Hide it when `prefers-reduced-transparency` or high-contrast mode is on.

---

## 5. Typography

### 5.1 Families

| Role | Family | Fallback | Why |
|---|---|---|---|
| **Display / user voice** | **Fraunces** (variable, OFL; `opsz` auto, `SOFT` 50, `WONK` 0) | `ui-serif`, New York, Georgia | A soft, warm serif in the calm-planner register (Tiimo, Atoms, Alma). Used for screen titles, the user's interest, and the plan's action. |
| **UI / body** | **Instrument Sans** (variable, OFL) | `-apple-system`, SF Pro Text, `system-ui` | Readable at 16px with a slightly condensed, contemporary feel that is distinct from default Inter or SF. Used for labels, body, buttons, and meta. |
| **Numerals** | Instrument Sans with `font-variant-numeric: tabular-nums` | — | Durations and dates align |

> This updates `docs/design.md` §7 ("one clear, readable sans-serif family"). The sans remains the only family for *interface* text. The serif is limited to headings and the user's own words, so the two never compete within a paragraph.

### 5.2 Type Scale (base 16, iOS pt = CSS px)

| Token | Family | Size / Line | Weight | Tracking | iOS Dynamic Type anchor | Use |
|---|---|---|---|---|---|---|
| `display` | Fraunces | 34 / 40 | 500 | −0.5 | `.largeTitle` | Welcome headline |
| `title-1` | Fraunces | 28 / 34 | 500 | −0.3 | `.title1` | Screen question ("What's something you've been meaning to do?") |
| `title-2` | Fraunces | 22 / 28 | 500 | −0.2 | `.title2` | Section titles, the "Plan saved" headline |
| `plan-action` | Fraunces | 20 / 26 | 500 | −0.1 | `.title3` | The **I'LL** line on plan cards |
| `interest` | Fraunces *italic* | 17 / 24 | 400 | 0 | `.body` | The user's interest when echoed back |
| `body` | Instrument Sans | 17 / 24 | 400 | 0 | `.body` | Body copy and input text |
| `body-strong` | Instrument Sans | 17 / 24 | 600 | 0 | `.headline` | Plan trigger text and list-row titles |
| `callout` | Instrument Sans | 16 / 22 | 400 | 0 | `.callout` | Rationale and supporting sentences (minimum body size) |
| `label` | Instrument Sans | 15 / 20 | 600 | 0 | `.subheadline` | Buttons and field labels |
| `overline` | Instrument Sans | 12 / 16 | 600 | +0.08em, UPPERCASE | `.caption1` | WHEN, I'LL, FOR, and step labels ("STEP 2 OF 3") |
| `caption` | Instrument Sans | 13 / 18 | 500 | 0 | `.footnote` | Dates, badge text, helper text |

**Rules:**
- Body text is never below 16px (`docs/design.md` §7). Overline and caption are only for short labels, never sentences.
- Each screen has one serif headline. Serif in lists is limited to the plan action line.
- Use sentence case everywhere except overlines.
- Keep line length ≤ 34em for body text on wide screens.
- Scale every token with Dynamic Type (iOS `UIFontMetrics(forTextStyle:)` / CSS `rem` with user font-size), up to AX5.

---

## 6. Spacing, Layout, Shape, Elevation

### 6.1 Spacing (4pt base)

`space-0` 0 · `space-1` 4 · `space-2` 8 · `space-3` 12 · `space-4` 16 · `space-5` 20 · `space-6` 24 · `space-8` 32 · `space-10` 40 · `space-12` 48 · `space-16` 64

| Context | Value |
|---|---|
| Screen side gutter | `space-5` (20) on phones, `space-8` (32) on ≥600 |
| Card inner padding | `space-5` (20) |
| Between stacked cards | `space-3` (12) |
| Label to field | `space-2` (8) |
| Between form groups | `space-6` (24) |
| Headline to content | `space-6` (24) |
| Bottom action bar | `space-4` top and bottom padding, plus safe-area inset |

### 6.2 Layout

- **Single column.** The content max-width is 560 on all sizes (see §12).
- **Bottom action bar.** The primary action is pinned to the bottom in thumb reach (Liven, Tiimo). It is full-width (minus gutters) and rises with the keyboard. A secondary action sits directly above it as a text button, or beside it at ≥600 width.
- **Top bar.** 44pt tall, containing a leading ✕ (close flow) or ‹ (back) and a centred step indicator during the planning flow. There is no title in the bar, because the serif headline in the body is the title.

### 6.3 Radius

`radius-xs` 6 (badges) · `radius-sm` 10 (chips, inline message) · `radius-md` 16 (fields, text areas) · `radius-lg` 24 (cards, sheets) · `radius-full` 999 (buttons, pills, status segmented control)

Cards use 24, matching the soft, friendly geometry seen in Alma, Tiimo, and Me+. Buttons are full pills.

### 6.4 Elevation

The surface is flat by default. Separation comes from `surface` on `paper` plus a 1px `line` border.

| Token | Value (light) | Use |
|---|---|---|
| `elev-0` | none, 1px `line` border | Cards at rest |
| `elev-1` | `0 1px 2px rgba(30,26,22,.06), 0 4px 12px rgba(30,26,22,.05)` | Pressed or selected plan card, toast |
| `elev-2` | `0 8px 32px rgba(30,26,22,.12)` | Bottom sheets |
| Dark mode | No shadows. Use `surface` lightness plus a 1px `line` border. | — |

---

## 7. Iconography & Imagery

- **Icons:** SF Symbols on iOS, or **Lucide** on web/React Native. Use a 1.75px stroke, rounded caps, and sizes 20 (inline) and 24 (bar). Icons are always paired with a label, except ✕, ‹, and ⋯, which get accessible labels.
- **Spark mark ✦:** a four-point star filled with `gradient/daybreak`. It is the only "AI" glyph. Do not use the generic magic wand or robot.
- **No mascots and no stock illustration.** The user's words are the hero (`docs/design.md` §7). Empty states use ghost UI and the spark mark instead of illustrations (§10).
- **Emoji:** not system-generated. Users may type them.

---

## 8. Components

Each spec lists anatomy, tokens, states, and accessibility. Component names match `docs/design.md` §5 where they already exist.

### 8.1 Button

| Variant | Fill | Label | Border | Height | Use |
|---|---|---|---|---|---|
| **Primary** | `ink` | `surface`, `label` | — | 56 | The one main action per screen (Continue, Suggest next steps, Save plan) |
| **Secondary** | `surface` | `ink`, `label` | 1px `line-strong` | 48 | Equal-but-lesser choices (Edit on plan cards, Edit details) |
| **Text** | none | `ink-2`, `label`, underline on focus or hover | — | 44 | Skip, None of these, Show different ideas, Back to suggestions |
| **AI** | `surface` | `ink`, `label`, with a leading ✦ | 1px `lilac` | 48 | Show different ideas (regenerate), when shown as a button |

- **Shape:** `radius-full`. Minimum width 120. Horizontal padding 24.
- **States:**
  - Pressed: scale to 0.98 and darken the fill by 6% (light) or lighten it by 6% (dark).
  - Disabled: 40% opacity with `aria-disabled`. The button stays focusable when it would otherwise hide a reason.
  - Loading: replace the label with a 3-dot pulse and keep the button's width.
- **Validation rule:** on Capture Interest, the primary button stays *enabled* even when the field is empty. This follows `docs/design.md` §4.2, which shows a message on submit instead of disabling the button.

### 8.2 Text Area (Interest Field)

- **Anatomy:** a visible label (`label`, `ink-2`), then the field, then helper or error text (`caption`).
- **Field:**
  - Fill and border: `sunken` fill, `radius-md`, padding 16, no border at rest (Future Pro, Pool).
  - Focus: a 2px `ember` ring with a 2px `paper` offset.
  - Error: a 1.5px `rose` border, plus an error message with an icon.
- **Text:** `body`, with the placeholder in `ink-3` (e.g. "e.g. Learn UI animation"). Minimum height is 120 and it auto-grows to 240, then scrolls.
- **Optional context fields** (Add Context) use the same component at 72 minimum height, each with an "Optional" caption beside the label so optionality is visible without asterisks.

### 8.3 Time Chip Group

- **Chips:** single-select pills for "5 min · 10 min · 20 min · 30+ min · Not sure". Each chip is 40 tall within a 44 hit area, with 16 horizontal padding.
- **Rest:** `surface` fill, a 1px `line-strong` border, and `ink` `label` text.
- **Selected:** `ember-tint` fill, a 1.5px `ember` border, `ember-text` label, and a leading ✓ icon (so the state is not shown by colour alone).
- **Layout:** chips wrap and never scroll horizontally. Use `role="radiogroup"`.

### 8.4 Interest Echo

- **Purpose:** keeps the user's words visible through the flow (Structured, Tiimo, and Future Pro all echo the input).
- **Anatomy:** a `lilac-tint` container with `radius-sm` and 12/16 padding. The interest is shown in `interest` style (serif italic), followed by a trailing "Edit" text button.
- **Truncation:** clamp to 2 lines with "…". The full text is in the accessible name.

### 8.5 Step Indicator

- **Anatomy:** three segments (Interest → Context → Plan), each 24×4 with a 4px gap, centred in the top bar (Pool, Liven).
- **States:** the current and completed segments are `ember`, and upcoming ones are `line-strong`.
- **Accessibility:** expose "Step 2 of 3" as text and do not announce the segments.
- The Clarification screen does not add a step. It is part of Context.

### 8.6 Plan Card ★ (signature component)

Extends `docs/design.md` §5.1.

```
┌──────────────────────────────────────────┐  radius-lg · surface · 1px line
│ WHEN                     ✦ Suggested      │  overline ember-text · tag (8.7)
│ After breakfast                           │  body-strong ink
│ ┆                                         │  bridge line: 2px dotted ember, 16 tall
│ I'LL                                      │  overline ink-2
│ Complete the first beginner lesson        │  plan-action (Fraunces 20)
│                                           │
│ ◷ 10 min                                  │  duration chip: ember-tint / ember-text
│                                           │
│ Why this works ⌄                          │  callout ink-2 (collapsed by default)
│ ───────────────────────────────────────── │  1px line
│ [  Choose this  ]            [ Edit ]     │  Primary (48) + Secondary (48)
└──────────────────────────────────────────┘
```

- **Size:** full width, with 20 padding and a 12 gap between cards. Show at most 3 cards.
- **Rationale:** collapsed to a single "Why this works" disclosure. This resolves the open question in `docs/design.md` §10, because the rationale stays available without adding reading effort (validate in testing).

**States:**

| State | Treatment |
|---|---|
| Rest | `elev-0` |
| Pressed or hovered | `elev-1`, lifts 1px |
| Focused | 2px `ember` ring, 2px offset |
| Chosen (moment before navigating) | A 3px `gradient/daybreak` top edge, `elev-1`, the other cards fade to 40%, then the screen advances (§11) |
| Regenerating | Cards stay in place at 50% opacity with `aria-busy="true"`, and a shimmer sweeps once per 1.4s. Matches `docs/design.md` §4.5. |
| Loading (first fetch) | Plan Card Skeleton (§10.1) |
| Edited (on Edit Plan) | The `✦ Suggested` tag becomes `Edited by you` |

**Accessibility:**
- Each card is an `article`, with its heading equal to the action text.
- The "Choose this" accessible name includes the action, e.g. "Choose: Complete the first beginner lesson".
- The reading order is WHEN, I'LL, FOR, then Why.

### 8.7 Provenance Tag

- **Purpose:** shows who decided a value (Numo's AI badge, generalised).
- **Suggested:** `✦ Suggested`, with `lilac-tint` fill, `lilac-text` text, `caption` 13/18, `radius-xs`, and 2/8 padding.
- **Edited by you:** `✎ Edited by you`, with `sunken` fill and `ink-2` text.
- Appears on plan cards and on Edit Plan field labels whose values are unchanged from the suggestion.
- **Accessibility:** the tag has visible text, so it is announced as part of the card. No colour-only meaning.

### 8.8 Plan Sentence

- **Purpose:** shows the canonical "When [trigger], I'll [action] for [duration] minutes." (`docs/design.md` §6).
- **Typography:** `title-2` in Fraunces, with the trigger, action, and duration segments in `ember-text` (Finch's keyword emphasis). The connecting words stay in `ink`. The segments are also distinguished by weight (500 vs 400), not by colour alone.
- **Used in:** the Edit Plan live preview, Save Confirmation, and the Plan Detail header.

### 8.9 Status Badge & Status Control

| Status | Badge | Icon |
|---|---|---|
| Not started | `sunken` fill, `ink-2` text | ○ hollow circle |
| In progress | `ember-tint` fill, `ember-text` text | ◐ half circle |
| Completed | `fern-tint` fill, `fern` text | ✓ check |

- **Badge:** `caption` weight 600, `radius-full`, 4/10 padding, 24 tall.
- **Status control (Plan Detail):** a 3-segment control with a `sunken` track, `radius-full`, and 48 height. The selected segment is `surface` with `elev-1` and the status icon. Exposed as `role="radiogroup"`. Changes save immediately and show a toast (§8.11).

### 8.10 Plan List Row (My Plans)

- **Anatomy:**
  - A `surface` card with `radius-lg` and 16/20 padding.
  - Line 1: the interest in `interest` style (serif italic, `ink-2`).
  - Line 2: the plan sentence in `body-strong` `ink`, clamped to 2 lines.
  - Line 3: the status badge, then `·`, then the created date (`caption`, `ink-3`). The date is relative up to 6 days ("Today", "Tue"), then absolute ("12 Oct").
- **Interaction:** the whole row is one tap target, with a trailing › chevron.
- **No overdue indicators, ever.** Completed rows keep full opacity (no strikethrough), because finishing is a source of pride, not something to clear away.

### 8.11 Toast (with Undo)

- **Container:** a floating `ink` container (on dark, `surface`) with `radius-md`, `elev-1`, and 12/16 padding. It sits 16 above the bottom action bar.
- **Content:** `body` text in `surface` colour, an optional leading icon (`fern` ✓ for success), and an optional trailing **Undo** text button in `ember` (light-mode `ember` on `ink` = 5.0:1 ✅).
- **Used for:** status changes ("Marked in progress · Undo") and "None of these" ("Suggestions cleared · Undo"), following Structured's undo-on-discard.
- **Timing:** auto-dismiss after 5s, or 8s when there is an action. The timer pauses while focused or touched. Announced via `role="status"`.

### 8.12 Inline Message

Implements `docs/design.md` §5.3.

- **Container:** `radius-sm` with 12/16 padding, a leading 20px icon, `callout` text, and an optional action as a text button.
- **Error:** `rose-tint` fill, `rose` icon (⚠), `ink` text. Placed directly under the related element. Uses `role="alert"`.
- **Info:** `sunken` fill, `ink-2` text. Used for the AI disclaimer (see below).
- **AI disclaimer:** a single info line at the foot of Suggestions: "Suggestions are generated by AI. Choose, edit, or skip any of them." (Gemini and Structured both include one.)

### 8.13 Empty State

- **Anatomy:**
  - Two dashed ghost rows (1.5px dashed `line-strong`, `radius-lg`, 72 tall) showing the shape of a plan row.
  - A centred 40px spark mark ✦.
  - A `title-2` headline and a `callout` line.
  - A primary button.
- **My Plans copy** (from `docs/design.md` §4.8): "No plans yet." / "Start with one thing you've been meaning to do." Button: **Add an interest**.
- The ghost rows are decorative (`aria-hidden`).

### 8.14 Bottom Sheet

- **Container:** `surface` with a `radius-lg` top, `elev-2`, and a 36×5 grabber in `line-strong`. Detents are medium and large.
- **Behaviour:** the scrim is `scrim`, and the sheet is dismissable by swipe, ✕, or Esc. Focus is trapped inside.
- **Used for:** Edit Plan on ≥600 width, as a centred dialog (§12).

---

## 9. Screen Compositions

Layout only. For content and copy, see `docs/design.md` §4.

| Screen | Background | Composition (top → bottom) |
|---|---|---|
| **Welcome** | `daybreak-wash` plus dot texture | 64px spark mark, then `display` headline (left-aligned), then `body` supporting line, then flexible space, then the **Get started** primary button |
| **Capture Interest** | `paper` | Top bar (✕, step 1/3), then `title-1` question, then a text area (labelled; the question is the visible label and is associated with the field), then the bottom bar with **Continue** riding the keyboard |
| **Add Context** | `paper` | Top bar (‹, step 2/3), then the interest echo, then `title-2` "A little context helps (all optional)", then three groups (outcome field, obstacle field, time chips), then the bottom bar with the **Skip** text button and the **Suggest next steps** primary |
| **Clarification** | `paper` | Top bar (‹, step 2/3), then a ✦ plus the AI question in `title-2`, then answer chips and a short field, then **Continue** |
| **Generating** | `daybreak-wash` | The interest echo, then the caption "Finding a few small ways to start…" with a breathing spark, then 3 plan card skeletons |
| **Suggestions** | `daybreak-wash` (fades by the first card) | Top bar (‹, step 3/3), then `title-1` "Here are a few ways to start", then the interest echo, then 2–3 plan cards, then the **Show different ideas** AI button and the **None of these** text button, then the AI disclaimer |
| **Edit Plan** | `paper` | Top bar (‹), then `title-2` "Make it yours", then fields (When / I'll / For, with a numeric stepper and chips), each label carrying a provenance tag, then a live plan sentence preview on a `surface` card, then the **Save plan** primary and the **Back to suggestions** text button |
| **Save Confirmation** | `paper` | A 72px check drawn in `fern` inside a `daybreak` halo, then `title-1` "Plan saved." with "Your next step is ready." in `ink-2` (pliability-style contrast), then the plan sentence, then the **View my plans** primary and the **Add another interest** text button |
| **My Plans** | `paper` | A 44pt bar (nothing in it), then the `display` headline "My plans" (Fraunces, 34), then plan list rows, then a sticky bottom **Add an interest** primary. There is no tab bar and no FAB, because there are only two destinations. |
| **Plan Detail** | `paper` | Top bar (‹, ⋯), then the interest (serif italic), then the plan sentence (`title-2`), then the context (labelled `callout` blocks, shown only if provided), then the status control, then "Created 12 Oct" (`caption`) |

---

## 10. Loading, Empty, Error, and Success Patterns

### 10.1 Loading (AI generation)

Based on Bevel, Manus, and Tiimo.

- **Caption:** "Finding a few small ways to start…" in `callout` `ink-2`, with an inline 16px spark that *breathes* (scale 0.9 → 1.0, opacity 0.6 → 1, 2.4s loop).
- **Plan Card Skeleton:** the same card shell, containing bars for the overline (48×10), trigger (60% × 14), action (85% × 18, then 55% × 18), and chip (64×24). Bars are `sunken` with `radius-xs` and a `gradient/shimmer` sweep (1.4s linear, infinite, staggered 120ms per card).
- **Duplicate prevention:** generate actions are disabled during loading (`docs/design.md` §4.5).
- **After 8 seconds:** the caption changes to "Still working on it. Thanks for waiting." so the wait never feels stalled.
- **Assistive technology:** the container has `aria-busy="true"`, plus a single polite live-region announcement: "Generating suggestions." Shimmer is hidden from assistive technology.

### 10.2 Local Loading

Saves and status changes are fast and local. Use optimistic UI with no spinner. Show the toast after the change has been written.

### 10.3 Empty

Use the §8.13 pattern. Never show a bare "No data".

### 10.4 Error

Uses the inline message from §8.12.

- The user's input stays on screen.
- The primary action becomes **Try again**, and the secondary becomes **Edit details**.
- Errors never replace the whole screen while there is content to preserve.
- Invalid AI responses use the same error state (`docs/design.md` §4.5).

### 10.5 Success

- **Save Confirmation:** a check draw plus a typographic headline. No confetti and no sound.
- **Status changes:** the badge cross-fades, plus a toast.
- **Completed status:** a subtle one-time ✦ sparkle burst (6 particles, 600ms) on the badge. This is skipped under reduced motion.

---

## 11. Motion

### 11.1 Tokens

| Token | Value | Use |
|---|---|---|
| `dur-instant` | 100ms | Press feedback |
| `dur-fast` | 160ms | Chip select, badge cross-fade, focus ring |
| `dur-base` | 240ms | Card enter, toast, field error |
| `dur-slow` | 360ms | Screen push, sheet present |
| `dur-gentle` | 600ms | Check draw, sparkle |
| `ease-standard` | `cubic-bezier(.2,0,0,1)` | Most transitions |
| `ease-enter` | `cubic-bezier(0,0,.2,1)` | Elements appearing |
| `ease-exit` | `cubic-bezier(.4,0,1,1)` | Elements leaving |
| `spring-soft` | iOS `.spring(response: .45, dampingFraction: .85)` | Card lift and chosen-card emphasis |

### 11.2 Choreography

- **Step to step (planning flow):** a horizontal push of 24px offset plus a fade (`dur-slow`, `ease-standard`). The bottom action bar stays fixed, so the CTA never jumps.
- **Suggestions arrive:** the skeletons cross-fade to the cards. Each card rises 12px and fades in with a 60ms stagger (`dur-base`, `ease-enter`).
- **Choose a plan:**
  1. The chosen card lifts (`spring-soft`) and its daybreak top edge animates in from left to right (`dur-base`).
  2. The sibling cards fade to 40%.
  3. After 280ms, the app navigates.
- **Regenerate:** the existing cards dim to 50% (`dur-fast`). The new cards replace them with the same stagger as "Suggestions arrive".
- **Save confirmation:** the check stroke draws (`dur-gentle`), the halo scales from 0.8 to 1 and fades in, and the headline fades in 120ms later.
- **Status change:** the selected segment slides (`dur-fast`, `ease-standard`) and the badge cross-fades.

### 11.3 Reduced Motion (`prefers-reduced-motion: reduce` / iOS Reduce Motion)

- All translations and scales become opacity-only cross-fades at `dur-fast`.
- Shimmer stops. Skeleton bars show static `sunken`.
- The spark stops breathing and stays at full opacity.
- The check appears without a draw, and the sparkle burst is removed.
- Respect Reduce Transparency by replacing the gradient washes with a flat `paper`.

---

## 12. Responsive Behaviour

| Breakpoint | Width | Behaviour |
|---|---|---|
| **Compact** | < 375 (e.g. iPhone SE) | 16 gutters. `display` drops to 30/36. Plan card buttons stack vertically (Choose on top). |
| **Phone** | 375–599 | The baseline defined in this document |
| **Medium** | 600–1023 (tablet portrait, large web) | Content is centred at 560 max with 32 gutters. The bottom action bar becomes inline at the end of content (not pinned). Edit Plan opens as a centred dialog (max 480). Primary and secondary buttons sit side by side, with the secondary on the left. |
| **Expanded** | ≥ 1024 | My Plans becomes **list + detail** (list 380 wide, detail fills the rest, max 720). The planning flow stays a centred single column at 560 inside a `surface` panel with `radius-lg` on a `paper` page, so it never stretches. |

**Also:**
- **Dynamic Type up to AX5.** Plan card overlines and values stack, and badges wrap below text. Buttons grow in height (no clipping), and the bottom bar scrolls with content if it would cover more than 30% of the viewport.
- **Keyboard.** The primary action rides above the keyboard (Liven). The content inset matches the keyboard height, and the focused field scrolls into view.
- **Safe areas.** Respect all insets. The bottom bar's padding is `space-4` plus `safe-area-inset-bottom`.
- **Orientation.** Phone landscape uses the Medium layout rules for width, with reduced vertical padding (headline-to-content 16).

---

## 13. Accessibility

This expands `docs/design.md` §8. The target is **WCAG 2.2 AA**.

- **Contrast:** all text pairs are ≥4.5:1, and UI boundaries and focus are ≥3:1. Values are verified in §3.4. Re-verify if any token changes.
- **Target size:** ≥44×44pt for every interactive element (chips are 40 visual within a 44 hit area). There are ≥8pt between adjacent targets.
- **Focus:** a 2px `ember` ring with a 2px offset in the background colour, never removed. The focus order follows the visual order, and focus moves to the new screen's headline after navigation.
- **Labels:** every field has a visible label. Placeholders are examples only. Optional fields say "Optional" in text.
- **Not by colour alone:** status badges have an icon and text, chips show a ✓ when selected, errors have an icon and text, and provenance tags have text.
- **Screen readers:**
  - Loading uses `aria-busy` plus one polite announcement.
  - Errors use `role="alert"`, and toasts use `role="status"`.
  - Each plan card is announced as one coherent group: "Suggested plan 1 of 3. When after breakfast, I'll complete the first beginner lesson, for 10 minutes."
  - Decorative gradients, the spark, and ghost rows are hidden from assistive technology.
- **Dynamic Type / text zoom:** supported to AX5 and 200% browser zoom without loss of content or functionality (§12).
- **Motion:** honour Reduce Motion and Reduce Transparency (§11.3). Nothing flashes more than 3 times per second.
- **Time limits:** toasts pause on focus, and no flow step times out.
- **Language:** plain-language copy (see `docs/design.md` §6). Set `lang` on the root.
- **Testing checklist per screen:** VoiceOver swipe-through, Dynamic Type at AX3, Reduce Motion on, dark mode, a 320pt width, and keyboard-only navigation (web).

---

## 14. Implementation Tokens

The following are reference CSS custom properties. Mirror the names in Swift or React Native theme objects. Token names are stable, and values may be tuned after testing.

```css
:root {
  /* colour — light */
  --paper:#FAF6EF; --surface:#FFFFFF; --sunken:#F2ECE2;
  --ink:#1E1A16; --ink-2:#5A5148; --ink-3:#6F665C;
  --line:#E4DCCF; --line-strong:#8F8578;
  --ember:#E2622B; --ember-text:#A8481C; --ember-tint:#FCE6D8;
  --lilac:#D9D0F7; --lilac-text:#5B4BB0; --lilac-tint:#EFEBFC; --peach:#FFD3B5;
  --fern:#276B44; --fern-tint:#E1F0E6; --rose:#B4233F; --rose-tint:#FBE4E8;
  --scrim:rgba(30,26,22,.40);

  /* gradients */
  --gradient-daybreak:linear-gradient(135deg,#D9D0F7 0%,#FFD3B5 55%,#F6A26B 100%);
  --gradient-daybreak-wash:radial-gradient(120% 60% at 50% 0%,rgba(217,208,247,.55) 0%,rgba(255,211,181,.35) 45%,rgba(250,246,239,0) 75%);

  /* type */
  --font-display:"Fraunces",ui-serif,"New York",Georgia,serif;
  --font-ui:"Instrument Sans",-apple-system,"SF Pro Text",system-ui,sans-serif;

  /* space */
  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px; --space-5:20px;
  --space-6:24px; --space-8:32px; --space-10:40px; --space-12:48px; --space-16:64px;

  /* radius */
  --radius-xs:6px; --radius-sm:10px; --radius-md:16px; --radius-lg:24px; --radius-full:999px;

  /* elevation */
  --elev-1:0 1px 2px rgba(30,26,22,.06),0 4px 12px rgba(30,26,22,.05);
  --elev-2:0 8px 32px rgba(30,26,22,.12);

  /* motion */
  --dur-instant:100ms; --dur-fast:160ms; --dur-base:240ms; --dur-slow:360ms; --dur-gentle:600ms;
  --ease-standard:cubic-bezier(.2,0,0,1); --ease-enter:cubic-bezier(0,0,.2,1); --ease-exit:cubic-bezier(.4,0,1,1);
}

@media (prefers-color-scheme: dark) {
  :root {
    --paper:#14110E; --surface:#1F1B17; --sunken:#0E0C0A;
    --ink:#F4EEE6; --ink-2:#C2B8AC; --ink-3:#A3988B;
    --line:#3A332C; --line-strong:#7D7266;
    --ember:#F08452; --ember-text:#F5A37A; --ember-tint:#3B2418;
    --lilac:#3A3060; --lilac-text:#B9ACF2; --lilac-tint:#262040; --peach:#5A3424;
    --fern:#6CC38F; --fern-tint:#17301F; --rose:#F27A90; --rose-tint:#3A1820;
    --scrim:rgba(0,0,0,.60);
    --gradient-daybreak-wash:radial-gradient(120% 60% at 50% 0%,rgba(217,208,247,.22) 0%,rgba(255,211,181,.14) 45%,rgba(20,17,14,0) 75%);
    --elev-1:none; --elev-2:none;
  }
}

@media (prefers-reduced-motion: reduce) {
  :root { --dur-base:160ms; --dur-slow:160ms; --dur-gentle:0ms; }
}
```

**Font loading:** self-host or bundle Fraunces (subset to Latin, axes `opsz,wght,SOFT`) and Instrument Sans (`wght` 400–600). Use `font-display: swap`. On iOS, register both in `Info.plist` and scale them with `UIFontMetrics`.

---

## 15. Decisions to Validate in Prototype Testing

1. **Serif for user voice.** Does setting the interest and the plan action in Fraunces make them feel more personal, or does it slow scanning in My Plans? (Fallback: serif only for headings.)
2. **Collapsed rationale.** Do users open "Why this works"? This informs the open question in `docs/design.md` §10.
3. **Provenance tags.** Do users notice and understand "✦ Suggested" and "Edited by you"?
4. **Ink primary versus ember primary.** Check whether the ink CTA reads as the clear next step against the warm palette.
5. **No tab bar.** Confirm that returning users find the planning flow from My Plans without a persistent navigation element.
