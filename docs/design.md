# Design

## 1. Design Goal

Interest to Action should feel like a short, calm conversation that ends with one realistic next step, not like setting up a productivity system.

The design translates the product specification into screens, states, and interaction patterns for the mobile prototype. It focuses on the core journey:

**Welcome → capture an interest → add context → review suggestions → choose or edit a plan → save → revisit.**

## 2. Design Principles

These principles follow from the research findings and the AI approach.

### One Decision per Screen

Each screen asks the user to do one thing: enter an interest, add context, choose a plan, or confirm a save. This reduces cognitive load and keeps the path from intention to action short.

### Fewer, Better Choices

Show two or three suggestions, never a long list. Each suggestion should be easy to compare at a glance.

### The User Decides

AI output is always presented as a suggestion. Every plan can be edited, regenerated, or dismissed, and nothing is saved without an explicit confirmation.

### No Maintenance Required

Avoid mandatory fields, folders, tags, and settings. The saved-plans list should be useful without the user organising it.

### Honest Feedback

Loading, empty, success, and error states are designed as part of the experience, not added afterwards. Errors never discard what the user has typed.

## 3. Information Architecture

The prototype has two main areas:

1. **Planning flow:** a linear sequence that turns one interest into one saved plan.
2. **My Plans:** a list of saved interests and their action plans.

```
Welcome
  └── Capture Interest
        └── Add Context (optional)
              └── [Clarification question, if essential]
                    └── Suggestions
                          ├── Edit Plan
                          └── Save Confirmation
                                └── My Plans
                                      └── Plan Detail
```

After the first visit, the application opens on **My Plans**, with a clear action to add a new interest. First-time users see the welcome screen.

## 4. Screen Specifications

### 4.1 Welcome

**Purpose:** Explain the value of the application and let the user start immediately (US-01).

**Content:**

- Headline: "Turn an interest into your next step."
- One supporting sentence: "Tell us something you want to pursue. We'll suggest a few small, realistic ways to begin, and you choose."
- Primary action: **Get started**

**Notes:**

- No sign-up, sign-in, or permissions requests.
- Shown only on first launch.

### 4.2 Capture Interest

**Purpose:** Record what the user wants to pursue (US-02).

**Content:**

- Prompt: "What's something you've been meaning to do?"
- Multi-line text field with placeholder: "e.g. Learn UI animation"
- Primary action: **Continue**

**States:**

| State | Behaviour |
|---|---|
| Empty | Continue is available; submitting shows "Add an interest to continue." beneath the field. |
| Filled | Continue proceeds to Add Context. |
| Returning from a later step | The field keeps the original text. |

### 4.3 Add Context

**Purpose:** Collect optional details that make suggestions more relevant (US-03).

**Content:**

- The user's interest is shown at the top as a reminder, with an edit link.
- Three optional fields, each skippable:
  - **What would success look like?** (intended outcome)
  - **What's stopping you from starting?** (main obstacle)
  - **How much time can you give it?** Quick chips: 5 min, 10 min, 20 min, 30+ min, Not sure
- Primary action: **Suggest next steps**
- Secondary action: **Skip**

**Notes:**

- Fields are visibly optional. The screen should not feel like a form to complete.
- Context is sent only if the user provides it.

### 4.4 Clarification (conditional)

**Purpose:** Ask one focused question when the interest is too broad to plan from (AI Approach, Test C).

**Content:**

- The AI's single clarification question, for example: "What kind of design interests you most: visual design, product design, or something else?"
- A short text field or suggested answer chips.
- Primary action: **Continue**

**Notes:**

- Ask at most one clarification question before generating suggestions.
- Never present the clarification as an error.

### 4.5 Suggestions

**Purpose:** Present two or three AI-generated action plans to choose from (US-04, US-05).

**Content:**

- Heading: "Here are a few ways to start"
- Two or three **Plan Cards** (see Section 5.1)
- Secondary actions:
  - **Show different ideas** (regenerate)
  - **None of these** (exit without saving)

**States:**

| State | Behaviour |
|---|---|
| Loading | Skeleton cards with the message "Finding a few small ways to start…". Generate actions are disabled to prevent duplicate requests. |
| Success | Plan cards appear; the user can select one. |
| API error or timeout | "We couldn't get suggestions right now. Your interest is saved on this screen." **Try again** and **Edit details** actions. |
| Invalid response | Treated as an error. Invalid data is never shown as a plan. |
| Regenerating | The existing cards stay visible but dimmed until the new suggestions arrive. |

### 4.6 Edit Plan

**Purpose:** Let the user adjust a selected suggestion before saving (US-05).

**Content:**

- Editable fields: **When** (trigger), **I'll** (action), **For** (duration in minutes)
- A live preview sentence: "When [trigger], I'll [action] for [duration] minutes."
- Primary action: **Save plan**
- Secondary action: **Back to suggestions**

**Notes:**

- Fields are prefilled with the selected suggestion.
- Trigger and action cannot be empty; duration must be a positive number.

### 4.7 Save Confirmation

**Purpose:** Confirm the commitment and point the user to their saved plans (US-06).

**Content:**

- Message: "Plan saved. Your next step is ready."
- The saved plan sentence.
- Primary action: **View my plans**
- Secondary action: **Add another interest**

