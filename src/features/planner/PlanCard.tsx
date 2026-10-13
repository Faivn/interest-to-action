import { useId, type CSSProperties } from 'react';
import { ChevronDown, Clock, X } from 'lucide-react';
import { Button } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import { ProvenanceTag } from '../../components/ProvenanceTag';
import { formatMinutes } from '../plans/types';
import type { PlanSuggestion } from './types';
import './PlanCard.css';

interface PlanCardProps {
  suggestion: PlanSuggestion;
  position: number;
  total: number;
  state?: 'default' | 'chosen' | 'muted';
  busy?: boolean;
  onSave: () => void;
  onEdit: () => void;
  onDismiss: () => void;
}

function upperFirst(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * The signature If–Then card (DESIGN.md §8.6): WHEN → bridge → I'LL, duration,
 * optional rationale, and explicit save / edit / dismiss controls.
 */
export function PlanCard({ suggestion, position, total, state = 'default', busy = false, onSave, onEdit, onDismiss }: PlanCardProps) {
  const titleId = useId();
  const { trigger, action, durationMinutes, rationale } = suggestion;

  return (
    <article
      className={`plan-card plan-card--${state}`}
      data-suggestion-id={suggestion.id}
      aria-labelledby={titleId}
      aria-describedby={`${titleId}-meta`}
      style={{ '--i': position - 1 } as CSSProperties}
    >
      <span id={`${titleId}-meta`} className="visually-hidden">
        Suggested plan {position} of {total}.
      </span>
      <div className="plan-card__head">
        <span className="t-overline plan-card__when-label">When</span>
        <ProvenanceTag origin="suggested" />
        <IconButton
          className="plan-card__dismiss"
          label={`Dismiss suggestion: ${action}`}
          icon={<X />}
          onClick={onDismiss}
          disabled={busy}
        />
      </div>
      <p className="t-body-strong plan-card__trigger">{upperFirst(trigger)}</p>

      <span className="plan-card__bridge" aria-hidden="true" />

      <span className="t-overline plan-card__ill-label">I'll</span>
      <h2 id={titleId} className="t-plan-action plan-card__action">
        {action}
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

      <div className="plan-card__actions">
        <Button onClick={onSave} disabled={busy} aria-label={`Save this plan: ${action}`}>
          Save this plan
        </Button>
        <Button variant="secondary" onClick={onEdit} disabled={busy} aria-label={`Edit before saving: ${action}`}>
          Edit
        </Button>
      </div>
    </article>
  );
}
