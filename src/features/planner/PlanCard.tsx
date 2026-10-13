import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, LayoutGroup, m } from 'motion/react';
import { ChevronDown, Clock, Pencil, X } from 'lucide-react';
import { AutoHeight } from '../../components/AutoHeight';
import { Collapsible } from '../../components/Collapsible';
import { StatefulButton } from '../../components/StatefulButton';
import { Button } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import { ProvenanceTag } from '../../components/ProvenanceTag';
import { StreamingText, streamDuration } from '../../components/StreamingText';
import { prefersReducedMotion, SPRING_LAYOUT } from '../../lib/motion';
import { formatMinutes } from '../plans/types';
import type { PlanSuggestion } from './types';
import './PlanCard.css';

/* ─────────────────────────────────────────────────────────
 * PLAN RECOMMENDATION CARD
 * One card holds its shape and shows the recommended plan.
 * "Alternatives" opens a drawer inside the card listing the
 * other options; picking one promotes it to the recommendation.
 * The primary action saves; Edit and ✕ stay available.
 * ───────────────────────────────────────────────────────── */

interface PlanRecommendationCardProps {
  suggestions: PlanSuggestion[];
  /** Regenerating or otherwise unavailable. */
  busy?: boolean;
  /** The suggestion currently being saved, and the one that has just been saved. */
  savingId: string | null;
  savedId: string | null;
  onSave: (suggestion: PlanSuggestion) => void;
  onEdit: (suggestion: PlanSuggestion) => void;
  onDismiss: (suggestion: PlanSuggestion) => void;
  /** Ask the card to show a specific plan (e.g. one restored by Undo). `nonce` repeats the request. */
  promote?: { id: string; nonce: number } | null;
}

/** A beat at the dotted bridge between trigger and action. */
const BRIDGE_PAUSE_MS = 160;
/** Details follow once the last word has settled. */
const SETTLE_MS = 240;

