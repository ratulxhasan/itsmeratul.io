function getParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name) || '';
}

const channelName = getParam('name');
const streamUrl = getParam('url');
const posterUrl = getParam('poster'); // Now receives channel logo

document.getElementById('channel-title').textContent = channelName || "Channel";

if (streamUrl) {
  // Use channel logo if present; else fallback placeholder
  const splash = posterUrl || "https://placehold.co/600x338/222254/FFFB00?text=No+Poster";

  const player = new Clappr.Player({
    source: streamUrl,
    parentId: '#player',
    height: 320,
    width: '100%',
    autoPlay: true,
    plugins: [LevelSelector],
    levelSelectorConfig: { title: 'Quality' },
    poster: splash,
    mute: false,
  });
} else {
  document.getElementById('error-msg').textContent = "No stream URL specified!";
}
