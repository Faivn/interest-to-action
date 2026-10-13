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

    // Suggestions: two or three, on-topic, fitting the time given, clearly from the demo planner.
    const cards = await screen.findAllByRole('article');
    expect(cards.length).toBeGreaterThanOrEqual(2);
    expect(cards.length).toBeLessThanOrEqual(3);
    for (const card of cards) {
      expect(within(card).getByRole('heading').textContent).toContain('UI animation');
      expect(Number(within(card).getByText(/\d+ min/).textContent!.match(/\d+/)![0])).toBeLessThanOrEqual(10);
    }
    expect(screen.getByText(/built-in demo planner, not a live AI model/)).toBeInTheDocument();

    // Dismiss one, then undo.
    const firstAction = within(cards[0]).getByRole('heading').textContent!;
    await user.click(within(cards[0]).getByRole('button', { name: /Dismiss suggestion/ }));
    expect(screen.queryByRole('heading', { name: firstAction })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByRole('heading', { name: firstAction })).toBeInTheDocument();

    // Edit before saving.
    await user.click(within(screen.getAllByRole('article')[0]).getByRole('button', { name: /Edit before saving/ }));
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
    const [card] = await screen.findAllByRole('article');
    await user.click(within(card).getByRole('button', { name: /Save this plan/ }));
    expect(await screen.findByRole('heading', { name: /Plan saved/ })).toBeInTheDocument();
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

    const cards = await screen.findAllByRole('article');
    expect(cards.every((c) => within(c).getByRole('heading').textContent!.includes('product design'))).toBe(true);
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
    await screen.findAllByRole('article');
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
