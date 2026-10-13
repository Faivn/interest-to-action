import { Pencil } from 'lucide-react';
import { SparkMark } from './SparkMark';
import './ProvenanceTag.css';

/** Shows who decided a value: the planner or the user (DESIGN.md §8.7). */
export function ProvenanceTag({ origin }: { origin: 'suggested' | 'edited' }) {
  return origin === 'suggested' ? (
    <span className="provenance provenance--suggested t-caption">
      <SparkMark size={12} />
      Suggested
    </span>
  ) : (
    <span className="provenance provenance--edited t-caption">
      <Pencil aria-hidden="true" size={12} />
      Edited by you
    </span>
  );
}
