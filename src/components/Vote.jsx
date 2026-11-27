import { AnimatePresence, motion } from 'framer-motion';
import { ArrowBigDown, ArrowBigUp } from 'lucide-react';
import { ME, useStore, voteTally } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { cx } from '../lib/utils';

function formatCount(n) {
  const abs = Math.abs(n);
  if (abs >= 1000) return `${(n / 1000).toFixed(abs >= 10000 ? 0 : 1)}k`;
  return String(n);
}

/**
 * Upvote / downvote pill for a plan.
 * variant: 'glass' (on top of photos) | 'solid' (on page surfaces)
 * Tapping the same arrow again removes your vote. Hosts see the score but can't vote on their own plan.
 */
export default function VoteControl({ plan, variant = 'glass', size = 'md', className }) {
  const { state, vote } = useStore();
  const toast = useToast();
  const { score, mine } = voteTally(state, plan);
  const isHost = plan.hostId === ME;
  const icon = size === 'sm' ? 18 : 20;

  const press = (dir) => (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (isHost) {
      toast.show({ title: 'It’s your plan', body: 'Others can vote on it — you can’t vote on your own.', icon: 'alert' });
      return;
    }
    vote(plan.id, dir);
  };

  const label = `${score} points${mine === 1 ? ', you upvoted' : mine === -1 ? ', you downvoted' : ''}`;

  return (
    <div
      className={cx('vote', `vote-${variant}`, `vote-${size}`, mine === 1 && 'is-up', mine === -1 && 'is-down', isHost && 'is-host', className)}
      role="group"
      aria-label={label}
      onClick={(e) => e.stopPropagation()}
    >
      <motion.button type="button" className="vote-btn vote-up" whileTap={{ scale: 0.78 }} onClick={press(1)} aria-pressed={mine === 1} aria-label="Upvote">
        <ArrowBigUp size={icon} strokeWidth={2.2} fill={mine === 1 ? 'currentColor' : 'none'} />
      </motion.button>
      <span className="vote-count" aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={score}
            initial={{ y: mine === -1 ? -12 : 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: mine === -1 ? 12 : -12, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 520, damping: 30 }}
            style={{ display: 'inline-block' }}
          >
            {formatCount(score)}
          </motion.span>
        </AnimatePresence>
      </span>
      <motion.button type="button" className="vote-btn vote-down" whileTap={{ scale: 0.78 }} onClick={press(-1)} aria-pressed={mine === -1} aria-label="Downvote">
        <ArrowBigDown size={icon} strokeWidth={2.2} fill={mine === -1 ? 'currentColor' : 'none'} />
      </motion.button>
    </div>
  );
}

/** Small "92% liked · 48 votes" line for the plan details page. */
export function VoteSummary({ plan }) {
  const { state } = useStore();
  const { ups, downs, percent } = voteTally(state, plan);
  const total = ups + downs;
  if (!total) return <span className="t-cap">No votes yet — be the first.</span>;
  return (
    <span className="t-cap">
      <strong className="vote-percent">{percent}% upvoted</strong> · {total} vote{total === 1 ? '' : 's'}
    </span>
  );
}
