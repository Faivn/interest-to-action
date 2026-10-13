import { Button } from '../../components/Button';
import './InterestEcho.css';

interface InterestEchoProps {
  interest: string;
  onEdit?: () => void;
}

/** Keeps the user's own words visible through the flow (DESIGN.md §8.4). */
export function InterestEcho({ interest, onEdit }: InterestEchoProps) {
  return (
    <div className="interest-echo">
      <p className="interest-echo__text t-interest">
        <span className="visually-hidden">Your interest: </span>
        {interest}
      </p>
      {onEdit && (
        <Button variant="text" className="interest-echo__edit" onClick={onEdit} aria-label="Edit your interest">
          Edit
        </Button>
      )}
    </div>
  );
}
