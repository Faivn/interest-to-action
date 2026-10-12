# Product Specification

## 1. Product Overview

**Product:** Interest to Action

**Platform:** Mobile application

**Core value proposition:** Help people turn accumulated interests and intentions into practical next steps through a low-friction, AI-assisted planning experience.

**Product approach:** The application helps users move from capturing an interest to choosing and saving a concrete action plan. AI supports the planning process, while the user retains control over every decision.

## 2. Target Users and User Needs

The application is designed for people who frequently collect new interests, skills, courses, and project ideas but struggle to translate those intentions into action.

These users need a simple way to clarify what they want to pursue, identify a realistic starting point, and keep track of the plans they choose to follow.

The initial concept is informed by my own experience. The product should make it easier to act on an interest without requiring users to maintain a complicated productivity system.

## 3. Product Goals

- Make capturing an interest quick and straightforward.
- Help users clarify what they want to accomplish.
- Reduce the effort involved in identifying a practical next action.
- Preserve user control over AI-generated suggestions and personal commitments.
- Allow users to save and revisit their selected plans.
- Minimise friction between opening the application and taking the first step.

## 4. Core User Journey

### Step 1: Welcome and Get Started

The user opens the application and sees a brief introduction explaining its value.

The user can begin immediately without creating an account.

### Step 2: Capture an Interest

The user enters an interest, goal, course, skill, or project they want to pursue.

**Example:** "I want to learn UI animation."

### Step 3: Add Context

The application allows the user to provide additional context to make the suggestions more relevant.

Depending on the user's input, this may include their intended outcome, what is preventing them from starting, or how much time they can commit.

Additional context is optional unless clarification is necessary to generate useful suggestions.

### Step 4: Generate Action Plans

The application uses AI to generate two or three concise action plans.

Each plan contains:

- **Trigger:** A situation or event that can prompt the action.
- **Action:** A specific, achievable next step.
- **Estimated duration:** The approximate time required.

**Example:** "If I finish breakfast, then I'll spend 10 minutes completing the first UI animation lesson."

The application must not invent the user's schedule, preferences, or personal circumstances.

### Step 5: Choose or Edit a Plan

The user can select a suggestion, edit its details, request alternative suggestions, or decide not to proceed.

The application does not automatically commit the user to a plan.

### Step 6: Save and Revisit

The user saves their chosen plan and can view it in a simple list of saved interests and action plans.

### Step 7: Review Progress

The user can update a saved plan's status to reflect whether it is in progress or completed.

This functionality supports lightweight progress tracking without introducing a full habit-tracking system.

## 5. Functional Requirements

### 5.1 Onboarding and Access

- The application presents a short welcome screen.
- The user can begin using the core functionality without registering or signing in.
- The application does not require unnecessary personal information to generate suggestions.

### 5.2 Interest Capture

- The user can enter an interest in a text field.
- The user can submit the interest to begin the planning flow.
- The application validates empty submissions.
- The application preserves the original interest throughout the planning process.

### 5.3 AI-Assisted Planning

- The application sends the interest and relevant user-provided context to a server-side AI endpoint.
- The AI returns two or three actionable suggestions in a defined structure.
- Each suggestion includes a trigger, an action, and an estimated duration.
- Suggestions reflect the user's input and available context.
- The user can request alternative suggestions.
- The interface displays a loading state while suggestions are generated.
- The application handles API failures, timeouts, and invalid responses gracefully.

### 5.4 User Control

- The user can select a suggested plan.
- The user can edit a suggestion before saving.
- The user can reject all suggestions.
- The user can choose not to save a plan.
- The application saves a plan only after the user explicitly confirms the action.

### 5.5 Saving and Retrieval

- The user can save a selected action plan and its associated interest.
- The user can view previously saved plans.
- Saved plans remain available after navigating away from a screen or restarting the application, provided local application data remains intact.
- The user can update a saved plan's progress status.

### 5.6 Progress Tracking

- The user can mark a saved plan as in progress or completed.
- The application displays the current status of each plan.
- Updating a status does not remove the associated interest or action plan.

## 6. Non-Functional Requirements

- **Usability:** Keep the mobile interface clear, focused, and easy to navigate.
- **Low friction:** Minimise unnecessary steps and required fields.
- **Feedback:** Provide clear loading, success, empty, and error states.
- **Security:** Keep AI API keys on the server and out of client-side code and public source control.
- **Privacy:** Avoid sending unnecessary personal information to the AI service or exposing private input in logs.
- **User agency:** Make AI-generated suggestions understandable, editable, and optional.
- **Reliability:** Validate AI responses before displaying or saving them.

## 7. MVP Scope and Priorities

### Must-have requirements

These requirements define the core product experience and must work in the submitted prototype.

1. Guest access and a simple welcome screen.
2. Interest capture and input validation.
3. Optional context collection.
4. AI-generated action plans.
5. Plan selection, editing, and rejection.
6. Saving and retrieving plans locally.
7. Loading, empty, success, and error states.

### Secondary requirements

These extend the core experience and should be implemented after the must-have requirements are working.

1. Marking a saved plan as in progress or completed.
2. Basic interest categorisation.

### Out of scope

- Mandatory account registration and authentication.
- Cross-device synchronisation.
- Complex dashboards and analytics.
- Comprehensive habit tracking or project management.
- Calendar integrations and automatic scheduling.
- Autonomous AI agents that execute tasks.
- Social features and leaderboards.
- Clinical diagnosis or treatment features.

