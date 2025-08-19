
const M3U_URL       = 'https://allinonereborn.fun/playlist/opplex190.m3u';
const LS_KEY        = 'tv_channels_v3';
const CATS_KEY      = 'tv_categories_v3';
const TS_KEY        = 'tv_saved_time_v3';
const CAT_LS_KEY    = 'tv_recent_category_v3';
const SEARCH_LS_KEY = 'tv_recent_search_v3';
const LS_MAX_AGE    = 1000 * 60 * 60 * 24; // 1 day

let channels = [];
let filtered = [];
let categories = new Set();
let currentCategory = 'All';

// Restore last category
const savedCat = localStorage.getItem(CAT_LS_KEY);
if (savedCat) currentCategory = savedCat;

// Restore last search early
const prevSearch = localStorage.getItem(SEARCH_LS_KEY);
if (prevSearch) document.getElementById('searchbox').value = prevSearch;

function setInfo(text) {
  document.getElementById('info').textContent = text;
}

function loadLocal() {
  try {
    const time = localStorage.getItem(TS_KEY);
    const now = Date.now();
    if (!time || now - time > LS_MAX_AGE) return false;
    const channelStr = localStorage.getItem(LS_KEY);
    const catsStr = localStorage.getItem(CATS_KEY);
    if (!channelStr || !catsStr) return false;
    channels = JSON.parse(channelStr);
    categories = new Set(JSON.parse(catsStr));
    setInfo('Loaded from local storage.');
    filtered = channels;
    buildCats();
    filterAndRender();
    return true;
  } catch {
    return false;
  }
}

function saveLocal() {
  localStorage.setItem(LS_KEY, JSON.stringify(channels));
  localStorage.setItem(CATS_KEY, JSON.stringify(Array.from(categories)));
  localStorage.setItem(TS_KEY, Date.now().toString());
}

function fetchAndParse() {
  fetch(M3U_URL)
    .then(res => res.text())
    .then(data => {
      const lines = data.split('\n');
      channels = [];
      categories = new Set();
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#EXTINF')) {
          let name = (lines[i].match(/tvg-name="([^"]+)"/) || [])[1];
          let group = (lines[i].match(/group-title="([^"]+)"/) || [])[1] || 'Other';
          let logo =
            (lines[i].match(/tvg-logo="([^"]+)"/) || [])[1] ||
            (lines[i].match(/tv-logo="([^"]+)"/)  || [])[1] ||
            '';
          if (!name || name === 'Unknown Channel' || !name.trim()) continue;
          let curr = { name, group, logo };
          let j = i + 1;
          while (j < lines.length && !lines[j].trim()) j++;
          curr.url = lines[j];
          channels.push(curr);
          categories.add(group);
        }
      }
      filtered = channels;
      saveLocal();
      setInfo('Loaded from network.');
      buildCats();
      filterAndRender();
    })
    .catch(_ => setInfo('Network failed, and no local data found.'));
}

function buildCats() {
  const cats = ['All', ...Array.from(categories).sort()];
  const container = document.getElementById('categories');
  container.innerHTML = '';
  cats.forEach(cat => {
    const chip = document.createElement('button');
    chip.className = 'cat-chip' + (cat === currentCategory ? ' active' : '');
    chip.textContent = cat;
    chip.onclick = () => {
      currentCategory = cat;
      localStorage.setItem(CAT_LS_KEY, cat);
      filterAndRender();
      document.querySelectorAll('.cat-chip').forEach(btn =>
        btn.classList.toggle('active', btn.textContent === cat)
      );
    };
    container.appendChild(chip);
  });
}

// Filtering and rendering
function filterAndRender() {
  let searchVal = document.getElementById('searchbox').value.trim().toLowerCase();
  localStorage.setItem(SEARCH_LS_KEY, searchVal);
  filtered = channels.filter(ch =>
    (currentCategory === 'All' || ch.group === currentCategory) &&
    (!searchVal ||
      ch.name.toLowerCase().includes(searchVal) ||
      (ch.group && ch.group.toLowerCase().includes(searchVal))
    )
  );
  renderChannels();
}

function renderChannels() {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  filtered.forEach(ch => {
    const card = document.createElement('div');
    card.className = 'card';
    // Thumbnail
    const thumb = document.createElement('img');
    thumb.className = 'thumb';
    thumb.src = ch.logo || 'https://upload.wikimedia.org/wikipedia/commons/0/0a/No-image-available.png';
    thumb.alt = ch.name;
    thumb.style.cursor = 'pointer'; // Make clear it's clickable
    card.appendChild(thumb);

    // Card body
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    // Title
    const titleDiv = document.createElement('div');
    titleDiv.className = 'chan-title';
    titleDiv.textContent = ch.name;
    titleDiv.style.cursor = 'pointer'; // Indicate clickable
    cardBody.appendChild(titleDiv);

    // Group tag
    const groupDiv = document.createElement('span');
    groupDiv.className = 'chan-group';
    groupDiv.textContent = ch.group;
    cardBody.appendChild(groupDiv);

  
    // Click on logo or title opens player.html (same params as "Watch")
    function openPlayer() {
      window.open(
        `player.html?url=${encodeURIComponent(ch.url)}&name=${encodeURIComponent(ch.name)}&poster=${encodeURIComponent(ch.logo)}`,
        '_blank'
      );
    }
    thumb.addEventListener('click', openPlayer);
    titleDiv.addEventListener('click', openPlayer);

    card.appendChild(cardBody);
    grid.appendChild(card);
  });

  setInfo(`${filtered.length} channels found`);
}


// Search events
document.getElementById('searchbox').addEventListener('input', filterAndRender);

// Check cache, else fetch
if (!loadLocal()) {
  setInfo('Loading channels...');
  fetchAndParse()  
}
const themeBtn = document.getElementById('theme-toggle');

// SVG Sun and Moon icons (inline, not external links)
const SVG_SUN = `
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <circle cx="14" cy="14" r="6" fill="#FFD600"/>
    <g stroke="#FFD600" stroke-width="2">
      <line x1="14" y1="3" x2="14" y2="0"/>
      <line x1="14" y1="25" x2="14" y2="28"/>
      <line x1="3" y1="14" x2="0" y2="14"/>
      <line x1="25" y1="14" x2="28" y2="14"/>
      <line x1="5.93" y1="5.93" x2="3.81" y2="3.81"/>
      <line x1="22.07" y1="22.07" x2="24.19" y2="24.19"/>
      <line x1="5.93" y1="22.07" x2="3.81" y2="24.19"/>
      <line x1="22.07" y1="5.93" x2="24.19" y2="3.81"/>
    </g>
  </svg>
`;
const SVG_MOON = `
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <path d="M21 16.7A9.7 9.7 0 0 1 11.3 7a7.4 7.4 0 1 0 9.7 9.7Z" fill="#FFD600"/>
  </svg>
`;

function updateThemeBtn() {
  if (document.body.classList.contains('day-mode')) {
    themeBtn.innerHTML = SVG_MOON;
    themeBtn.setAttribute('aria-label', 'Switch to night mode');
  } else {
    themeBtn.innerHTML = SVG_SUN;
    themeBtn.setAttribute('aria-label', 'Switch to day mode');
  }
}
themeBtn.onclick = function() {
  document.body.classList.toggle('day-mode');
  updateThemeBtn();
  localStorage.setItem('theme', document.body.classList.contains('day-mode') ? 'day' : 'night');
};
window.onload = function() {
  if(localStorage.getItem('theme')==='day') {
    document.body.classList.add('day-mode');
  }
  updateThemeBtn();
};
