// SET YOUR M3U URL HERE
const m3uUrl = "https://allinonereborn.fun/playlist/opplex190.m3u";

let allChannels = [];
let currentCategory = 'All';
let searchQuery = '';

async function getM3U() {
  const lsKey = 'm3u_data';
  if (localStorage.getItem(lsKey)) {
    return localStorage.getItem(lsKey);
  }
  const res = await fetch(m3uUrl);
  if (!res.ok) throw new Error('Could not load M3U.');
  const m3uText = await res.text();
  localStorage.setItem(lsKey, m3uText);
  return m3uText;
}

function parseChannels(m3u) {
  const SVG_FALLBACK = 'https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg'; // Or use data URI SVG if you wish
  const lines = m3u.split('\n');
  const channels = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('#EXTINF')) {
      const name = line.substring(line.lastIndexOf(',') + 1).trim();
      if (!name || name.toLowerCase().includes('allinone')) continue;
      // Modified: allow tvg-logo to be empty string, fallback to SVG placeholder
      const logoMatch = line.match(/tvg-logo="([^"]*)"/); // <-- * matches empty too
      let logo = (logoMatch && logoMatch[1]) ? logoMatch[1].trim() : '';
      if (!logo) logo = SVG_FALLBACK;
      const groupMatch = line.match(/group-title="([^"]+)"/);
      const category = groupMatch ? groupMatch[1] : 'Other';
      const url = (i + 1 < lines.length) ? lines[i + 1].trim() : '';
      if (!url || url.startsWith('#')) continue;
      channels.push({ name, logo, category, url });
    }
  }
  return channels;
}

function renderCategoryBar(categories, selected) {
  const bar = document.getElementById('category-bar');
  bar.innerHTML = '';
  // Add "All" as first chip
  const allChip = document.createElement('button');
  allChip.className = 'category-chip' + (selected === 'All' ? ' selected' : '');
  allChip.textContent = "All";
  allChip.onclick = () => {
    currentCategory = 'All';
    renderChannels(allChannels);
    renderCategoryBar(categories, 'All');
  };
  bar.appendChild(allChip);

  categories.forEach(cat => {
    const chip = document.createElement('button');
    chip.className = 'category-chip' + (selected === cat ? ' selected' : '');
    chip.textContent = cat;
    chip.onclick = () => {
      currentCategory = cat;
      renderChannels(allChannels);
      renderCategoryBar(categories, cat);
    };
    bar.appendChild(chip);
  });
}

function renderChannels(channels) {
  const container = document.getElementById('channels');
  container.innerHTML = '';
  let filtered = channels;
  // Apply category filter
  if (currentCategory !== 'All') {
    filtered = filtered.filter(ch => ch.category === currentCategory);
  }
  // Apply search filter
  if (searchQuery.trim().length > 0) {
    const q = searchQuery.trim().toLowerCase();
    filtered = filtered.filter(ch => ch.name.toLowerCase().includes(q));
  }

  if (!filtered.length) {
    container.innerHTML = "<div style='color:#c00;text-align:center;margin-top:3em;'>No channels found.</div>";
    return;
  }
  filtered.forEach(ch => {
    const card = document.createElement('div');
    card.className = 'channel-card';
    card.innerHTML = `
      <img src="${ch.logo}" alt="${ch.name} Logo" class="channel-logo"
        onerror="this.src='https://via.placeholder.com/90x90?text=TV'">
      <div class="channel-name">${ch.name}</div>
    `;
    card.querySelector('.channel-logo').onclick =
    card.querySelector('.channel-name').onclick = () => {
      window.open(
        `player.html?url=${encodeURIComponent(ch.url)}&name=${encodeURIComponent(ch.name)}&poster=${encodeURIComponent(ch.logo)}`,
        '_blank'
      );
    };
    container.appendChild(card);
  });
}

// --- FIXED: properly structured async/await and error handling ---
async function loadChannels(forceRefresh=false) {
  if (forceRefresh) localStorage.removeItem('m3u_data');
  try {
    const m3uText = await getM3U();
    allChannels = parseChannels(m3uText);
    // Get unique categories
    const categories = Array.from(new Set(allChannels.map(ch => ch.category))).sort((a,b) => a.localeCompare(b));
    renderCategoryBar(categories, currentCategory);
    renderChannels(allChannels);
  } catch (e) {
    document.getElementById('channels').innerHTML = 
      `<div style="color:#ff5657;text-align:center;margin:4em;">${e.message}</div>`;
  }
}

document.getElementById('refresh-btn').onclick = () => {
  currentCategory = 'All'; // Optionally reset the category
  loadChannels(true); // true = force refresh M3U!
};

window.onload = () => {
  currentCategory = 'All';
  searchQuery = '';
  loadChannels();
  // Set up search box handler
  document.getElementById('search-box').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderChannels(allChannels);
  });
};
