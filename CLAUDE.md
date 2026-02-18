# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (localhost:5173)
npm run build     # Production build → dist/
npm run preview   # Preview production build locally
```

No linting or test tooling is configured.

## Environment Setup

Copy `.env.example` to `.env` and set `VITE_MODEL_URL` to the GLTF model URL. The model will not render without this variable set.

```
VITE_MODEL_URL=https://example.com/beacon.gltf
```

## Architecture

### Data Flow

```
Shopify page (shopify-bridge.js)
  → reads Trademark Customs radio inputs (.tcustomizer__btn-check)
  → postMessage({ type: 'SET_COLOR', fieldId, colorName })
  → iframe (this React app)
    → useShopifyBridge.js translates fieldId → state key via FIELD_MAP
    → App.jsx colors state updates
    → BeaconModel.jsx re-applies Three.js materials
```

The app also emits `{ type: 'VIEWER_READY' }` to the parent on mount, which triggers `shopify-bridge.js` to flush its queue and sync current selections.

### Color System (`src/colors.js`)

- `BEACON_COLORS` — master palette (name, hex, metallic flag)
- `FIELD_MAP` — maps Tapcart/TC field IDs to the four color state keys: `caseColor`, `buttons24mm`, `buttons30mm`, `buttonsMenu`
- `getDefaultColors()` — initial state used by `App`
- `findColor(name)` — case-insensitive lookup used by `BeaconModel`

### 3D Model (`src/components/BeaconModel.jsx`)

**Mesh grouping:** On first load, the GLTF scene is traversed and meshes are bucketed by their parent node name using `PARENT_PREFIX_MAP`. Each prefix maps to one of the four color state keys. Meshes without a matching parent are ignored (assumed to be structural/fixed parts).

**Logo placement:** The `Case_Bottom` group contains several meshes. `findLargestBottomMesh` finds the one containing the single largest coplanar face (by summing triangle area per quantized face normal). `generateLargestFaceUVs` then procedurally generates UVs for that face by projecting onto the plane perpendicular to its dominant normal — vertices not on the target face are sent off-texture at UV (-1, -1). The logo texture is applied as an `emissiveMap` on black base material so it renders on top of the case color.

**Material strategy:**
- Regular meshes: `MeshStandardMaterial` (roughness 0.95, metalness 0) — metallic colors in the palette use the same material, no metalness applied
- Acrylic top: `MeshPhysicalMaterial` (transparent, opacity 0.35, depthWrite false)
- Logo mesh: `MeshStandardMaterial` with `emissiveMap` set to `granola-logo.png`

Materials are disposed and recreated on every color change to avoid leaks.

### Scene (`src/components/Scene.jsx`)

Three-point lighting plus `OrbitControls` with pan disabled and full vertical rotation (polar angle 0 → π). Camera is set in `App.jsx` at `[0, 0.1, 0.25]` with 45° FOV.

### Shopify Bridge (`public/shopify-bridge.js`)

Vanilla JS IIFE loaded directly on the Shopify product page (not bundled by Vite). Parses TC radio input IDs using the pattern `tcustomizer-form-field-{FIELD_ID}-{PRODUCT_ID}-{ColorName}`. Uses a `MutationObserver` to re-sync when the TC widget updates the DOM dynamically. The iframe must have `id="beacon-viewer"`.

## Deployment

Deployed to Vercel. `vercel.json` configures CORS headers permitting `granola.games` and Shopify origins. The `public/` directory is served as-is (GLTF model, logo texture, bridge script).