## 8. Data and AI Behaviour

### Interest data

Each saved interest should contain:

- A unique identifier.
- The original interest text.
- Optional user-provided context.
- Its associated action plan or plans.
- Creation date.
- Current progress status.

### Action plan data

Each action plan should contain:

- A unique identifier.
- The trigger.
- The proposed action.
- Estimated duration.
- Current status.

### AI behaviour

- Generate two or three concise, actionable suggestions.
- Use the supplied interest and relevant context.
- Avoid inventing user preferences, schedules, or constraints.
- Return structured data that the application can validate.
- Request clarification when essential information is missing.
- Preserve the user's ability to edit, reject, or ignore suggestions.

## 9. User Stories and Acceptance Criteria

### US-01: Start Without an Account

**User story:** As a new user, I want to start using the application without creating an account so that I can experience its value immediately.

| Given | When | Then |
|---|---|---|
| I open the application for the first time | The welcome screen loads | The application explains its purpose and provides a clear way to get started. |
| I choose to get started | I proceed from the welcome screen | I can access interest capture without registering or signing in. |

### US-02: Capture an Interest

**User story:** As someone with many interests, I want to record something I want to explore so that I can turn the idea into an actionable plan.

| Given | When | Then |
|---|---|---|
| I am on the interest capture screen | I enter a non-empty interest and continue | The application preserves the interest and proceeds to the next step. |
| The interest field is empty | I attempt to continue | The application displays a clear validation message and prevents submission. |

### US-03: Provide Context

**User story:** As someone pursuing an interest, I want to provide relevant context so that the suggested actions reflect what I want to achieve.

| Given | When | Then |
|---|---|---|
| I have entered an interest | I provide additional context | The application includes the context in the AI request. |
| I have entered an interest | I choose not to provide additional context | I can continue when no clarification is essential. |
| Essential information is missing | The application cannot generate relevant suggestions without it | The application asks a focused clarification question. |

### US-04: Generate Action Plans

**User story:** As someone unsure how to begin, I want AI to suggest realistic next steps so that I can move from intention to action.

| Given | When | Then |
|---|---|---|
| I have submitted my interest and relevant context | I request suggestions | The application displays two or three AI-generated action plans. |
| Suggestions are returned | I review an action plan | Each plan contains a trigger, a concrete action, and an estimated duration. |
| Suggestions are being generated | The AI request is processing | The application displays a loading state and prevents duplicate submissions where appropriate. |
| The AI endpoint fails | The application cannot retrieve suggestions | The application displays a helpful error and allows me to retry without losing my original interest or context. |
| The AI returns invalid data | The application validates the response | The application does not present invalid data as a valid action plan and provides a recoverable error state. |

### US-05: Choose, Edit, or Reject a Suggestion

**User story:** As someone deciding how to pursue an interest, I want to choose, edit, or reject AI suggestions so that I remain in control of my plans.

| Given | When | Then |
|---|---|---|
| AI suggestions are displayed | I select a suggestion | The application allows me to proceed with the selected plan. |
| A suggestion is displayed | I edit its details | The application uses my edited values in the plan to be saved. |
| The suggestions are unsuitable | I request alternatives | The application generates new suggestions using the available interest and context. |
| I do not want to proceed | I reject the suggestions | The application does not save a plan without my confirmation. |

### US-06: Save an Action Plan

**User story:** As someone who has chosen a next step, I want to save my action plan so that I can return to it later.

| Given | When | Then |
|---|---|---|
| I have selected or edited a plan | I confirm that I want to save it | The application saves the plan with its associated interest. |
| The plan is saved successfully | The save operation completes | The application displays confirmation and makes the plan available in the saved-plans view. |
| The save operation fails | I attempt to save a plan | The application displays an error and allows me to retry without losing my plan details. |

### US-07: Revisit Saved Plans

**User story:** As someone managing several interests, I want to revisit my saved plans so that I can remember what I intended to pursue.

| Given | When | Then |
|---|---|---|
| I have saved one or more plans | I open the saved-plans view | The application displays my saved plans and their details. |
| I have saved a plan | I close and reopen the application | The plan remains available while its local application data is intact. |
| I have no saved plans | I open the saved-plans view | The application displays a helpful empty state with an option to add an interest. |

### US-08: Update Progress

**User story:** As someone working towards an interest, I want to update the status of a saved plan so that I can track my progress.

| Given | When | Then |
|---|---|---|
| I have a saved plan | I mark it as in progress | The application updates and displays the new status. |
| I have a saved plan | I mark it as completed | The application updates and displays the completed status. |
| I update a plan's status | The update succeeds | The new status remains available when I revisit the plan. |

## 10. Prototype Success Criteria and Metrics

The prototype is functionally successful when a user can complete the core journey:

**Open the application → enter an interest → provide context if needed → generate suggestions → choose or edit a plan → save it → retrieve it.**

Evaluation measures:

- **Core journey completion:** Can a user complete the entire workflow without assistance?
- **Functional reliability:** Do generation, validation, saving, retrieval, and error handling behave as specified?
- **Suggestion relevance:** Does the user consider at least one suggested action relevant and realistic?
- **Interaction clarity:** Can the user understand how to choose, edit, and save a plan?

Successful completion demonstrates that the prototype works as intended. It does not establish long-term behavioural effectiveness, which would require further testing.

