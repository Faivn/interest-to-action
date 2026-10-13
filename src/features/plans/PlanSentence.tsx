import { countWords, StreamingText, STREAM_STEP_MS } from '../../components/StreamingText';
import { planSentenceParts, type PlanDraft } from './types';
import './PlanSentence.css';

interface PlanSentenceProps {
  plan: PlanDraft;
  as?: 'p' | 'h1' | 'h2';
  className?: string;
  /** Reveal the sentence word by word, starting at `startMs`. */
  stream?: { startMs: number };
}

/**
 * "When [trigger], I'll [action] for [duration] minutes." with the user's details
 * emphasised by colour and weight, so meaning never relies on colour alone (DESIGN.md §8.8).
 */
export function PlanSentence({ plan, as: Tag = 'p', className = 't-title-2', stream }: PlanSentenceProps) {
  const p = planSentenceParts(plan);
  const pieces: { text: string; strong: boolean }[] = [
    { text: p.opener, strong: false },
    { text: p.trigger, strong: true },
    { text: ", I'll ", strong: false },
    { text: p.action, strong: true },
    ...(p.duration
      ? [
          { text: ' for ', strong: false },
          { text: p.duration, strong: true },
        ]
      : []),
    { text: '.', strong: false },
  ];

  // One continuous reveal across the plain and emphasised segments.
  let wordsBefore = 0;
  return (
    <Tag className={`plan-sentence ${className}`}>
      {pieces.map((piece, i) => {
        const startMs = (stream?.startMs ?? 0) + wordsBefore * STREAM_STEP_MS;
        wordsBefore += countWords(piece.text);
        const content = <StreamingText text={piece.text} startMs={startMs} active={Boolean(stream)} />;
        return piece.strong ? <strong key={i}>{content}</strong> : <span key={i}>{content}</span>;
      })}
    </Tag>
  );
}
