# Cosmoscope

Cosmoscope is a production-ready React + Vite + TypeScript application that renders a neon-drenched atlas of the inner solar system. It combines a cinematic three.js solar system hub with an interactive MapLibre exploration view powered by mock NASA datasets.

## Getting started

```bash
npm install
npm run dev
```

The development server starts on [http://localhost:5173](http://localhost:5173).

> **Note**
> The `postinstall` script materialises the ambient soundtrack by decoding
> `src/assets/audio/ambient-space.mp3.base64` into
> `src/assets/audio/ambient-space.mp3`. Re-run `node ./scripts/generate-audio.mjs`
> if you ever remove the generated asset manually.

### Available scripts

| Script | Description |
| ------ | ----------- |
| `npm run dev` | Launches the Vite development server. |
| `npm run build` | Runs the TypeScript type-checker and produces a production build. |
| `npm run preview` | Serves the production build locally. |
| `npm run test` | Executes Vitest unit tests. |
| `npm run test:watch` | Runs Vitest in watch mode. |
| `npm run test:e2e` | Runs Playwright end-to-end tests (starts the dev server automatically). |
| `npm run lint` | Validates the codebase with ESLint. |
| `npm run format` | Formats the repository with Prettier. |

## Architecture overview

```
cosmoscope/
├─ src/
│  ├─ routes/           # Landing, SolarSystem, Planet route components
│  ├─ components/       # Reusable UI (neon popup, map, audio, three.js scene)
│  ├─ adapters/         # Data adapters and NASA mock implementation
│  ├─ state/            # Zustand store for shared UI state
│  ├─ lib/              # Camera transition helpers
│  ├─ shaders/          # GLSL mask used for overlay reveals
│  ├─ styles/           # Global neon theme utilities
│  └─ assets/           # Ambient soundtrack and UI assets
├─ public/mock/         # Mock JSON fixtures and overlay metadata
└─ tests/e2e/           # Playwright regression tests
```

### Key features

- **Landing** – A neon cinematic introduction with ambient space audio and quick-start CTA.
- **Solar System hub** – Three.js scene built with `@react-three/fiber` and `drei` showing the sun and planets. Earth, Moon, and Mars respond to clicks/double-clicks to trigger travel sequences. Camera modes are toggled with shadcn/ui `ToggleGroup` controls.
- **Planet view** – MapLibre base map enhanced with a WebGL circular mask shader that reveals overlays beneath the cursor. Users can cycle overlays with the `O` hotkey, scrub time with a debounced slider (`T` focuses the slider), and inspect POIs through neon popups fed by the data adapter.
- **Data layer** – `DataAdapter` defines typed interfaces for summaries, overlays, POIs, and missions. `NasaAdapter` consumes mock JSON from `public/mock/` while leaving TODO hooks to connect live NASA APIs later. Fetching is orchestrated with TanStack Query for caching and error reporting via Sonner toasts.
- **State** – Zustand store tracks the current planet, overlay selection, time, POI focus, camera mode, and audio preference. Keyboard shortcuts (M, O, T, Escape) align with the store and UI controls.
- **Styling** – Tailwind CSS powers layout, while `styles/neon.css` adds custom glow, focus, and marker treatments. shadcn/ui derived components (Button, Card, Dialog, Slider, ToggleGroup) ensure consistent neon glassmorphism.

## Working with overlays and POIs

Overlays are defined in `public/mock/overlays.json`. Each entry is rendered procedurally into an SVG-based tile at runtime so the repository can remain binary-free. To add a new overlay:

1. Append an `OverlayDescriptor` entry inside `public/mock/overlays.json` with an `id`, label, description, colour, and ISO timestamp list.
2. Optionally tweak the procedural output by adjusting `getOverlayTileUrl` in `src/adapters/NasaAdapter.ts`—for example by adding new gradients or annotation text.
3. Optionally, associate new POIs with the overlay in `public/mock/pois.json` by including the overlay `id` inside the `overlayIds` array.

POI entries accept an `[lng, lat]` coordinate, zoom level threshold, optional imagery gallery, and mission IDs resolved through `public/mock/missions.json`.

## Connecting to real NASA data (future work)

`src/adapters/NasaAdapter.ts` centralises data fetching. Swap the mock JSON URLs with real NASA endpoints (e.g., PDS, Eyes on the Solar System, or Earthdata tiles) and convert their responses into the typed interfaces. TODO markers in the adapter highlight where to inject live tile URLs once authentication and request signing are in place.

## Quality and testing

- **Unit tests** validate the Zustand store behaviour and the NASA adapter response shapes (`npm run test`).
- **End-to-end tests** traverse the landing → solar system → Mars → overlay/POI flow via Playwright (`npm run test:e2e`).
- **Linting** enforces consistent, type-safe code (`npm run lint`).
- **Formatting** uses Prettier with a 100 character print width (`npm run format`).

### Accessibility and interaction tips

- Press **M** to toggle ambient audio, **O** to cycle overlays, **T** to focus the time slider, and **Escape** to dismiss popups.
- Focus styles are prominent neon rings to aid keyboard navigation.
- Map interactions favour smooth zoom/pan defaults; POI markers appear according to zoom level.

## TODOs & nice-to-haves

- Offline service worker caching for tile assets.
- Vector tile decoding via Web Workers for heavier overlays.
- Reduced-motion preference that minimises camera and shader animations.
- Photo lightbox with keyboard navigation.
- Cross-session achievement tracking for visited locations.

## License

[MIT](./LICENSE)
