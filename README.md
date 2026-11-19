# AEON / PRIVATE SUITE

A browser-playable **2D sci-fi suite exploration prototype** (Canvas + vanilla JavaScript).

**User-approved stable baseline: v0.8.7, 2026-11-19.**

## Play

**https://wedgew00d.github.io/aeon-private-suite/**

Once GitHub Pages is set to **Deploy from a branch → `main` → `/(root)`**, this URL plays the exact v0.8.7 game. No install required.

### Why `parts/` instead of one huge HTML?

The approved standalone build is 6.31 MB; the GitHub connector could not transfer it as a single payload. It was therefore split *without editing the game*, and the root `index.html` reassembles it at page load. This is a **delivery workaround, not an animation/gameplay modification**.

- `index.html` — ~2 KB GitHub Pages bootstrap; fetches `parts/part-00.txt`–`part-15.txt` then loads the untouched v0.8.7 game.
- `parts/` — 16 exact UTF-8 segments of the original standalone HTML, in order.
- `scripts/rebuild_original.py` — restores a byte-identical original HTML for offline use (including all embedded assets).
- `docs/AEON_v087_notes.md` — original Japanese development handoff and lessons.
- `RELEASE_NOTES_v0.8.7.md` — approved release facts.

**Original game's SHA-256:** `330ba7e2fce0862b15ca759d35ae4b0732b19586131422f04ecb4e04dd53aabf`

Restore and test the standalone original locally:

```bash
python3 scripts/rebuild_original.py
# open dist/index.html in Chrome / Edge
```

For GitHub Pages, keep the 16 parts and the bootstrap; it works with branch-based Pages directly, without Actions or a build system. Do not run the loader from a `file://` URL, since browsers normally block local `fetch` requests. Use the rebuilt `dist/index.html` for offline play.

## Controls

- **A / D**, **← / →** — move
- **Shift** — dash
- **Space** — jump
- **E** / **Enter** — interact / dialogue
- **G** — cyan afterimage strength (OFF / SOFT / STANDARD / BRIGHT)
- **Esc** — pause

## Development guidelines

This user-approved v0.8.7 build is an **immutable baseline**. Implement new work on separate branches and preserve the original stable build. Read [the Japanese project notes](docs/AEON_v087_notes.md) before making changes.

- v0.8.1-derived walk and dash keyframe hold timing.
- STANDARD cyan dash/jump afterimages.
- Far-arm hologram interaction with stable feet, no machine/monitor.
- 2D bone RIG experiment is paused; use sprites as the main path.

## GitHub Pages settings

Repository **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `/(root)` → Save**.

This is a **public** repository for link-based browser play and AI code collaboration. Do not commit secrets, personal data, or unreleased private source. The repository does not grant an open-source license for the original game art and software.
