import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { createMockPlanner, type MockPlannerOptions } from './features/planner/mockPlanner';
import { createLocalPlanRepository, PLANS_STORAGE_KEY } from './features/plans/planRepository';

function renderApp(planner: MockPlannerOptions = {}) {
  const user = userEvent.setup();
  const utils = render(<App repository={createLocalPlanRepository()} planner={createMockPlanner({ latencyMs: 0, ...planner })} />);
  return { user, ...utils };
}

type User = ReturnType<typeof userEvent.setup>;

async function startFromWelcome(user: User) {
  await user.click(await screen.findByRole('button', { name: 'Get started' }));
}

async function captureInterest(user: User, interest: string) {
  await user.type(await screen.findByLabelText("What's something you've been meaning to do?"), interest);
  await user.click(screen.getByRole('button', { name: 'Continue' }));
}

const storedPlans = () => JSON.parse(window.localStorage.getItem(PLANS_STORAGE_KEY) ?? '{"items":[]}').items;

describe('Interest to Action journey', () => {
  it('welcomes first-time users and starts with interest capture', async () => {
    const { user } = renderApp();
    expect(await screen.findByRole('heading', { name: 'Turn an interest into your next step.' })).toBeInTheDocument();
    await startFromWelcome(user);
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Add an interest to continue.');
  });

  it('turns an interest and context into a saved, editable If–Then plan', async () => {
    const { user } = renderApp();
    await startFromWelcome(user);
    await captureInterest(user, 'I want to learn UI animation');

    // Context: all optional, echoes the interest.
    expect(screen.getByText('I want to learn UI animation')).toBeInTheDocument();
    await user.type(screen.getByLabelText('What would success look like?'), 'Animate my portfolio');
    await user.type(screen.getByLabelText("What's stopping you from starting?"), "I don't know where to start");
    await user.click(screen.getByRole('radio', { name: '10 min' }));
    await user.click(screen.getByRole('button', { name: 'Suggest next steps' }));

    // Suggestions: one recommended plan plus alternatives, on-topic, within the time given.
    const card = await screen.findByRole('article');
    expect(within(card).getByRole('heading').textContent).toContain('UI animation');
    expect(within(card).getByText('Plan 1 of 3')).toBeInTheDocument();
    expect(screen.getByText(/built-in demo planner, not a live AI model/)).toBeInTheDocument();

    const alternatives = within(card).getByRole('button', { name: 'Alternatives' });
    expect(alternatives).toHaveAttribute('aria-expanded', 'false');
    await user.click(alternatives);
    expect(alternatives).toHaveAttribute('aria-expanded', 'true');
    const options = within(card).getAllByRole('button', { name: /Show this plan instead/ });
    expect(options).toHaveLength(2);
    for (const option of options) {
      const label = option.getAttribute('aria-label')!;
      expect(label).toContain('UI animation');
      expect(Number(label.match(/for (\d+) minutes/)![1])).toBeLessThanOrEqual(10);
    }

    // Promote an alternative to the recommendation.
    const firstAction = within(card).getByRole('heading').textContent!;
    await user.click(options[0]);
    const promoted = within(card).getByRole('heading').textContent!;
    expect(promoted).not.toBe(firstAction);
    expect(within(card).getByText('Plan 2 of 3')).toBeInTheDocument();

    // Dismiss the recommendation, then undo: it comes back as the recommendation.
    await user.click(within(card).getByRole('button', { name: /Dismiss suggestion/ }));
    expect(within(screen.getByRole('article')).getByRole('heading').textContent).not.toBe(promoted);
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(within(screen.getByRole('article')).getByRole('heading').textContent).toBe(promoted);

    // Edit before saving.
    await user.click(within(screen.getByRole('article')).getByRole('button', { name: /Edit before saving/ }));
    expect(screen.getByRole('heading', { name: 'Make it yours' })).toBeInTheDocument();
    const when = screen.getByLabelText('When');
    await user.clear(when);
    await user.type(when, 'I start my lunch break');
    expect(screen.getByText('Edited by you')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save plan' }));

    // Confirmation shows the If–Then sentence.
    expect(await screen.findByRole('heading', { name: /Plan saved/ })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Your plan' }).textContent).toMatch(/When I start my lunch break, I'll .+ for \d+ minutes\./);
    expect(storedPlans()).toEqual([
      expect.objectContaining({
        interest: 'I want to learn UI animation',
        trigger: 'I start my lunch break',
        origin: 'edited',
        status: 'not-started',
        context: { outcome: 'Animate my portfolio', obstacle: "I don't know where to start", timeMinutes: 10 },
      }),
    ]);

    // Revisit and track progress.
    await user.click(screen.getByRole('button', { name: 'View my plans' }));
    const list = await screen.findByRole('list', { name: 'Current plans' });
    expect(within(list).getByText('Not started')).toBeInTheDocument();
    await user.click(within(list).getByRole('button', { name: /I want to learn UI animation/ }));
    await user.click(screen.getByRole('radio', { name: 'In progress' }));
    expect(screen.getByText('Marked in progress.')).toBeInTheDocument();
    expect(storedPlans()[0].status).toBe('in-progress');
  });

  it('accepts a suggestion exactly as offered', async () => {
    const { user } = renderApp();
    await startFromWelcome(user);
    await captureInterest(user, 'Write a short story');
    await user.click(screen.getByRole('button', { name: 'Skip' }));
    const card = await screen.findByRole('article');
    await user.click(within(card).getByRole('button', { name: /Save this plan/ }));
    // A brief "Saved" state on the card, then the confirmation screen.
    expect(await within(card).findByRole('button', { name: 'Plan saved' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /Plan saved/ }, { timeout: 2000 })).toBeInTheDocument();
    expect(storedPlans()[0]).toMatchObject({ origin: 'suggested', context: { outcome: null, obstacle: null, timeMinutes: null } });
  });

  it('asks one clarification question when the interest is too broad', async () => {
    const { user } = renderApp();
    await startFromWelcome(user);
    await captureInterest(user, 'I want to do something with design');
    await user.click(screen.getByRole('button', { name: 'Skip' }));

    expect(await screen.findByRole('heading', { name: 'What kind of design interests you most?' })).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Product design' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    const card = await screen.findByRole('article');
    expect(within(card).getByRole('heading').textContent).toContain('product design');
    await user.click(within(card).getByRole('button', { name: 'Alternatives' }));
    for (const option of within(card).getAllByRole('button', { name: /Show this plan instead/ })) {
      expect(option.getAttribute('aria-label')).toContain('product design');
    }
  });

  it('keeps the interest and offers a retry when suggestions fail', async () => {
    const { user } = renderApp({ failMode: 'error' });
    await startFromWelcome(user);
    await captureInterest(user, 'Learn Spanish');
    await user.click(screen.getByRole('button', { name: 'Skip' }));
    expect(await screen.findByText(/We couldn't get suggestions right now/)).toBeInTheDocument();
    expect(screen.getByText('Learn Spanish')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('never shows invalid planner data as a plan', async () => {
    const { user } = renderApp({ failMode: 'invalid' });
    await startFromWelcome(user);
    await captureInterest(user, 'Learn Spanish');
    await user.click(screen.getByRole('button', { name: 'Skip' }));
    expect(await screen.findByText(/We couldn't get suggestions right now/)).toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('lets the user leave without saving, with a way back', async () => {
    const { user } = renderApp();
    await startFromWelcome(user);
    await captureInterest(user, 'Learn Spanish');
    await user.click(screen.getByRole('button', { name: 'Skip' }));
    await screen.findByRole('article');
    await user.click(screen.getByRole('button', { name: 'None of these' }));

    expect(await screen.findByRole('heading', { name: 'No plans yet' })).toBeInTheDocument();
    expect(storedPlans()).toEqual([]);
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(await screen.findByRole('heading', { name: 'Here are a few ways to start' })).toBeInTheDocument();
  });

  it('keeps the interest when the page reloads mid-journey', async () => {
    const first = renderApp();
    await startFromWelcome(first.user);
    await captureInterest(first.user, 'Learn the piano');
    first.unmount();

    renderApp();
    expect(await screen.findByText('Learn the piano')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'A little context helps' })).toBeInTheDocument();
  });

  it('protects unreadable saved plans and offers a retry', async () => {
    window.localStorage.setItem('ita.onboarded', '1');
    window.localStorage.setItem(PLANS_STORAGE_KEY, '{corrupt');
    renderApp();
    expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load your saved plans.");
    expect(window.localStorage.getItem(PLANS_STORAGE_KEY)).toBe('{corrupt');
  });
});
