# AI Approach

## 1. Why AI?

Interest to Action explores a problem that involves more than storing information.

A user may know what they want to pursue but still need help clarifying the intended outcome, identifying an obstacle, or determining a manageable first action.

Conventional application logic can capture interests, store plans, and manage statuses. AI is introduced specifically to help interpret free-form user input and generate context-sensitive action-plan suggestions.

The goal is to use AI where flexibility and language understanding add value, rather than using it for functions that ordinary software can perform reliably.

## 2. Initial AI Use Case

The initial AI capability converts one user-provided interest into two or three practical if–then action plans.

### Input

The model receives:

- The user's original interest.
- The intended outcome, if provided.
- The main obstacle, if provided.
- The user's available time, if provided.

The model must distinguish missing information from information explicitly supplied by the user.

### Output

Each proposed plan contains:

- **Trigger:** A situation or event that signals when to act.
- **Action:** A specific, achievable next step.
- **Duration:** An estimated time required.
- **Rationale:** An optional short explanation of why the suggestion may be manageable.

The output should be concise, relevant, and easy to evaluate.

## 3. AI Interaction Principles

### Preserve User Agency

AI provides options; the user makes the decision.

The application must allow the user to accept, edit, reject, or regenerate suggestions.

### Reduce Cognitive Load

Return a small number of suggestions rather than a long list of tasks or a comprehensive life plan.

Avoid unnecessary follow-up questions, complicated settings, and excessive information.

### Use Context Responsibly

Suggestions should be based on information the user has provided.

The model must not invent the user's schedule, motivations, resources, or existing commitments.

### Make Suggestions Actionable

Avoid vague recommendations such as "be more productive" or "work on your goals."

Prefer a clear trigger paired with a specific, manageable action.

### Avoid Unnecessary Automation

The AI does not automatically schedule, execute, or commit the user to an action.

## 4. Proposed Technical Architecture

1. The frontend collects the user's interest and relevant context.
2. The frontend sends a request to a server-side API route.
3. The server validates the input and calls the selected LLM API.
4. The model returns structured action-plan suggestions.
5. The server validates the response before returning it to the frontend.
6. The user reviews and edits the suggestions.
7. The application saves the selected plan only after user confirmation.

The selected model provider and framework will be documented once implementation choices are finalised.

## 5. Structured Output

The application should use a defined output schema so the frontend can reliably render the model's response.

Illustrative structure:

{
  "plans": [
    {
      "trigger": "After breakfast at 8:30 AM",
      "action": "Complete the first beginner lesson",
      "duration_minutes": 10,
      "rationale": "A short starting session keeps the initial commitment manageable."
    }
  ]
}

The example illustrates the expected format, not a required schedule or a guaranteed model response.

Where supported, use the provider's structured-output functionality. Otherwise, validate the returned data on the server before displaying it.

## 6. Prompt Design

The system instruction will direct the model to:

- Generate two or three concise if–then plans.
- Use the user's supplied context.
- Make each action specific and manageable.
- Avoid inventing missing personal information.
- Ask a clarification question when essential information is missing.
- Avoid overwhelming users with unnecessary choices.
- Preserve the user's decision-making authority.

The prompt will be refined through testing rather than treated as correct after the first attempt.

## 7. Error Handling and Validation

The implementation should account for:

- Empty or invalid input.
- Missing required context.
- API timeouts and provider errors.
- Malformed or incomplete model responses.
- Suggestions that are vague, repetitive, or unrelated to the user's interest.
- Users rejecting all suggestions.

The application should provide a retry path and preserve the original interest when a request fails.

## 8. Privacy and Security

- Store API credentials in server-side environment variables.
- Never expose secret keys in browser code or commit them to GitHub.
- Send only the information needed for the current request.
- Avoid logging unnecessary personal information.
- Do not treat AI-generated suggestions as clinical advice or claim that the product treats ADHD.

## 9. Testing the AI Experience

The AI implementation should be evaluated against representative inputs.

### Test A: Broad Interest

Input: "I want to learn Python."

Expected: The system asks for clarification if necessary or offers small, beginner-friendly starting options without assuming the user's experience.

### Test B: Limited Time

Input: "I want to learn UI animation, but I only have 10 minutes available."

Expected: Suggestions fit the stated time constraint.

### Test C: Unclear Intention

Input: "I want to do something with design."

Expected: The system seeks clarification instead of inventing a detailed goal.

### Test D: Rejected Suggestions

Input: A user rejects every proposed plan.

Expected: The application allows another attempt or lets the user leave without saving a commitment.

### Test E: API Failure

Input: A valid interest while the AI service is unavailable.

Expected: A clear error message appears, and the original interest is retained.

## 10. Evaluation

The prototype will be evaluated on:

- Relevance of the suggestions.
- Specificity and feasibility of the proposed actions.
- Correctness of the structured output.
- User ability to edit or reject suggestions.
- Handling of errors and missing information.
- Whether AI adds value beyond a conventional form or static template.

The prototype can demonstrate the feasibility of AI-assisted action planning. Claims about sustained engagement or improved follow-through require further testing.

