import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, MapPin, Search } from 'lucide-react';
import { AREAS, CITIES, VENUES, venueType } from '../data/catalog';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { nextDays, timeSlots } from '../lib/dates';
import { stagger, fadeUp } from '../lib/motion';
import { cx } from '../lib/utils';
import { ActivityIcon, Radio, Sheet } from './ui';

/* City picker used by the "Hyderabad ⌄" buttons. */
export function CitySheet({ open, onClose }) {
  const { state, setCity } = useStore();
  const toast = useToast();
  return (
    <Sheet open={open} onClose={onClose} title="Choose your city" subtitle="Plans are shown for the city you pick.">
      <motion.div className="list" variants={stagger(0.04)} initial="hidden" animate="show">
        {CITIES.map((c) => (
          <motion.button
            key={c}
            variants={fadeUp}
            type="button"
            className={cx('option-row', state.user.city === c && 'is-on')}
            onClick={() => {
              setCity(c);
              onClose();
              if (c !== state.user.city) toast.show({ title: `Showing plans in ${c}`, icon: 'check' });
            }}
          >
            <MapPin size={19} strokeWidth={2.2} />
            <span className="grow">{c}</span>
            {state.user.city === c && <Check size={19} strokeWidth={2.8} className="t-accent" />}
          </motion.button>
        ))}
      </motion.div>
    </Sheet>
  );
}

/* Area picker (onboarding "Choose area manually"). */
export function AreaSheet({ open, onClose, value, onPick }) {
  const [q, setQ] = useState('');
  const list = AREAS.filter((a) => a.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <Sheet open={open} onClose={onClose} title="Choose your area" subtitle="Only your area is used — never your exact location.">
      <div className="input-wrap" style={{ marginBottom: 12 }}>
        <Search size={19} strokeWidth={2.2} />
        <input className="input search" placeholder="Search areas in Hyderabad" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="list">
        {list.map((a) => (
          <button key={a} type="button" className={cx('option-row', value === a && 'is-on')} onClick={() => onPick(a)}>
            <MapPin size={19} strokeWidth={2.2} />
            <span className="grow">{a}</span>
            <Radio on={value === a} />
          </button>
        ))}
        {!list.length && <p className="t-sub t-center mt-12">No areas match “{q}”.</p>}
      </div>
    </Sheet>
  );
}

/* Public venue picker for creating / editing plans. */
export function VenueSheet({ open, onClose, activity, value, onPick }) {
  const [q, setQ] = useState('');
  const type = venueType(activity);
  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    const sorted = [...VENUES].sort((a, b) => (a.type === type ? -1 : 0) - (b.type === type ? -1 : 0) || a.km - b.km);
    return sorted.filter((v) => !query || v.name.toLowerCase().includes(query) || v.area.toLowerCase().includes(query));
  }, [q, type]);
  return (
    <Sheet open={open} onClose={onClose} title="Choose a public place" subtitle="Meet in busy, public venues — it keeps everyone comfortable.">
      <div className="input-wrap" style={{ marginBottom: 12 }}>
        <Search size={19} strokeWidth={2.2} />
        <input className="input search" placeholder="Search cafés, parks, courts…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="list">
        {list.map((v) => (
          <button key={v.id} type="button" className={cx('option-row', value === v.name && 'is-on')} onClick={() => onPick(v.name)} style={{ minHeight: 64 }}>
            <span className="venue-ic">
              <ActivityIcon activity={v.type} size={18} />
            </span>
            <span className="grow" style={{ minWidth: 0 }}>
              <span className="ellipsis" style={{ display: 'block' }}>
                {v.name}
              </span>
              <small className="t-cap">
                {v.area} · {v.km} km
              </small>
            </span>
            <Radio on={value === v.name} />
          </button>
        ))}
        {!list.length && <p className="t-sub t-center mt-12">No public places match “{q}”.</p>}
      </div>
    </Sheet>
  );
}

/* Day picker */
export function DateSheet({ open, onClose, value, onPick }) {
  const days = nextDays(7);
  return (
    <Sheet open={open} onClose={onClose} title="Pick a day">
      <div className="date-grid">
        {days.map((d) => (
          <motion.button key={d.offset} type="button" whileTap={{ scale: 0.94 }} className={cx('date-cell', value === d.offset && 'is-on')} onClick={() => onPick(d.offset)}>
            <small>{d.label}</small>
            <strong>{d.date}</strong>
            <small>{d.month}</small>
          </motion.button>
        ))}
      </div>
    </Sheet>
  );
}

/* Time picker */
export function TimeSheet({ open, onClose, value, onPick }) {
  const slots = timeSlots(6, 23);
  return (
    <Sheet open={open} onClose={onClose} title="Pick a time">
      <div className="time-grid">
        {slots.map((s) => (
          <motion.button key={s.value} type="button" whileTap={{ scale: 0.94 }} className={cx('time-cell', value === s.value && 'is-on')} onClick={() => onPick(s.value)}>
            {s.label}
          </motion.button>
        ))}
      </div>
    </Sheet>
  );
}
