interface ActivityEntry { title: string; url: string; action: string; }

function initializeClock() {
  const clock = document.querySelector<HTMLElement>('[data-garden-clock]');
  if (!clock || clock.dataset.clockReady === 'true') return;
  clock.dataset.clockReady = 'true';
  const timezone = clock.dataset.timezone || 'Asia/Shanghai';
  const update = () => {
    try {
      clock.textContent = new Intl.DateTimeFormat('zh-CN', { timeZone: timezone, month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
    } catch { clock.textContent = new Date().toLocaleString('zh-CN'); }
  };
  update();
  window.setInterval(update, 60_000);
}

function initializeTabs() {
  document.querySelectorAll<HTMLButtonElement>('[data-feed-tab]').forEach((tab) => {
    if (tab.dataset.bound === 'true') return;
    tab.dataset.bound = 'true';
    tab.addEventListener('click', () => {
      const selected = tab.dataset.feedTab;
      document.querySelectorAll<HTMLButtonElement>('[data-feed-tab]').forEach((button) => button.setAttribute('aria-selected', String(button === tab)));
      document.querySelectorAll<HTMLElement>('[data-feed-panel]').forEach((panel) => { panel.hidden = panel.dataset.feedPanel !== selected; });
    });
  });
}

function initializeActivity() {
  const detail = document.getElementById('activity-detail');
  document.querySelectorAll<HTMLButtonElement>('[data-activity-date]').forEach((cell) => {
    if (cell.dataset.bound === 'true') return;
    cell.dataset.bound = 'true';
    cell.addEventListener('click', () => {
      if (!detail) return;
      let items: ActivityEntry[] = [];
      try { items = JSON.parse(cell.dataset.activityItems || '[]'); } catch { items = []; }
      const date = new Date(`${cell.dataset.activityDate}T12:00:00`).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
      detail.replaceChildren();
      const heading = document.createElement('strong');
      heading.textContent = date;
      detail.append(heading);
      if (!items.length) {
        const empty = document.createElement('span');
        empty.textContent = '这一天没有内容活动';
        detail.append(empty);
      } else {
        items.forEach((item) => {
          const link = document.createElement('a');
          link.href = item.url;
          link.textContent = `${item.action} · ${item.title}`;
          detail.append(link);
        });
      }
      document.querySelectorAll('[data-activity-date][aria-current="date"]').forEach((active) => active.removeAttribute('aria-current'));
      cell.setAttribute('aria-current', 'date');
    });
  });
}

function randomIndex(length: number) {
  if (!length) return -1;
  if (window.crypto?.getRandomValues) {
    const buffer = new Uint32Array(1);
    window.crypto.getRandomValues(buffer);
    return buffer[0] % length;
  }
  return Math.floor(Math.random() * length);
}

function initializeRandomNote() {
  document.querySelectorAll<HTMLButtonElement>('[data-random-note]').forEach((button) => {
    if (button.dataset.bound === 'true') return;
    button.dataset.bound = 'true';
    button.addEventListener('click', () => {
      let notes: { url: string; title: string }[] = [];
      try { notes = JSON.parse(button.dataset.randomNote || '[]'); } catch { notes = []; }
      const index = randomIndex(notes.length);
      if (index >= 0) window.location.assign(notes[index].url);
    });
  });
}

function initializeGarden() {
  initializeClock();
  initializeTabs();
  initializeActivity();
  initializeRandomNote();
}

initializeGarden();
document.addEventListener('astro:page-load', initializeGarden);
