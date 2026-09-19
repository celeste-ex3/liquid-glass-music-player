function shuffleArray(list) {
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function createPlayer(audio, tracks, storage) {
  const byId = new Map(tracks.map((t) => [t.id, t]));
  const listeners = new Set();

  let queue = tracks.slice();
  let index = 0;
  let shuffle = storage.getShuffle();
  let repeat = storage.getRepeat();
  let playNext = [];
  let seeking = false;

  const emit = () => {
    const track = queue[index] || null;
    listeners.forEach((fn) => fn({
      track,
      playing: !audio.paused,
      shuffle,
      repeat,
      currentTime: audio.currentTime || 0,
      duration: audio.duration || track?.duration || 0,
      volume: Math.round(audio.volume * 100),
      muted: audio.muted,
    }));
  };

  let loadedId = null;

  function applySrc(track, resumeTime = 0) {
    if (!track) return;
    if (loadedId !== track.id) {
      audio.src = track.src;
      loadedId = track.id;
    }
    if (resumeTime) audio.currentTime = resumeTime;
    storage.setLastTrack(track.id);
  }

  async function playCurrent() {
    const track = queue[index];
    if (!track) return;
    applySrc(track);
    try {
      await audio.play();
    } catch (err) {
      console.warn(err);
    }
    storage.pushRecent(track.id);
    emit();
  }

  function rebuildShuffleKeepCurrent() {
    const current = queue[index];
    if (!shuffle) {
      queue = tracks.slice();
      index = current ? Math.max(0, queue.findIndex((t) => t.id === current.id)) : 0;
      return;
    }
    const rest = shuffleArray(tracks.filter((t) => t.id !== current?.id));
    queue = current ? [current, ...rest] : rest;
    index = 0;
  }

  audio.addEventListener("timeupdate", () => {
    if (!seeking) {
      storage.setLastTime(audio.currentTime || 0);
      emit();
    }
  });
  audio.addEventListener("loadedmetadata", emit);
  audio.addEventListener("play", emit);
  audio.addEventListener("pause", emit);
  audio.addEventListener("ended", () => {
    if (repeat === 2) {
      audio.currentTime = 0;
      audio.play();
      return;
    }
    if (playNext.length) {
      const id = playNext.shift();
      playId(id);
      return;
    }
    next(repeat === 1);
  });

  function playId(id, list) {
    if (list) queue = list.slice();
    const i = queue.findIndex((t) => t.id === id);
    if (i >= 0) {
      index = i;
    } else {
      const track = byId.get(id);
      if (!track) return;
      queue = [track, ...queue.filter((t) => t.id !== id)];
      index = 0;
    }
    applySrc(queue[index]);
    playCurrent();
  }

  function next(force) {
    if (playNext.length) {
      playId(playNext.shift());
      return;
    }
    if (index < queue.length - 1) {
      index += 1;
      applySrc(queue[index]);
      playCurrent();
    } else if (force || repeat === 1) {
      index = 0;
      applySrc(queue[index]);
      playCurrent();
    } else {
      audio.pause();
      emit();
    }
  }

  function prev() {
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      emit();
      return;
    }
    index = index > 0 ? index - 1 : queue.length - 1;
    applySrc(queue[index]);
    playCurrent();
  }

  const volume = storage.getVolume();
  audio.volume = volume / 100;
  audio.muted = storage.getMuted();

  return {
    onChange(fn) { listeners.add(fn); fn && emit(); return () => listeners.delete(fn); },
    getTrack() { return queue[index] || null; },
    getById(id) { return byId.get(id); },
    all() { return tracks; },
    playId,
    setQueue(list, startId) {
      queue = list.slice();
      if (startId) playId(startId);
    },
    toggle() {
      if (!queue[index]) {
        if (tracks[0]) playId(tracks[0].id, tracks);
        return;
      }
      if (audio.paused) playCurrent();
      else { audio.pause(); emit(); }
    },
    next: () => next(true),
    prev,
    seek(ratio) {
      if (!Number.isFinite(audio.duration)) return;
      audio.currentTime = ratio * audio.duration;
      emit();
    },
    setSeeking(v) { seeking = v; },
    setVolume(v) {
      audio.volume = v / 100;
      storage.setVolume(v);
      if (v > 0 && audio.muted) {
        audio.muted = false;
        storage.setMuted(false);
      }
      emit();
    },
    toggleMute() {
      audio.muted = !audio.muted;
      storage.setMuted(audio.muted);
      emit();
    },
    toggleShuffle() {
      shuffle = !shuffle;
      storage.setShuffle(shuffle);
      rebuildShuffleKeepCurrent();
      emit();
    },
    cycleRepeat() {
      repeat = (repeat + 1) % 3;
      storage.setRepeat(repeat);
      emit();
    },
    queuePlayNext(id) {
      playNext = playNext.filter((x) => x !== id);
      playNext.push(id);
    },
    isPlayNext(id) { return playNext.includes(id); },
    restore() {
      const last = storage.getLastTrack();
      const track = last && byId.get(last);
      if (track) {
        if (shuffle) {
          queue = [track, ...shuffleArray(tracks.filter((t) => t.id !== track.id))];
          index = 0;
        } else {
          queue = tracks.slice();
          index = Math.max(0, queue.findIndex((t) => t.id === track.id));
        }
        applySrc(track, storage.getLastTime() || 0);
      }
      emit();
    },
  };
}
