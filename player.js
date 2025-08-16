
// prevent double-tap-to-zoom (useful for full-screen video)
document.body.addEventListener('touchstart', function(e){
  if (e.touches.length > 1) e.preventDefault();
}, {passive:false});

// Helper: get query parameters
function getParam(name){
  const params = new URLSearchParams(location.search);
  return params.get(name);
}
// Get params or default
const streamURL   = getParam("url") || "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";
const channelName = getParam("name") ? decodeURIComponent(getParam("name")) : "Example Channel";
const posterImg   = getParam("poster") || "https://via.placeholder.com/720?text=No+Poster";

document.getElementById("channel-title").textContent = channelName;

// Validate URL
if (!streamURL || !streamURL.startsWith("http")) {
  document.getElementById("error-msg").textContent = "Invalid or missing channel URL!";
} else {
  // Build the player
  var player = new Clappr.Player({
    source: streamURL,
    mimeType: "application/x-mpegURL",
    poster: posterImg,
    parentId: "#player",
    autoPlay: false,
    mute: false,
    width: "100%",
    height: "100%",
    plugins: [LevelSelector],
    levelSelectorConfig: {
      title: "Quality",
      labels: { 0: "Low", 1: "SD", 2: "HD" },
    },
    disableKeyboardShortcuts: false,
    disableContextMenu: true,
    playback: {
      hlsjsConfig: {
        debug: false // suppress HLS.js logs
      }
    }
  });

  // Listen for player or playback errors and update UI
  player.on(Clappr.Events.PLAYER_ERROR, function(e){
    document.getElementById('error-msg').textContent =
      "Failed to play channel: " + (e && e.message ? e.message : "Stream may be offline or geo-blocked.");
  });
  player.on(Clappr.Events.PLAYER_PLAY, function(){
    document.getElementById('error-msg').textContent = '';
  });

  // Listen for media/hls.js errors and show user-friendly message
  player.core.activePlayback.on('error', function(e){
    document.getElementById('error-msg').textContent =
      "Streaming error: " + (e && e.message ? e.message : "Non-fatal streaming issue occurred.");
  });

  // Responsive mobile aspect ratio handling
  function responsiveResize() {
    try {
      var wrap = document.getElementById('player-wrap');
      var w = wrap.offsetWidth;
      wrap.style.height = (w * 9 / 16) + "px";
    } catch(e){}
  }
  window.addEventListener('resize', responsiveResize);
  setTimeout(responsiveResize, 150);
  setTimeout(responsiveResize, 1500);
}
