# AEON / PRIVATE SUITE

A browser-playable **2D side-scrolling sci-fi suite exploration prototype** (Canvas + vanilla JavaScript).

- **Current deployment:** v0.8.8 Mobile Landscape (2026-11-19)
- **User-approved immutable baseline:** v0.8.7, archived at branch [`stable/v0.8.7`](https://github.com/wedgew00d/aeon-private-suite/tree/stable/v0.8.7)
- **Play:** https://wedgew00d.github.io/aeon-private-suite/

## What's new in v0.8.8

- Landscape-oriented, edge-to-edge mobile game viewport with the original **16:9 canvas aspect preserved** (letterbox areas on extra-wide phones).
- Left drag joystick for analog horizontal movement; swipe left/right from within the joystick ring.
- Right-side **DASH** (press/hold), **JUMP** (tap), **USE** (tap), plus a **pause** button.
- Simultaneous multi-touch for joystick + DASH + JUMP.
- Safe-area inset support for device notches and gestures; portrait orientation guidance.
- Higher-resolution backing canvas up to 1600 × 900 pixels on mobile, retaining original 1280 × 720 game world coordinates.
- Desktop controls, animations, mechanics, sprites and cyan afterimages unchanged.

## Repository structure

| Path | Purpose |
| --- | --- |
| `index.html` | GitHub Pages loader, reconstructs original v0.8.7 game and injects v0.8.8 mobile adapter |
| `mobile/mobile-v088.css` | Mobile viewport, layout, translucent joystick/action buttons |
| `mobile/mobile-v088.js` | Pointer/multitouch controls + device-aware backing resolution |
| `parts/part-00.txt` … `part-15.txt` | **Unmodified** UTF-8 chunks of the v0.8.7 standalone game (6.31 MB in total) |
| `scripts/rebuild_original.py` | Rebuilds the untouched standalone **v0.8.7** game from parts |
| `docs/AEON_v087_notes.md` | Japanese stable-baseline design and development handoff |
| `RELEASE_NOTES_v0.8.7.md` | Baseline release notes |
| `RELEASE_NOTES_v0.8.8.md` | Mobile adapter release notes |

The multipart storage is a transfer workaround for the GitHub integration, **not** a runtime game-engine dependency. The loader fetches the chunks and two small mobile adapter files over GitHub Pages. There are no external assets or third-party libraries. The base 0.8.7 bytes have not been altered.

### Play or test locally

- Open the standalone `AEON_Private_Suite_2D_v088_Mobile_Standalone.html` download in Chrome, Edge or Safari. It includes all imagery and the adapter in one HTML file, so it also works offline.
- For a local copy of this **repository**, run a local static HTTP server (`python3 -m http.server 8000`) and visit `http://localhost:8000/`. Opening this `index.html` with `file://` will typically block its `fetch` calls.
- To rebuild the exact v0.8.7 baseline, run `python3 scripts/rebuild_original.py`.

## Controls

| Desktop | Mobile landscape |
| --- | --- |
| A/D or ←/→: move | Left analog joystick: move left/right |
| Shift: dash | Hold DASH while moving |
| Space: jump | Tap JUMP |
| E/Enter: interact, close dialog | Tap USE |
| Esc: pause | Top center pause button |
| G: cyan afterimage intensity | Uses the approved STANDARD intensity |

### Design and QA notes

- First test at mobile landscape sizes 844×390, 915×412 and 667×375, portrait guidance at 390×844, desktop at 1280×800.
- Chromium touch emulation confirmed joystick analog input, DASH press/release, JUMP, and simultaneous three-touch movement + dash + jump with no JavaScript errors.
- Original physics and camera remain unchanged; only an optional touch axis is added for joystick input.
- The v0.8.7 baseline is **not overwritten**; use `stable/v0.8.7` as the recovery point.
- Safari/iOS browser and physical Android hardware behavior should be verified with real devices; browser emulation does not guarantee every platform quirk.
- GitHub Pages setup: **Settings → Pages → Deploy from a branch → main / (root)**.

No open-source license is implied for the original game art or code. Please do not add personal data, credentials, or secrets to this public repository.