**Error state:** "We couldn't save your plan. Nothing has been lost." with a **Try again** action. The plan details are kept.

### 4.8 My Plans

**Purpose:** Let the user revisit saved interests and plans (US-07, US-08).

**Content:**

- List of saved interests, newest first. Each item shows:
  - The interest
  - The plan sentence
  - A status badge: Not started, In progress, or Completed
- Primary action: **Add an interest**

**States:**

| State | Behaviour |
|---|---|
| Empty | "No plans yet. Start with one thing you've been meaning to do." with **Add an interest**. |
| Populated | List of plans; tapping a plan opens Plan Detail. |

### 4.9 Plan Detail

**Purpose:** Show a saved plan and update its progress (US-08).

**Content:**

- Interest, optional context, and the full plan.
- Status control: Not started · In progress · Completed
- Creation date.

**Notes:**

- Status changes save immediately with brief confirmation.
- Changing status never deletes the interest or plan.

## 5. Key Components

### 5.1 Plan Card

The plan card is the central component of the product. It must make each suggestion easy to understand and compare.

```
┌────────────────────────────────────┐
│ WHEN                               │
│ After breakfast                    │
│                                    │
│ I'LL                               │
│ Complete the first beginner lesson │
│                                    │
│ ⏱ 10 min                           │
│                                    │
│ Why this works: A short session    │
│ keeps the first step manageable.   │
│                                    │
│   [ Choose ]          [ Edit ]     │
└────────────────────────────────────┘
```

- Trigger, action, and duration are always visible.
- The rationale is optional and visually secondary.
- **Choose** goes to Save Confirmation; **Edit** opens Edit Plan with the card's values.
- Cards are full-width and stacked vertically for easy scanning on mobile.
- Visual specification, states (loading, regenerating, chosen), and the "✦ Suggested" / "Edited by you" provenance tag are defined in [`DESIGN.md` §8.6–8.7](../DESIGN.md).

### 5.2 Status Badge

Three statuses, each paired with a label as well as colour so status is never communicated by colour alone:

- **Not started:** neutral
- **In progress:** accent
- **Completed:** success, with a check icon

### 5.3 Inline Message

Used for validation, errors, and confirmations. Messages appear close to the relevant element, explain what happened in plain language, and offer a next action where possible.

## 6. Content and Tone

- **Warm and direct:** short sentences and plain language.
- **Encouraging, not pushy:** "Here are a few ways to start", not "You should…"
- **No guilt:** avoid language about unfinished lists, failure, or productivity.
- **No clinical claims:** the product does not diagnose, treat, or reference medical conditions.
- **Consistent plan format:** "When [trigger], I'll [action] for [duration] minutes."

## 7. Visual Direction

The visual style should feel calm, light, and focused.

- **Layout:** single column with generous spacing; one primary action per screen, placed within thumb reach at the bottom.
- **Typography:** one readable sans-serif family (Instrument Sans) for all interface text, with a strong heading per screen and comfortable body text (minimum 16px). A soft serif (Fraunces) is reserved for screen headings and the user's own words: the interest and the plan's action.
- **Colour:** a warm neutral "paper" background and near-black "ink" primary buttons. One chromatic accent, Ember, is used for progress and selection. There are distinct colours for success and error states, and no overdue or urgency colours.
- **Motion:** subtle transitions between steps and gentle loading feedback; respect the system's reduced-motion setting.
- **Imagery:** minimal; avoid decoration that competes with the user's own words. A soft "Daybreak" gradient appears only in AI moments.

The full visual system lives in [`DESIGN.md`](../DESIGN.md) at the repository root. It covers design tokens (colour, type, spacing, radius, elevation), gradients, component specs, motion, responsive behaviour, and verified contrast values, plus the Mobbin research behind them. This document continues to own screen purpose, content, and states.

## 8. Accessibility

- Meet WCAG 2.2 AA colour-contrast requirements.
- Touch targets of at least 44 × 44 points.
- Every input has a visible label, not just a placeholder.
- Errors are announced to screen readers and are not communicated by colour alone.
- Support dynamic text sizing without breaking layouts.
- Loading states are announced to assistive technologies.
- Respect reduced-motion preferences.

## 9. Mapping to Requirements

| Screen | User stories | MVP priority |
|---|---|---|
| Welcome | US-01 | Must-have |
| Capture Interest | US-02 | Must-have |
| Add Context / Clarification | US-03 | Must-have |
| Suggestions | US-04, US-05 | Must-have |
| Edit Plan | US-05 | Must-have |
| Save Confirmation | US-06 | Must-have |
| My Plans | US-07 | Must-have |
| Plan Detail (status updates) | US-08 | Secondary |

## 10. Open Design Questions

- Should the app open on My Plans or Capture Interest for returning users with no saved plans?
- Is a rationale on each plan card helpful, or does it add reading effort? (Current proposal: collapsed behind "Why this works"; see `DESIGN.md` §8.6.)
- Should users be able to save more than one plan for the same interest?
- Would time chips or a free-text field better capture available time?
- How should regeneration be limited to avoid users cycling through suggestions instead of choosing?

These questions should be explored through prototype testing with prospective users.
