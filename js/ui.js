import { applyThemeFromImage, resetTheme, setWallpaper } from "./theme.js";

const ICONS = {
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  next: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  play: `<path d="M8 5v14l11-7z"/>`,
  pause: `<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>`,
  vol: `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>`,
  mute: `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>`,
  list: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>`,
};

function fmt(t) {
  if (!Number.isFinite(t) || t < 0) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function toast(msg) {
  const host = document.getElementById("toasts");
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `${ICONS.list}<span></span>`;
  el.querySelector("span").textContent = msg;
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 280);
  }, 2200);
}

function showModal({ title, desc, confirm, danger, input, placeholder, icon }) {
  const backdrop = document.getElementById("modalBackdrop");
  const inputEl = document.getElementById("modalInput");
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalDesc").textContent = desc || "";
  document.getElementById("modalIcon").innerHTML = icon || ICONS.list;
  const confirmBtn = document.getElementById("modalConfirm");
  confirmBtn.textContent = confirm || "Confirm";
  confirmBtn.classList.toggle("danger", !!danger);
  confirmBtn.classList.toggle("primary", !danger);
  inputEl.style.display = input ? "block" : "none";
  inputEl.value = "";
  inputEl.placeholder = placeholder || "";
  backdrop.classList.add("open");
  if (input) setTimeout(() => inputEl.focus(), 50);

  return new Promise((resolve) => {
    const done = (value) => {
      backdrop.classList.remove("open");
      document.getElementById("modalCancel").onclick = null;
      confirmBtn.onclick = null;
      resolve(value);
    };
    document.getElementById("modalCancel").onclick = () => done(null);
    confirmBtn.onclick = () => done(input ? inputEl.value.trim() : true);
    inputEl.onkeydown = (e) => {
      if (e.key === "Enter") confirmBtn.click();
      if (e.key === "Escape") done(null);
    };
  });
}

export function initUI({ player, storage }) {
  const app = document.getElementById("app");
  const cover = document.getElementById("cover");
  const coverPlaceholder = document.getElementById("coverPlaceholder");
  const titleEl = document.getElementById("title");
  const artistEl = document.getElementById("artist");
  const seek = document.getElementById("seek");
  const currentEl = document.getElementById("current");
  const durationEl = document.getElementById("duration");
  const playIcon = document.getElementById("playIcon");
  const miniPlayIcon = document.getElementById("miniPlayIcon");
  const shuffleBtn = document.getElementById("shuffle");
  const repeatBtn = document.getElementById("repeat");
  const repeatBadge = document.getElementById("repeatBadge");
  const favBtn = document.getElementById("favBtn");
  const volume = document.getElementById("volume");
  const muteBtn = document.getElementById("muteBtn");
  const muteIcon = document.getElementById("muteIcon");
  const mini = document.getElementById("mini");
  const popover = document.getElementById("popover");
  const searchInput = document.getElementById("searchInput");
  const searchWrap = document.getElementById("searchWrap");

  let tab = "now";
  let libraryFilter = "all";
  let activePlaylistId = null;
  let lastCover = "";

  function setTab(name) {
    tab = name;
    document.querySelectorAll(".tab").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === name);
    });
    document.querySelectorAll(".view").forEach((view) => {
      view.classList.toggle("active", view.dataset.view === name);
    });
    const showMini = name !== "now" && !!player.getTrack();
    app.classList.toggle("show-mini", showMini);
    mini.hidden = !showMini;
    if (name === "search") searchInput.focus();
  }

  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => setTab(btn.dataset.tab));
  });

  mini.addEventListener("click", (e) => {
    if (e.target.closest("#miniPlay")) {
      e.stopPropagation();
      player.toggle();
      return;
    }
    setTab("now");
  });

  document.getElementById("play").onclick = () => player.toggle();
  document.getElementById("prev").onclick = () => player.prev();
  document.getElementById("next").onclick = () => player.next();
  shuffleBtn.onclick = () => player.toggleShuffle();
  repeatBtn.onclick = () => player.cycleRepeat();
  favBtn.onclick = () => {
    const track = player.getTrack();
    if (!track) return;
    const on = storage.toggleFavorite(track.id);
    favBtn.classList.toggle("on", on);
    renderLists();
  };
  muteBtn.onclick = () => player.toggleMute();
  volume.oninput = () => player.setVolume(Number(volume.value));

  seek.addEventListener("pointerdown", () => player.setSeeking(true));
  seek.addEventListener("pointerup", () => player.setSeeking(false));
  seek.addEventListener("input", () => {
    const p = Number(seek.value) / 10;
    seek.style.setProperty("--p", `${p}%`);
    player.seek(p / 100);
  });

  searchInput.addEventListener("input", () => {
    searchWrap.classList.toggle("has-text", !!searchInput.value);
    renderSearch();
  });
  document.getElementById("searchClear").onclick = () => {
    searchInput.value = "";
    searchWrap.classList.remove("has-text");
    renderSearch();
  };

  document.getElementById("libraryChips").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    libraryFilter = chip.dataset.filter;
    activePlaylistId = null;
    document.querySelectorAll("#libraryChips .chip").forEach((c) => c.classList.toggle("active", c === chip));
    renderLibrary();
  });

  document.getElementById("newPlaylistBtn").onclick = async () => {
    const name = await showModal({
      title: "New playlist",
      desc: "Give it a name.",
      confirm: "Create",
      input: true,
      placeholder: "Late night mix",
      icon: ICONS.plus,
    });
    if (!name) return;
    const list = storage.getPlaylists();
    list.push({ id: crypto.randomUUID(), name, trackIds: [] });
    storage.setPlaylists(list);
    renderPlaylists();
    toast("Playlist created");
  };

  let playerSnapshot = null;

  function syncNow(state) {
    playerSnapshot = state;
    const { track, playing, shuffle, repeat, currentTime, duration, volume: vol, muted } = state;
    titleEl.textContent = track?.title || "Nothing playing";
    artistEl.textContent = track?.artist || "Select a track from your library";
    document.getElementById("miniTitle").textContent = track?.title || "Nothing playing";
    document.getElementById("miniArtist").textContent = track?.artist || "—";

    playIcon.innerHTML = playing ? ICONS.pause : ICONS.play;
    miniPlayIcon.innerHTML = playing ? ICONS.pause : ICONS.play;
    document.getElementById("play").setAttribute("aria-label", playing ? "Pause" : "Play");

    shuffleBtn.classList.toggle("on", shuffle);
    repeatBtn.classList.toggle("on", repeat > 0);
    repeatBadge.textContent = repeat === 2 ? "1" : "";

    const fav = track ? storage.isFavorite(track.id) : false;
    favBtn.classList.toggle("on", fav);

    currentEl.textContent = fmt(currentTime);
    durationEl.textContent = fmt(duration);
    const p = duration ? (currentTime / duration) * 100 : 0;
    seek.value = String(p * 10);
    seek.style.setProperty("--p", `${p}%`);

    volume.value = String(vol);
    muteBtn.classList.toggle("muted", muted);
    muteIcon.innerHTML = muted || vol === 0 ? ICONS.mute : ICONS.vol;

    const showMini = tab !== "now" && !!track;
    app.classList.toggle("show-mini", showMini);
    mini.hidden = !showMini;

    const coverUrl = track?.coverUrl || "";
    if (coverUrl !== lastCover) {
      lastCover = coverUrl;
      cover.classList.add("swap");
      setTimeout(() => {
        if (coverUrl) {
          cover.src = coverUrl;
          cover.style.display = "block";
          coverPlaceholder.style.display = "none";
          document.getElementById("miniCover").style.backgroundImage = `url("${coverUrl}")`;
          // applyThemeFromImage handles crossOrigin re-load internally
          cover.onload = () => applyThemeFromImage(cover);
        } else {
          cover.removeAttribute("src");
          cover.style.display = "none";
          coverPlaceholder.style.display = "grid";
          document.getElementById("miniCover").style.backgroundImage = "";
          resetTheme();
        }
        setWallpaper(coverUrl);
        cover.classList.remove("swap");
      }, 160);
    }

    highlightPlaying(track?.id);
  }

  function trackButtons(track) {
    const favOn = storage.isFavorite(track.id);
    const nextOn = player.isPlayNext(track.id);
    return `
      <button class="track-btn fav ${favOn ? "fav-on is-active" : ""}" data-act="fav" data-id="${track.id}" aria-label="Favorite">${ICONS.heart}</button>
      <button class="track-btn ${nextOn ? "is-active" : ""}" data-act="next" data-id="${track.id}" aria-label="Play next">${ICONS.next}</button>
      <button class="track-btn" data-act="add" data-id="${track.id}" aria-label="Add to playlist">${ICONS.plus}</button>
    `;
  }

  function row(track, playingId) {
    const thumb = track.coverUrl
      ? `style="background-image:url('${track.coverUrl}')"`
      : "";
    return `<li class="track${track.id === playingId ? " playing" : ""}" data-id="${track.id}">
      <div class="track-thumb" ${thumb}></div>
      <div class="track-meta">
        <div class="track-title"></div>
        <div class="track-artist"></div>
      </div>
      ${trackButtons(track)}
    </li>`;
  }

  function fillList(ul, tracks) {
    const playingId = player.getTrack()?.id;
    if (!tracks.length) {
      ul.innerHTML = `<li class="empty-state">Nothing here yet.</li>`;
      return;
    }
    ul.innerHTML = tracks.map((t) => row(t, playingId)).join("");
    [...ul.querySelectorAll(".track")].forEach((el, i) => {
      const track = tracks[i];
      if (!track) return;
      el.querySelector(".track-title").textContent = track.title;
      el.querySelector(".track-artist").textContent = track.artist;
    });
  }

  function libraryTracks() {
    const all = player.all();
    if (activePlaylistId) {
      const pl = storage.getPlaylists().find((p) => p.id === activePlaylistId);
      return (pl?.trackIds || []).map((id) => player.getById(id)).filter(Boolean);
    }
    if (libraryFilter === "recent") {
      return storage.getRecents().map((id) => player.getById(id)).filter(Boolean);
    }
    return all;
  }

  function renderLibrary() {
    fillList(document.getElementById("libraryList"), libraryTracks());
  }

  function renderFavorites() {
    const tracks = storage.getFavorites().map((id) => player.getById(id)).filter(Boolean);
    fillList(document.getElementById("favoritesList"), tracks);
  }

  function renderSearch() {
    const q = searchInput.value.trim().toLowerCase();
    const tracks = q
      ? player.all().filter((t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q))
      : player.all();
    fillList(document.getElementById("searchList"), tracks);
  }

  function renderPlaylists() {
    const host = document.getElementById("playlistList");
    const list = storage.getPlaylists();
    if (!list.length) {
      host.innerHTML = "";
      return;
    }
    host.innerHTML = list.map((p) => `
      <li class="playlist-item${p.id === activePlaylistId ? " active" : ""}" data-id="${p.id}">
        <span></span>
        <button class="del" data-del="${p.id}" aria-label="Delete playlist">${ICONS.trash}</button>
      </li>`).join("");
    [...host.querySelectorAll(".playlist-item")].forEach((el, i) => {
      el.querySelector("span").textContent = list[i].name;
    });
  }

  function renderLists() {
    renderPlaylists();
    renderLibrary();
    renderFavorites();
    renderSearch();
  }

  function highlightPlaying(id) {
    document.querySelectorAll(".track").forEach((el) => {
      el.classList.toggle("playing", el.dataset.id === id);
    });
  }

  function bindList(ul) {
    ul.addEventListener("click", (e) => {
      const btn = e.target.closest(".track-btn");
      const rowEl = e.target.closest(".track");
      if (!rowEl) return;
      const id = rowEl.dataset.id;
      if (btn) {
        e.stopPropagation();
        const act = btn.dataset.act;
        if (act === "fav") {
          storage.toggleFavorite(id);
          renderLists();
          if (playerSnapshot) syncNow({ ...playerSnapshot });
        } else if (act === "next") {
          player.queuePlayNext(id);
          toast("Queued to play next");
          renderLists();
        } else if (act === "add") {
          openPlaylistPopover(btn, id);
        }
        return;
      }
      const source = ul.id === "libraryList" ? libraryTracks() : (
        ul.id === "favoritesList"
          ? storage.getFavorites().map((x) => player.getById(x)).filter(Boolean)
          : player.all()
      );
      player.setQueue(source.length ? source : player.all(), id);
    });
  }

  bindList(document.getElementById("libraryList"));
  bindList(document.getElementById("favoritesList"));
  bindList(document.getElementById("searchList"));

  document.getElementById("playlistList").addEventListener("click", async (e) => {
    const del = e.target.closest("[data-del]");
    if (del) {
      e.stopPropagation();
      const ok = await showModal({
        title: "Delete playlist?",
        desc: "This cannot be undone.",
        confirm: "Delete",
        danger: true,
        icon: ICONS.trash,
      });
      if (!ok) return;
      const next = storage.getPlaylists().filter((p) => p.id !== del.dataset.del);
      storage.setPlaylists(next);
      if (activePlaylistId === del.dataset.del) activePlaylistId = null;
      renderLists();
      return;
    }
    const item = e.target.closest(".playlist-item");
    if (!item) return;
    activePlaylistId = item.dataset.id;
    libraryFilter = "playlist";
    document.querySelectorAll("#libraryChips .chip").forEach((c) => c.classList.remove("active"));
    renderLists();
  });

  function openPlaylistPopover(anchor, trackId) {
    const lists = storage.getPlaylists();
    popover.innerHTML = `<div class="popover-head">Add to playlist</div>` + (
      lists.length
        ? lists.map((p) => {
          const on = p.trackIds.includes(trackId);
          return `<div class="popover-row${on ? " checked" : ""}" data-pl="${p.id}">
            <span class="check">${ICONS.check}</span><span></span>
          </div>`;
        }).join("")
        : `<div class="popover-row" data-new="1"><span>Create playlist…</span></div>`
    );
    [...popover.querySelectorAll(".popover-row span:last-child")].forEach((el, i) => {
      if (lists[i]) el.textContent = lists[i].name;
    });
    const rect = anchor.getBoundingClientRect();
    popover.style.left = `${Math.min(rect.left, window.innerWidth - 240)}px`;
    popover.style.top = `${Math.min(rect.bottom + 6, window.innerHeight - 80)}px`;
    popover.classList.add("open");
    popover.onclick = async (ev) => {
      const row = ev.target.closest(".popover-row");
      if (!row) return;
      if (row.dataset.new) {
        popover.classList.remove("open");
        document.getElementById("newPlaylistBtn").click();
        return;
      }
      const listsNow = storage.getPlaylists();
      const pl = listsNow.find((p) => p.id === row.dataset.pl);
      if (!pl) return;
      if (pl.trackIds.includes(trackId)) pl.trackIds = pl.trackIds.filter((x) => x !== trackId);
      else pl.trackIds.push(trackId);
      storage.setPlaylists(listsNow);
      popover.classList.remove("open");
      renderLists();
      toast("Playlist updated");
    };
  }

  document.addEventListener("click", (e) => {
    if (!popover.contains(e.target)) popover.classList.remove("open");
  });

  document.addEventListener("keydown", (e) => {
    const typing = /input|textarea/i.test(e.target.tagName);
    if (typing) return;
    if (e.code === "Space") { e.preventDefault(); player.toggle(); }
    if (e.key === "f" || e.key === "F") favBtn.click();
    if (e.key === "m" || e.key === "M") player.toggleMute();
    if (e.key === "s" || e.key === "S") player.toggleShuffle();
    if (e.key === "r" || e.key === "R") player.cycleRepeat();
    if (e.key === "ArrowRight" && e.shiftKey) player.next();
    else if (e.key === "ArrowLeft" && e.shiftKey) player.prev();
    else if (e.key === "ArrowRight") player.seek(Math.min(1, ((playerSnapshot?.currentTime || 0) + 5) / (playerSnapshot?.duration || 1)));
    else if (e.key === "ArrowLeft") player.seek(Math.max(0, ((playerSnapshot?.currentTime || 0) - 5) / (playerSnapshot?.duration || 1)));
  });

  player.onChange(syncNow);
  renderLists();
  setTab("now");
}
