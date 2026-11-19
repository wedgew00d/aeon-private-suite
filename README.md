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

## Development policy — MOBILE SUPPORT IS MANDATORY (2026-11-19)

**User-approved requirement: every future AEON version, new feature, UI change, and refactor MUST continue to support mobile landscape play, in addition to desktop.** Mobile support is a release criterion, not an optional follow-up enhancement.

- **Layout:** landscape-first responsive browser game; preserve the 16:9 gameplay aspect, fit within different viewport sizes, respect notches/safe-area insets, and avoid cut-off HUD/actions.
- **Mobile controls:** left analog touch joystick; right-side **DASH** (hold), **JUMP** (tap), **USE/interact** (tap), and an accessible pause action. Keep simultaneous multi-touch input (joystick + dash + jump) working.
- **Compatibility:** retain desktop keyboard controls as well; new mechanics must have discoverable, usable touch equivalents. Do not require a physical keyboard, mouse hover, or desktop-only interactions for core gameplay.
- **Touch safety:** suppress accidental scrolling, pinch zoom, text selection and gesture conflicts inside the gameplay area while avoiding unnecessary interference outside it; release held controls reliably on touch cancel/blur.
- **QA gate for every release:** verify desktop **and** portrait rotation guidance plus multiple small and wide landscape touch viewports. Exercise movement, simultaneous DASH + JUMP, USE, pause, HUD, safe-area layout, game progression, and console errors. Test on physical iOS Safari and Android Chrome when possible; otherwise explicitly mark physical devices **not tested**.
- **Version discipline:** preserve immutable **v0.8.7** at `stable/v0.8.7`. Treat accepted **v0.8.8** as the initial mobile-compatible development reference. Never remove its mobile capabilities or degrade original animation/VFX while implementing future changes.

This requirement also applies when the change appears "desktop-only" (e.g., sprites, VFX, dialogues, or menu layout). Document any mobile limitations before claiming a version is complete.

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
