import { TRACK_FILES } from "./tracks.js";
import { loadLibrary } from "./library.js";
import { createPlayer } from "./player.js";
import { storage } from "./storage.js";
import { initUI } from "./ui.js";

const loading = document.getElementById("loading");
const loadingText = document.getElementById("loadingText");
const loaderFill = document.getElementById("loaderFill");

try {
  const tracks = await loadLibrary(TRACK_FILES, (done, total) => {
    const pct = Math.round((done / total) * 100);
    if (loaderFill) loaderFill.style.width = `${pct}%`;
    loadingText.textContent = `Loading your library… ${done} / ${total}`;
  });
  const player = createPlayer(document.getElementById("audio"), tracks, storage);
  initUI({ player, storage });
  player.restore();
} catch (err) {
  console.error(err);
  loadingText.textContent = "Could not load the library. Serve this folder over HTTP.";
} finally {
  loading.classList.add("done");
}
