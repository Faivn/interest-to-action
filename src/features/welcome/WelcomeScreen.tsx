import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { SparkMark } from '../../components/SparkMark';
import './WelcomeScreen.css';

/**
 * docs/design.md §4.1 — shown on first launch only; no sign-up or permissions.
 * Composition per DESIGN.md §9: spark, display headline, one supporting line, then Get started.
 */
export function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <Screen
      wash
      className="welcome"
      actions={
        <Button fullWidth onClick={onStart}>
          Get started
        </Button>
      }
    >
      <div className="welcome__content">
        <SparkMark size={64} className="welcome__spark" />
        <h1 className="t-display">Turn an interest into your next step.</h1>
        <p className="t-body welcome__lede">
          Tell us something you want to pursue. We'll suggest a few small, realistic ways to begin, and you choose.
        </p>
      </div>
    </Screen>
  );
}
