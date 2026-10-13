import { planSentenceParts, type PlanDraft } from './types';
import './PlanSentence.css';

interface PlanSentenceProps {
  plan: PlanDraft;
  as?: 'p' | 'h1' | 'h2';
  className?: string;
}

/**
 * "When [trigger], I'll [action] for [duration] minutes." with the user's details
 * emphasised by colour and weight, so meaning never relies on colour alone (DESIGN.md §8.8).
 */
export function PlanSentence({ plan, as: Tag = 'p', className = 't-title-2' }: PlanSentenceProps) {
  const p = planSentenceParts(plan);
  return (
    <Tag className={`plan-sentence ${className}`}>
      {p.opener}
      <strong>{p.trigger}</strong>, I'll <strong>{p.action}</strong>
      {p.duration && (
        <>
          {' '}
          for <strong>{p.duration}</strong>
        </>
      )}
      .
    </Tag>
  );
}
