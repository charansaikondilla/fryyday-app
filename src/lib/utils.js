/** Join class names, skipping falsy values. */
export function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

let counter = 0;
export function uid(prefix = 'id') {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** A tiny vibration on devices that support it (Android). Silently ignored elsewhere. */
export function haptic(ms = 10) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms);
  } catch {
    /* not supported */
  }
}

export function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function firstName(name = '') {
  return name.trim().split(/\s+/)[0] || name;
}

export function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy copy */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/** Uses the native share sheet when available, otherwise copies the link. Returns 'shared' | 'copied' | 'failed'. */
export async function shareOrCopy({ title, text, url }) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch (err) {
      if (err && err.name === 'AbortError') return 'cancelled';
    }
  }
  const ok = await copyText(url || text || '');
  return ok ? 'copied' : 'failed';
}

export function downloadFile(filename, content, type = 'application/json') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function mapsUrl(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function openExternal(url) {
  const w = window.open(url, '_blank', 'noopener,noreferrer');
  return !!w;
}

/** Build an .ics calendar file for a plan. */
export function planToIcs(plan) {
  const fmt = (ts) => new Date(ts).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const end = plan.start + (plan.durationMin || 90) * 60 * 1000;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Fryyday//Plans//EN',
    'BEGIN:VEVENT',
    `UID:${plan.id}@fryyday.app`,
    `DTSTAMP:${fmt(Date.now())}`,
    `DTSTART:${fmt(plan.start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${plan.title}`,
    `LOCATION:${plan.venue}, ${plan.area}`,
    `DESCRIPTION:${(plan.about || '').replace(/\n/g, ' ')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/** Resize an uploaded image file to a small square JPEG data URL (keeps localStorage small). */
export function resizeImageFile(file, size = 320) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) {
      reject(new Error('Please choose an image file.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That image could not be opened.'));
      img.onload = () => {
        const s = Math.min(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
