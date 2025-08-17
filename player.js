// Prevent double-tap-to-zoom (useful for full-screen video)
document.body.addEventListener('touchstart', function(e){
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });

// Helper: get query parameters
function getParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

// Example: ?channel_id=example or ?url=directlink
const channelId = getParam("channel_id");
const directUrl = getParam("url");

const channelName = getParam("name") ? decodeURIComponent(getParam("name")) : "Example Channel";
const posterImg = getParam("poster") || "https://via.placeholder.com/720?text=No+Poster";

// Set channel title
document.getElementById("channel-title").textContent = channelName;

// Responsive mobile aspect ratio handling
function responsiveResize() {
  try {
    var wrap = document.getElementById('player-wrap');
    var w = wrap.offsetWidth;
    wrap.style.height = (w * 9 / 16) + "px";
  } catch (e) {}
}
window.addEventListener('resize', responsiveResize);
setTimeout(responsiveResize, 150);
setTimeout(responsiveResize, 1500);

// Utility: Hide Telegram button when playing
function hideTelegramBtn() {
  var tgBtn = document.querySelector('.tg-float-btn');
  if (tgBtn) tgBtn.style.display = 'none';
}

// Main: Fetch the stream URL
async function getStreamUrl() {
  if (directUrl && directUrl.startsWith("http")) {
    // Insecure, direct mode
    return directUrl;
  }
  if (channelId) {
    // Secure, fetch from backend
    try {
      const res = await fetch(`/api/get_stream_url?channel_id=${encodeURIComponent(channelId)}`);
      if (!res.ok) throw new Error("Channel not found");
      const data = await res.json();
      if (!data.url || !data.url.startsWith("http")) throw new Error("Invalid stream URL");
      return data.url;
    } catch (err) {
      throw new Error(err.message || "Stream fetch failed");
    }
  }
  throw new Error("No stream link provided!");
}

// Build player
getStreamUrl()
  .then(streamURL => {
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
        labels: { 0: "Low", 1: "SD", 2: "HD" }
      },
      disableKeyboardShortcuts: false,
      disableContextMenu: true,
      playback: {
        hlsjsConfig: { debug: false }
      }
    });

    // Error handling
    player.on(Clappr.Events.PLAYER_ERROR, function(e){
      document.getElementById('error-msg').textContent =
        "Failed to play channel: " + (e && e.message ? e.message : "Stream may be offline or geo-blocked.");
    });

    // Hide telegram btn on play
    player.on(Clappr.Events.PLAYER_PLAY, function(){
      document.getElementById('error-msg').textContent = '';
      hideTelegramBtn();
    });

    // Media errors (hls.js)
    player.core.activePlayback.on('error', function(e){
      document.getElementById('error-msg').textContent =
        "Streaming error: " + (e && e.message ? e.message : "Non-fatal streaming issue occurred.");
    });

  })
  .catch(err => {
    document.getElementById("error-msg").textContent = err.message;
  });
      
