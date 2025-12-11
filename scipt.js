// script.js - renders live time for every IANA timezone supported by the browser

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('grid');
  const search = document.getElementById('search');
  const myTimeBtn = document.getElementById('myTime');

  // fallback list (common zones) if browser doesn't support Intl.supportedValuesOf
  const FALLBACK = [
    'UTC','Etc/UTC','Pacific/Honolulu','America/Anchorage','America/Los_Angeles','America/Denver',
    'America/Chicago','America/New_York','America/Sao_Paulo','Atlantic/Azores','Europe/London',
    'Europe/Paris','Europe/Berlin','Europe/Moscow','Asia/Dubai','Asia/Karachi','Asia/Kolkata',
    'Asia/Dhaka','Asia/Bangkok','Asia/Hong_Kong','Asia/Tokyo','Australia/Sydney','Pacific/Auckland',
    'Africa/Johannesburg'
  ];

  let zones = [];
  try {
    if (typeof Intl.supportedValuesOf === 'function') {
      zones = Intl.supportedValuesOf('timeZone').sort((a,b)=>a.localeCompare(b));
    } else {
      zones = FALLBACK.slice();
    }
  } catch (e) {
    zones = FALLBACK.slice();
  }

  // create a formatter for time (we recreate per zone inside formatting to include zone)
  function formatPartsForZone(zone) {
    const now = new Date();
    try {
      // Use formatToParts to get hour/min/sec/date and timeZoneName (if available)
      const fmt = new Intl.DateTimeFormat(undefined, {
        timeZone: zone,
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
        weekday: 'short', day: '2-digit', month: 'short', year:'numeric',
        timeZoneName: 'short' // e.g. GMT+5
      });
      const parts = fmt.formatToParts(now);
      const out = {};
      for (const p of parts) out[p.type] = (out[p.type] || '') + p.value;
      // time string
      const timeStr = `${(out.hour||'--')}:${(out.minute||'--')}:${(out.second||'--')}`;
      const dateStr = `${out.weekday || ''} ${(out.day||'')} ${(out.month||'')} ${(out.year||'')}`.trim();
      // try to extract offset from timeZoneName part (e.g. "GMT+5")
      let offset = out.timeZoneName || '';
      if (!offset) {
        // last fallback: create date string for that zone and compute offset text
        offset = computeOffsetText(zone);
      }
      return { timeStr, dateStr, offset };
    } catch (err) {
      return { timeStr: '—', dateStr: '—', offset: '—' };
    }
  }

  // Fallback offset computation - best-effort. Returns e.g. "UTC+05:30"
  function computeOffsetText(zone) {
    try {
      const now = new Date();
      // create a Date that represents the same wall-clock time in that timezone
      const tzString = now.toLocaleString('en-US', { timeZone: zone });
      const tzDate = new Date(tzString);
      // tzDate is the same moment but interpreted in local timezone; we can compute the timezone's
      // UTC offset in minutes by comparing utc times of now and tzDate then using getTimezoneOffset on tzDate.
      // This is a heuristic — browsers vary — but commonly works to get offset in hours.
      // Better approach: use Intl.DateTimeFormat with timeZoneName and parse that; we already tried that above.
      const guessedOffsetMinutes = -tzDate.getTimezoneOffset();
      const sign = guessedOffsetMinutes >= 0 ? '+' : '-';
      const abs = Math.abs(guessedOffsetMinutes);
      const hours = Math.floor(abs / 60).toString().padStart(2, '0');
      const minutes = (abs % 60).toString().padStart(2, '0');
      return `UTC${sign}${hours}:${minutes}`;
    } catch {
      return 'UTC';
    }
  }

  // create a single card DOM for a zone
  function makeCard(zone) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.zone = zone;

    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = zone.replaceAll('_', ' ');

    const tzid = document.createElement('div');
    tzid.className = 'tz-id';
    tzid.textContent = zone;

    const time = document.createElement('div');
    time.className = 'time';
    time.textContent = '...';

    const date = document.createElement('div');
    date.className = 'date';
    date.textContent = '';

    const offset = document.createElement('div');
    offset.className = 'offset';
    offset.textContent = '';

    card.appendChild(title);
    card.appendChild(tzid);
    card.appendChild(time);
    card.appendChild(date);
    card.appendChild(offset);

    return card;
  }

  // render all (or filtered) zones
  function render(filter = '') {
    grid.innerHTML = '';
    const f = filter.trim().toLowerCase();
    // show filtered zones
    const filtered = f ? zones.filter(z => z.toLowerCase().includes(f)) : zones;
    // create cards
    const frag = document.createDocumentFragment();
    for (const z of filtered) {
      frag.appendChild(makeCard(z));
    }
    grid.appendChild(frag);
    // update immediately
    updateTimes();
  }

  // update every visible card's time
  function updateTimes() {
    const cards = grid.querySelectorAll('.card');
    for (const c of cards) {
      const zone = c.dataset.zone;
      const parts = formatPartsForZone(zone);
      c.querySelector('.time').textContent = parts.timeStr;
      c.querySelector('.date').textContent = parts.dateStr;
      c.querySelector('.offset').textContent = parts.offset;
    }
  }

  // live update every second
  setInterval(updateTimes, 1000);

  // search event
  search.addEventListener('input', (e) => {
    render(e.target.value);
  });

  // show user's timezone and scroll to it
  myTimeBtn.addEventListener('click', () => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      search.value = tz;
      render(tz);
      // flash highlight after render
      requestAnimationFrame(() => {
        const first = grid.querySelector('.card');
        if (first) {
          first.style.boxShadow = '0 10px 30px rgba(124,58,237,0.25)';
          setTimeout(()=> first.style.boxShadow = '', 1400);
        }
      });
    } catch (e) {
      alert('Could not detect your timezone.');
    }
  });

  // initial render
  render();
});
