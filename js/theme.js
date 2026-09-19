function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d) % 6; break;
      case g: h = (b - r) / d + 2;   break;
      default: h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if      (h < 60)  [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else              [r, g, b] = [c, 0, x];
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function applyAccent(r, g, b) {
  const { h, s } = rgbToHsl(r, g, b);
  const lifted  = hslToRgb(h, Math.min(1, s + 0.1), 0.60);
  const second  = hslToRgb((h + 40) % 360, Math.min(1, s + 0.06), 0.64);
  const root = document.documentElement;
  root.style.setProperty("--accent",     `rgb(${lifted.r}, ${lifted.g}, ${lifted.b})`);
  root.style.setProperty("--accent-2",   `rgb(${second.r}, ${second.g}, ${second.b})`);
  root.style.setProperty("--accent-rgb", `${lifted.r}, ${lifted.g}, ${lifted.b}`);
  root.style.setProperty("--accent-soft",`rgba(${lifted.r}, ${lifted.g}, ${lifted.b}, 0.22)`);
}

export function resetTheme() {
  applyAccent(255, 77, 141);
}

export function applyThemeFromImage(imgEl) {
  if (!imgEl?.src) { resetTheme(); return; }

  const src = imgEl.src;

  function extractAndApply(img) {
    const size = 48;
    const canvas = document.createElement("canvas");
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, size, size);

    let { data } = ctx.getImageData(0, 0, size, size);
    let best = { score: -1, r: 255, g: 77, b: 141 };

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a < 140) continue;
      const { s, l } = rgbToHsl(r, g, b);
      if (l < 0.12 || l > 0.88 || s < 0.15) continue;
      const score = s * (1 - Math.abs(l - 0.50)) * 2.2;
      if (score > best.score) best = { score, r, g, b };
    }
    applyAccent(best.r, best.g, best.b);
  }

  if (imgEl.complete && imgEl.naturalWidth > 0) {
    try {
      extractAndApply(imgEl);
      return;
    } catch (_) { }
  }

  const fresh = new Image();
  fresh.crossOrigin = "anonymous";
  fresh.onload = () => {
    try { extractAndApply(fresh); }
    catch (_) { resetTheme(); }
  };
  fresh.onerror = () => resetTheme();
  fresh.src = src;
}

let visibleBg = "a";

export function setWallpaper(url) {
  const a = document.getElementById("bgA");
  const b = document.getElementById("bgB");
  const next = visibleBg === "a" ? b : a;
  const prev = visibleBg === "a" ? a : b;
  if (!url) {
    prev.classList.remove("visible");
    next.classList.remove("visible");
    return;
  }
  next.style.backgroundImage = `url("${url}")`;
  requestAnimationFrame(() => {
    next.classList.add("visible");
    prev.classList.remove("visible");
  });
  visibleBg = visibleBg === "a" ? "b" : "a";
}
