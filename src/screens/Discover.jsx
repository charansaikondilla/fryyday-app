import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, Clock3, Crosshair, Flame, List, Map as MapIcon, Plus, Search, X } from 'lucide-react';
import { ACTIVITIES, DISCOVER_FILTERS, venueByName } from '../data/catalog';
import { discoverPlans, useStore } from '../context/StoreContext';
import { formatWhen } from '../lib/dates';
import { useNav } from '../lib/nav';
import { fadeUp, stagger } from '../lib/motion';
import { cx } from '../lib/utils';
import Logo from '../components/Logo';
import { Screen } from '../components/Screen';
import { Chip, Img, LocationButton, Radio, Segmented, Sheet } from '../components/ui';
import { PlanHeroCard } from '../components/PlanCards';
import { CitySheet } from '../components/Sheets';
import { EmptyCup } from '../components/Illustrations';
import IllustratedMap from '../components/IllustratedMap';
import { ACTIVITY_ICONS } from '../components/icons';

const WHEN = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'weekend', label: 'Weekend' },
];

function ViewSwitch({ view, onChange }) {
  return (
    <div className="view-switch" role="tablist" aria-label="View">
      {[
        { v: 'map', label: 'Map', Icon: MapIcon },
        { v: 'list', label: 'List', Icon: List },
      ].map(({ v, label, Icon }) => (
        <button key={v} type="button" role="tab" aria-selected={view === v} className={cx('view-switch-btn', view === v && 'on')} onClick={() => onChange(v)}>
          {view === v && <motion.span layoutId="view-switch" className="view-switch-pill" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
          <Icon size={16} strokeWidth={2.3} />
          {label}
        </button>
      ))}
    </div>
  );
}

export default function Discover() {
  const nav = useNav();
  const { state, setSetting, setCity } = useStore();
  const [params, setParams] = useSearchParams();
  const filter = DISCOVER_FILTERS.includes(params.get('filter')) ? params.get('filter') : 'all';
  const when = ['today', 'tomorrow', 'weekend'].includes(params.get('when')) ? params.get('when') : 'today';
  const view = params.get('view') === 'map' ? 'map' : 'list';
  const sort = params.get('sort') === 'top' ? 'top' : 'soon';
  const [q, setQ] = useState('');
  const [cityOpen, setCityOpen] = useState(false);
  const [radiusOpen, setRadiusOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const rowRefs = useRef({});

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v == null || v === '' || (k === 'filter' && v === 'all') || (k === 'when' && v === 'today') || (k === 'view' && v === 'list') || (k === 'sort' && v === 'soon')) next.delete(k);
      else next.set(k, v);
    });
    setParams(next, { replace: true });
  };

  const plans = useMemo(() => discoverPlans(state, { filter, when, q, sort }), [state, filter, when, q, sort]);
  const mapPlans = useMemo(
    () => discoverPlans(state, { filter, when: 'any', q: '' }).filter((p) => p.km <= state.settings.radiusKm),
    [state, filter],
  );

  const pins = useMemo(() => {
    if (state.user.city !== 'Hyderabad') return [];
    const byVenue = new Map();
    mapPlans.forEach((p) => {
      if (!byVenue.has(p.venue)) byVenue.set(p.venue, []);
      byVenue.get(p.venue).push(p);
    });
    return [...byVenue.entries()].map(([venue, list]) => {
      const pos = venueByName(venue)?.map || list[0].map;
      return { id: venue, x: pos[0], y: pos[1], activity: list[0].activity, label: venue, count: list.length };
    });
  }, [mapPlans, state.user.city]);

  const activeVenue = selected && pins.some((p) => p.id === selected) ? selected : pins[0]?.id;

  useEffect(() => {
    if (!selected) return;
    const first = mapPlans.find((p) => p.venue === selected);
    if (first && rowRefs.current[first.id]) {
      rowRefs.current[first.id].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selected, mapPlans]);

  useEffect(() => {
    const el = document.querySelector('.discover-chips .chip.is-active');
    if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [filter]);

  const resetFilters = () => {
    setQ('');
    setParams(view === 'map' ? { view: 'map' } : {}, { replace: true });
  };

  const header = (
    <div className="discover-head">
      <div className="row between">
        <Logo size={26} />
        <LocationButton city={state.user.city} onClick={() => setCityOpen(true)} />
      </div>
      <div className="row between mt-8" style={{ alignItems: 'flex-end' }}>
        <AnimatePresence mode="wait" initial={false}>
          {view === 'list' ? (
            <motion.h1 key="t1" className="t-display" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              Discover
            </motion.h1>
          ) : (
            <motion.h1 key="t2" className="t-h1" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              Good company, <span className="mark">nearby.</span>
            </motion.h1>
          )}
        </AnimatePresence>
        {view === 'list' && <ViewSwitch view={view} onChange={(v) => update({ view: v })} />}
      </div>
    </div>
  );

  return (
    <Screen tabs header={header}>
      <AnimatePresence initial={false}>
        {view === 'list' && (
          <motion.div key="search" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
            <div className="input-wrap mt-4" style={{ paddingBottom: 2 }}>
              <Search size={20} strokeWidth={2.2} />
              <input className="input search" placeholder="Find your next plan" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search plans" />
              {q && (
                <button type="button" className="search-clear" onClick={() => setQ('')} aria-label="Clear search">
                  <X size={16} strokeWidth={2.6} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LayoutGroup id="discover-chips">
        <div className="chip-row discover-chips mt-12">
          {DISCOVER_FILTERS.map((f) => (
            <Chip key={f} active={filter === f} onClick={() => update({ filter: f })} icon={f === 'all' ? null : ACTIVITY_ICONS[f]} layoutId="discover-chip">
              {f === 'all' ? 'All' : ACTIVITIES[f].label}
            </Chip>
          ))}
        </div>
      </LayoutGroup>

      {view === 'list' ? (
        <>
          <div className="mt-12">
            <Segmented value={when} onChange={(v) => update({ when: v })} options={WHEN} />
          </div>
          <div className="row gap-8 mt-12" role="radiogroup" aria-label="Sort plans">
            {[
              { v: 'soon', label: 'Soonest', Icon: Clock3 },
              { v: 'top', label: 'Top voted', Icon: Flame },
            ].map(({ v, label, Icon }) => (
              <button key={v} type="button" role="radio" aria-checked={sort === v} className={cx('sort-toggle', sort === v && 'on')} onClick={() => update({ sort: v })}>
                <Icon size={15} strokeWidth={2.4} />
                {label}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            {plans.length ? (
              <motion.div key={`${filter}-${when}-${sort}`} className="list mt-16" variants={stagger(0.07, 0.04)} initial="hidden" animate="show" exit={{ opacity: 0, transition: { duration: 0.15 } }}>
                {plans.map((p) => (
                  <PlanHeroCard key={p.id} plan={p} />
                ))}
                <motion.p variants={fadeUp} className="t-cap t-center mt-8">
                  {plans.length} plan{plans.length === 1 ? '' : 's'} · public places only
                </motion.p>
              </motion.div>
            ) : (
              <motion.div key="empty" className="empty" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <EmptyCup size={200} />
                <h3>A quiet day nearby.</h3>
                <p>{state.user.city !== 'Hyderabad' ? `Plans in ${state.user.city} are coming soon.` : 'Try a wider area or start a plan.'}</p>
                <div className="col gap-10 mt-24" style={{ width: '100%' }}>
                  <button type="button" className="btn btn-primary btn-block shine" onClick={() => nav.go('/create')}>
                    Create a plan
                  </button>
                  {state.user.city !== 'Hyderabad' ? (
                    <button type="button" className="btn btn-outline btn-block" onClick={() => setCity('Hyderabad')}>
                      Back to Hyderabad
                    </button>
                  ) : (
                    <button type="button" className="btn btn-outline btn-block" onClick={resetFilters}>
                      Change filters
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-12">
          <div className="map-card">
            <div className="map-controls">
              <button type="button" className="map-ctl" onClick={() => setRadiusOpen(true)}>
                <Crosshair size={16} strokeWidth={2.4} />
                Within {state.settings.radiusKm} km
                <ChevronDown size={15} strokeWidth={2.4} />
              </button>
              <ViewSwitch view={view} onChange={(v) => update({ view: v })} />
            </div>
            <IllustratedMap
              height={360}
              radiusKm={state.settings.radiusKm}
              areaLabel={state.user.area || 'Jubilee Hills'}
              selectedId={activeVenue}
              onSelect={setSelected}
              pins={pins}
            />
          </div>
          <div className="pick-panel">
            <span className="sheet-handle" />
            <h3 className="t-h2">Pick your next plan</h3>
            <motion.div className="list mt-12" variants={stagger(0.06)} initial="hidden" animate="show">
              {(state.user.city === 'Hyderabad' ? mapPlans : []).map((p) => (
                <motion.div
                  key={p.id}
                  ref={(el) => (rowRefs.current[p.id] = el)}
                  variants={fadeUp}
                  className={cx('map-row', activeVenue === p.venue && 'is-on')}
                  onClick={() => setSelected(p.venue)}
                >
                  <Img src={p.image} alt="" activity={p.activity} className="map-row-img" />
                  <div className="grow" style={{ minWidth: 0 }}>
                    <h4 className="ellipsis">{p.title}</h4>
                    <p className="t-cap ellipsis">
                      {formatWhen(p.start)} · {p.km} km
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      nav.go(`/plan/${p.id}`);
                    }}
                  >
                    View
                  </button>
                </motion.div>
              ))}
              {!mapPlans.length && <p className="t-sub t-center">No plans within {state.settings.radiusKm} km. Try a wider radius.</p>}
            </motion.div>
            <button type="button" className="btn btn-primary btn-block btn-lg shine mt-16" onClick={() => nav.go('/create')}>
              <Plus size={20} strokeWidth={2.6} /> Create a nearby plan
            </button>
          </div>
        </motion.div>
      )}

      <CitySheet open={cityOpen} onClose={() => setCityOpen(false)} />
      <Sheet open={radiusOpen} onClose={() => setRadiusOpen(false)} title="Search radius" subtitle="Distances are to public venues, never to people.">
        <div className="list">
          {[2, 5, 10, 25].map((km) => (
            <button
              key={km}
              type="button"
              className={cx('option-row', state.settings.radiusKm === km && 'is-on')}
              onClick={() => {
                setSetting('radiusKm', km);
                setRadiusOpen(false);
              }}
            >
              <Crosshair size={19} strokeWidth={2.2} />
              <span className="grow">Within {km} km</span>
              <Radio on={state.settings.radiusKm === km} />
            </button>
          ))}
        </div>
      </Sheet>
    </Screen>
  );
}
