# Liquid Glass Music Player

A sleek and modern web music player with dynamic album art theming, smart metadata parsing, and a stunning liquid glass UI. Built with vanilla HTML, CSS, and JavaScript. No frameworks, no build step, just clean code.

<img width="1920" height="901" alt="Screenshot 2026-09-20 at 16-54-50 Liquid Glass Music" src="https://github.com/user-attachments/assets/bcd0ab79-5d11-4d8f-a49f-912e50905d4f" />

## Features

- Liquid glass UI with backdrop blur and layered highlights
- Dynamic theming: extracts dominant colors from album art to set accent colors in real time
- Immersive blurred background that transitions smoothly with each track
- Smart metadata parsing: reads embedded ID3 tags using jsmediatags
- Fallback to iTunes Search API for missing titles, artists, albums, and high resolution cover art
- Library management: All Songs, Recently Played, Favorites, Search, and Custom Playlists
- Advanced playback: Shuffle, Repeat (Off, All, One), Play Next queue, Seek, Volume control, Mute
- Persistence: saves volume, mute state, shuffle, repeat, last track, and playback time to localStorage
- Mini player when navigating away from the Now Playing view
- Full keyboard support for all controls
- Accessible: ARIA labels, focus states, reduced motion support
- Responsive design that adapts to any screen size
- Loading screen with progress bar and liquid orb animation

## Tech Stack

- HTML5
- CSS3 (custom properties, flexbox, grid, backdrop-filter, CSS animations)
- Vanilla JavaScript (ES6 modules)
- jsmediatags for embedded ID3 metadata
- iTunes Search API for metadata fallback and high resolution cover art
- localStorage for persistence
- Web Audio API for playback

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play / Pause |
| F | Toggle Favorite |
| M | Mute / Unmute |
| S | Toggle Shuffle |
| R | Cycle Repeat (Off, All, One) |
| Shift + Right Arrow | Next Track |
| Shift + Left Arrow | Previous Track |
| Right Arrow | Seek Forward 5s |
| Left Arrow | Seek Backward 5s |

## Accessibility

- All controls have descriptive `aria-label` attributes
- Focus states are clearly visible with high-contrast outlines
- `prefers-reduced-motion` is respected to disable animations for sensitive users
- Display uses `aria-live` for screen reader announcements
- Semantic HTML structure

## Project Structure

.
├── index.html
├── css/
│   ├── tokens.css
│   ├── glass.css
│   ├── layout.css
│   ├── player.css
│   ├── library.css
│   └── overlays.css
├── js/
│   ├── main.js
│   ├── library.js
│   ├── player.js
│   ├── storage.js
│   ├── theme.js
│   ├── tracks.js
│   └── ui.js
└── assets/
    ├── audio/
    │   └── (your audio files)
    └── img/
        └── spotify.png


## Installation

Because this project uses ES6 modules and fetches metadata over HTTP, you need to serve it through a local server. Opening `index.html` directly in your browser will not work due to CORS restrictions.

```bash
git clone https://github.com/celeste-ex3/liquid-glass-music-player.git
cd liquid-glass-music-player
```

**Then serve the folder using any of these methods:**

- VS Code: Install the Live Server extension, right-click `index.html`, and select "Open with Live Server"
- Python: `python -m http.server 8000`
- Node.js: `npx serve`
Then open `http://localhost:8000` in your browser.

## Adding Your Own Music
1. Drop your audio files into the `assets/audio/` folder.
2. Open `js/tracks.js` and add the file paths to the `TRACK_FILES` array.
3. The player will automatically parse embedded metadata using jsmediatags.
4. If metadata is missing, it will fall back to the iTunes API based on the filename format `Artist - Title.mp3`

## Contact

- GitHub: ![@celeste-ex3](github.com/celeste-ex3)
- LinkedIn: ![@safyankhan](linkedin.com/in/safyankhan/)
