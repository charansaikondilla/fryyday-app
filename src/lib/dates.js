export const MIN = 60 * 1000;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

export function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function dayKey(d = new Date()) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

/** Timestamp for `dayOffset` days from today at "HH:mm". */
export function at(dayOffset, hhmm = '12:00') {
  const d = startOfDay();
  d.setDate(d.getDate() + dayOffset);
  const [h, m] = hhmm.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

/** Whole days between today and ts (0 = today, 1 = tomorrow, -1 = yesterday). */
export function daysFromToday(ts) {
  return Math.round((startOfDay(new Date(ts)).getTime() - startOfDay().getTime()) / DAY);
}

/** Days until the next given weekday (0=Sun … 6=Sat). 0 when today is that weekday. */
export function daysUntil(weekday) {
  return (weekday - new Date().getDay() + 7) % 7;
}

export function isWeekend(ts) {
  const d = new Date(ts).getDay();
  return d === 0 || d === 6;
}

export function hhmm(ts) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatTime(ts) {
  const d = new Date(ts);
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${ap}`;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function weekdayName(ts, long = false) {
  const n = WEEKDAYS[new Date(ts).getDay()];
  return long ? n : n.slice(0, 3);
}

export function formatDay(ts, { long = false } = {}) {
  const off = daysFromToday(ts);
  if (off === 0) return 'Today';
  if (off === 1) return 'Tomorrow';
  if (off === -1) return 'Yesterday';
  if (off > 1 && off < 7) return weekdayName(ts, long);
  if (off < -1 && off > -7) return weekdayName(ts, true);
  const d = new Date(ts);
  return `${weekdayName(ts)}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function formatWhen(ts, opts) {
  return `${formatDay(ts, opts)}, ${formatTime(ts)}`;
}

export function formatDateLong(ts) {
  const d = new Date(ts);
  return `${weekdayName(ts)}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function timeAgo(ts) {
  const s = Math.max(0, (Date.now() - ts) / 1000);
  if (s < 45) return 'Just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const back = -daysFromToday(ts);
  if (back === 0) {
    const h = Math.round(m / 60);
    return `${h} hr${h > 1 ? 's' : ''} ago`;
  }
  if (back === 1) return 'Yesterday';
  if (back < 7) return `${back} days ago`;
  const d = new Date(ts);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** Next 7 days as options for date pickers. */
export function nextDays(n = 7) {
  return Array.from({ length: n }, (_, i) => {
    const ts = at(i, '12:00');
    const d = new Date(ts);
    return {
      offset: i,
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : weekdayName(ts),
      date: d.getDate(),
      month: MONTHS[d.getMonth()],
    };
  });
}

/** Time slots every 30 minutes between start and end hour. */
export function timeSlots(startHour = 6, endHour = 23) {
  const out = [];
  for (let h = startHour; h <= endHour; h++) {
    for (const m of [0, 30]) {
      if (h === endHour && m > 0) break;
      const v = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      out.push({ value: v, label: formatTime(at(0, v)) });
    }
  }
  return out;
}
