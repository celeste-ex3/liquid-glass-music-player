function fileToUrl(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function parseFilename(path) {
  const basename = path.split("/").pop() || "";
  const stem = basename.replace(/\.(mp3|m4a|wav|flac|ogg)$/i, "").trim();
  const dashMatch = stem.match(/^(.+?)\s*[-]\s*(.+)$/);
  if (dashMatch) {
    return { displayTitle: stem, title: dashMatch[2].trim(), artist: dashMatch[1].trim() };
  }
  return { displayTitle: stem, title: stem, artist: "" };
}

const itunesCache = new Map();

async function lookupITunes(title, artist) {
  const query = artist ? `${artist} ${title}` : title;
  const cacheKey = query.toLowerCase();
  if (itunesCache.has(cacheKey)) return itunesCache.get(cacheKey);

  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=5`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("iTunes API error");
    const json = await res.json();

    const titleLow = title.toLowerCase();
    const artistLow = (artist || "").toLowerCase();
    let best = json.results?.[0] || null;

    if (json.results?.length > 1) {
      const scored = json.results.map((r) => {
        let score = 0;
        const rTitle = (r.trackName || "").toLowerCase();
        const rArtist = (r.artistName || "").toLowerCase();
        if (rTitle.includes(titleLow) || titleLow.includes(rTitle)) score += 3;
        if (artistLow && (rArtist.includes(artistLow) || artistLow.includes(rArtist))) score += 2;
        return { r, score };
      });
      scored.sort((a, b) => b.score - a.score);
      best = scored[0].r;
    }

    const result = best
      ? {
          title: best.trackName || null,
          artist: best.artistName || null,
          album: best.collectionName || null,
          coverUrl: best.artworkUrl100
            ? best.artworkUrl100.replace("100x100bb", "600x600bb")
            : null,
          duration: best.trackTimeMillis ? best.trackTimeMillis / 1000 : 0,
        }
      : null;

    itunesCache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.warn("[iTunes]", err.message);
    itunesCache.set(cacheKey, null);
    return null;
  }
}

async function readEmbeddedMetadata(path) {
  if (!window.jsmediatags) {
    return null;
  }

  return new Promise(async (resolve) => {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        resolve(null);
        return;
      }
      
      const blob = await response.blob();
      
      window.jsmediatags.read(blob, {
        onSuccess: (tag) => {
          try {
            const tags = tag.tags;
            let coverUrl = "";
            
            if (tags.picture) {
              const { data, format } = tags.picture;
              const byteArray = new Uint8Array(data);
              let binary = '';
              const len = byteArray.byteLength;
              for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(byteArray[i]);
              }
              coverUrl = `data:${format};base64,${btoa(binary)}`;
            }

            resolve({
              title: tags.title || null,
              artist: tags.artist || null,
              album: tags.album || null,
              coverUrl: coverUrl || null,
              year: tags.year || null,
            });
          } catch (err) {
            console.warn("[Metadata] Tag parsing error:", err);
            resolve(null);
          }
        },
        onError: (error) => {
          console.warn("[Metadata] Read error:", error.type, error.info);
          resolve(null);
        }
      });
    } catch (err) {
      console.warn("[Metadata] Fetch error:", err);
      resolve(null);
    }
  });
}

async function buildTrack(path) {
  const url = fileToUrl(path);
  const { displayTitle, title, artist } = parseFilename(path);
  
  const embedded = await readEmbeddedMetadata(path);
  
  if (embedded && embedded.title && embedded.artist) {
    return {
      id: path,
      src: url,
      title: embedded.title,
      artist: embedded.artist,
      album: embedded.album || "",
      duration: 0,
      coverUrl: embedded.coverUrl || "",
    };
  }
  
  const itunes = await lookupITunes(title, artist);

  return {
    id: path,
    src: url,
    title: itunes?.title || embedded?.title || displayTitle,
    artist: itunes?.artist || embedded?.artist || artist || "Unknown artist",
    album: itunes?.album || embedded?.album || "",
    duration: itunes?.duration || 0,
    coverUrl: itunes?.coverUrl || embedded?.coverUrl || "",
  };
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

export async function loadLibrary(paths, onProgress) {
  const total = paths.length;
  let done = 0;

  const tracks = await mapLimit(paths, 6, async (path) => {
    try {
      return await buildTrack(path);
    } catch (err) {
      console.warn("[loadLibrary]", err);
      const { displayTitle, artist } = parseFilename(path);
      return {
        id: path,
        src: fileToUrl(path),
        title: displayTitle,
        artist: artist || "Unknown artist",
        album: "",
        duration: 0,
        coverUrl: "",
      };
    } finally {
      done += 1;
      onProgress?.(done, total);
    }
  });

  return tracks;
}
