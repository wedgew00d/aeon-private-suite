# v0.8.8 — Mobile Landscape Controls

Date: 2026-11-19 (JST)  
Status: mobile enhancement, based on user-approved v0.8.7 stable.

## Changes

- Dynamic device-aware viewport layout, original 16:9 canvas letterboxed on wider phones.
- Landscape rotation notice for portrait devices; safe-area-aware on-screen controls.
- Joystick with a deadzone, analog horizontal velocity and pointer capture.
- Separate DASH hold, JUMP tap, USE tap and PAUSE action buttons; multi-touch works simultaneously.
- Resolution-aware Canvas backing store while preserving original 1280×720 world dimensions.
- Desktop keyboard controls remain usable; v0.8.7 imagery and animation unchanged.

## Source integrity

The immutable `parts/` content is the complete v0.8.7 standalone game; it reconstructs to SHA-256:

`330ba7e2fce0862b15ca759d35ae4b0732b19586131422f04ecb4e04dd53aabf`

Protected branch: [`stable/v0.8.7`](https://github.com/wedgew00d/aeon-private-suite/tree/stable/v0.8.7).

## Testing

Passed browser emulation at iPhone/Android landscape, compact landscape, portrait, desktop; touch stick, DASH, JUMP, and three-finger simultaneous control. Browser page load via the actual multipart loader passed under intercepted HTTP routes. Physical mobile devices remain untested.