function upperFirst(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function shortLabel(s: PlanSuggestion) {
  return `${upperFirst(s.trigger)} · ${s.action}`;
}

export function PlanRecommendationCard({
  suggestions,
  busy = false,
  savingId,
  savedId,
  onSave,
  onEdit,
  onDismiss,
  promote = null,
}: PlanRecommendationCardProps) {
  const drawerId = useId();
  const alternativesRef = useRef<HTMLButtonElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(suggestions[0]?.id ?? null);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState<string | null>(null);

  // New ideas (or a dismissed recommendation) fall back to the first remaining plan.
  const active = suggestions.find((s) => s.id === selectedId) ?? suggestions[0];
  useEffect(() => {
    if (active && active.id !== selectedId) setSelectedId(active.id);
  }, [active, selectedId]);

  useEffect(() => {
    if (promote) setSelectedId(promote.id);
  }, [promote]);

  // Stream a plan's text only the first time it is shown as the recommendation.
  const seen = useRef(new Set<string>());

  if (!active) return null;
  const position = suggestions.indexOf(active) + 1;
  const others = suggestions.filter((s) => s.id !== active.id);
  const locked = busy || savingId !== null || savedId !== null;
  const saved = savedId === active.id;

  return (
    <article
      className={['plan-card', saved || savingId === active.id ? 'plan-card--chosen' : ''].filter(Boolean).join(' ')}
      aria-labelledby={`${drawerId}-action`}
      aria-describedby={`${drawerId}-meta`}
      data-suggestion-id={active.id}
    >
      <div className="plan-card__head">
        <ProvenanceTag origin="suggested" />
        <span className="plan-card__head-actions">
          <Button
            variant="text"
            icon={<Pencil />}
            className="plan-card__edit"
            onClick={() => onEdit(active)}
            disabled={locked}
            aria-label={`Edit before saving: ${active.action}`}
          >
            Edit
          </Button>
          <IconButton
            className="plan-card__dismiss"
            label={`Dismiss suggestion: ${active.action}`}
            icon={<X />}
            onClick={() => onDismiss(active)}
            disabled={locked}
          />
        </span>
      </div>

      {/* The card morphs its height as plans change; the outgoing plan blurs away. */}
      <AutoHeight>
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={active.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.18 } }}
            exit={{ opacity: 0, filter: 'blur(4px)', transition: { duration: 0.12 } }}
          >
            <PlanBody suggestion={active} seen={seen.current} labelId={`${drawerId}-action`} />
          </m.div>
        </AnimatePresence>
      </AutoHeight>

      {/* Alternatives drawer — a distinctly new section of the card (beUI Collapsible). */}
      {others.length > 0 && (
        <Collapsible id={drawerId} open={open} triggerRef={alternativesRef}>
          <div className="plan-card__drawer-body">
            <p className="t-caption plan-card__drawer-title">Other options</p>
            {/* A soft highlight glides between options on hover and focus (beUI Shared Layout Background). */}
            <LayoutGroup id={drawerId}>
              <ul className="plan-card__options" onMouseLeave={() => setHighlighted(null)}>
                {others.map((option) => (
                  <li key={option.id}>
                    <button
                      type="button"
                      className="plan-card__option"
                      disabled={locked}
                      onClick={() => setSelectedId(option.id)}
                      onMouseEnter={() => setHighlighted(option.id)}
                      onFocus={() => setHighlighted(option.id)}
                      onBlur={() => setHighlighted(null)}
                      aria-label={`Show this plan instead: when ${option.trigger}, I'll ${option.action} for ${option.durationMinutes} minutes`}
                    >
                      {highlighted === option.id && !locked && (
                        <m.span
                          layoutId="option-highlight"
                          className="plan-card__option-highlight"
                          transition={SPRING_LAYOUT}
                          aria-hidden="true"
                        />
                      )}
                      <span className="plan-card__option-text">{shortLabel(option)}</span>
                      <span className="plan-card__option-meta t-caption">{formatMinutes(option.durationMinutes)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </LayoutGroup>
          </div>
        </Collapsible>
      )}

      <div className="plan-card__footer">
        <span id={`${drawerId}-meta`} className="t-caption plan-card__position">
          Plan {position} of {suggestions.length}
        </span>
        <span className="plan-card__footer-actions">
          {others.length > 0 && (
            <Button
              ref={alternativesRef}
              variant="secondary"
              className="plan-card__alternatives"
              aria-expanded={open}
              aria-controls={drawerId}
              onClick={() => setOpen((current) => !current)}
              disabled={locked}
              icon={<ChevronDown className="plan-card__chevron" />}
            >
              Alternatives
            </Button>
          )}
          <StatefulButton
            className="plan-card__save"
            state={saved ? 'success' : savingId === active.id ? 'loading' : 'idle'}
            disabled={locked}
            onClick={() => onSave(active)}
            aria-label={`Save this plan: ${active.action}`}
          >
            Save this plan
          </StatefulButton>
        </span>
      </div>
    </article>
  );
}

interface PlanBodyProps {
  suggestion: PlanSuggestion;
  seen: Set<string>;
  labelId: string;
}

/** WHEN → bridge → I'LL, duration and rationale. Remounted (keyed) whenever a plan is promoted. */
function PlanBody({ suggestion, seen, labelId }: PlanBodyProps) {
  const { trigger, action, durationMinutes, rationale } = suggestion;
  const triggerText = upperFirst(trigger);

  // Fixed on mount; first appearance streams, a re-promoted plan simply fades in.
  const [timing] = useState(() => {
    if (seen.has(suggestion.id) || prefersReducedMotion()) return null;
    const actionStart = streamDuration(triggerText) + BRIDGE_PAUSE_MS;
    return { actionStart, revealAt: actionStart + streamDuration(action) + SETTLE_MS };
  });
  useEffect(() => {
    seen.add(suggestion.id);
  }, [seen, suggestion.id]);

  return (
    <div
      className={`plan-card__body${timing ? ' plan-card__body--streaming' : ''}`}
      style={timing ? ({ '--reveal-at': `${timing.revealAt}ms` } as CSSProperties) : undefined}
    >
      <span className="t-overline plan-card__when-label">When</span>
      <p className="t-body-strong plan-card__trigger">
        <StreamingText text={triggerText} active={timing !== null} />
      </p>

      <span className="plan-card__bridge" aria-hidden="true" />

      <span className="t-overline plan-card__ill-label">I'll</span>
      <h2 id={labelId} className="t-plan-action plan-card__action">
        <StreamingText text={action} startMs={timing?.actionStart} active={timing !== null} />
      </h2>

      <p className="plan-card__duration t-caption">
        <Clock aria-hidden="true" size={14} />
        <span className="visually-hidden">For </span>
        {formatMinutes(durationMinutes)}
      </p>

      {rationale && (
        <details className="plan-card__why">
          <summary className="t-callout">
            Why this works
            <ChevronDown aria-hidden="true" size={16} />
          </summary>
          <p className="t-callout">{rationale}</p>
        </details>
      )}
    </div>
  );
}
