const PREFIX = "lgmp.";

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

export const storage = {
  getFavorites() { return read("favorites", []); },
  setFavorites(ids) { write("favorites", ids); },
  isFavorite(id) { return this.getFavorites().includes(id); },
  toggleFavorite(id) {
    const set = new Set(this.getFavorites());
    if (set.has(id)) set.delete(id); else set.add(id);
    const next = [...set];
    this.setFavorites(next);
    return set.has(id);
  },

  getPlaylists() { return read("playlists", []); },
  setPlaylists(list) { write("playlists", list); },

  getRecents() { return read("recents", []); },
  pushRecent(id) {
    const next = [id, ...this.getRecents().filter((x) => x !== id)].slice(0, 40);
    write("recents", next);
  },

  getVolume() { return read("volume", 80); },
  setVolume(v) { write("volume", v); },
  getMuted() { return read("muted", false); },
  setMuted(v) { write("muted", v); },

  getShuffle() { return read("shuffle", false); },
  setShuffle(v) { write("shuffle", v); },
  getRepeat() { return read("repeat", 0); },
  setRepeat(v) { write("repeat", v); },

  getLastTrack() { return read("lastTrack", null); },
  setLastTrack(id) { write("lastTrack", id); },
  getLastTime() { return read("lastTime", 0); },
  setLastTime(t) { write("lastTime", t); },
};
