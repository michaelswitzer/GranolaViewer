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

Copy `.env.example` to `.env` and set model URLs. Models will not render without these variables set.

```
VITE_BEACON_MODEL_URL=/beacon.gltf
VITE_PLATEAU_MODEL_URL=/plateau.gltf
VITE_MODEL_URL=/beacon.gltf   # legacy fallback for Beacon
```

## Architecture

### Multi-Product System

The app supports multiple controller products from a single deployment. Product is selected via URL parameter: `?product=beacon` (default) or `?product=plateau`.

All product configs live in `src/products.jsx`. Each config defines: model URL, camera position, color state keys, default colors, Shopify field ID mapping, GLTF mesh grouping rules (parentPrefixMap), acrylic settings, and logo settings.

To add a new product: add a config object to `products.jsx`, create a Shopify bridge script in `public/`, and add the model GLTF to `public/`.

### Data Flow

```
Shopify page (shopify-bridge-{product}.js)
  → reads TC radio inputs or select dropdowns
  → postMessage({ type: 'SET_COLOR', fieldId, colorName })
  → iframe (this React app, loaded with ?product=...)
    → useShopifyBridge.js translates fieldId → state key via config.fieldMap
    → specialFields handlers (e.g. Plateau "all buttons same color" dropdown)
    → App.jsx colors state updates
    → ProductModel.jsx re-applies Three.js materials
```

The app also emits `{ type: 'VIEWER_READY' }` to the parent on mount, which triggers the bridge script to flush its queue and sync current selections.

### Color System (`src/colors.js`)

- `BEACON_COLORS` — master palette shared across all products (name, hex, metallic flag)
- `getDefaultColors(colorStateKeys, defaultColors)` — returns `defaultColors` if provided by config, otherwise randomizes
- `findColor(name)` — case-insensitive lookup used by `ProductModel`

### 3D Model (`src/components/ProductModel.jsx`)

**Mesh grouping:** On first load, the GLTF scene is traversed. For each mesh, the code walks up the ancestor node chain looking for a name that matches a prefix in the product's `parentPrefixMap`. This supports two patterns:

- **Direct parent matching** (Beacon): meshes are direct children of named groups like `Case_Top`, `Buttons_24mm`
- **Subassembly matching** (Plateau): meshes are nested inside subassemblies (e.g. `Directions_Buttons > occurrence of Buttons_24mm > Buttons_24mm`). The ancestor walk finds the subassembly name regardless of nesting depth.

Names with GLTF export suffixes like ` <1>` are automatically stripped before matching.

**Logo placement:** Configured per product via `config.logo`. When enabled, `findLargestBottomMesh` finds the mesh with the single largest coplanar face (by summing triangle area per quantized face normal). `generateLargestFaceUVs` procedurally generates UVs for that face. The logo texture is applied as an `emissiveMap` on black base material. Currently enabled for Beacon only.

**Material strategy:**
- Regular meshes: `MeshStandardMaterial` (roughness 0.95, metalness 0) — one shared material per color group, color updated in place
- Acrylic top (if `config.acrylicPrefix` is set): `MeshPhysicalMaterial` (transparent, opacity 0.35, depthWrite false)
- Logo mesh: `MeshStandardMaterial` with `emissiveMap` set to `granola-logo.png`

### Scene (`src/components/Scene.jsx`)

Three-point lighting plus `OrbitControls` with pan disabled and full vertical rotation (polar angle 0 → π). Camera position and FOV are set per product config.

### Shopify Bridges (`public/shopify-bridge*.js`)

Vanilla JS IIFEs loaded directly on the Shopify product page (not bundled by Vite). Each product has its own bridge script:

- `shopify-bridge.js` — Beacon. Handles TC radio inputs only. iframe id: `beacon-viewer`.
- `shopify-bridge-plateau.js` — Plateau. Handles both TC radio inputs (case color) and `<select>` dropdowns (button colors). iframe id: `plateau-viewer`.

Both parse TC element IDs using the pattern `tcustomizer-form-field-{FIELD_ID}-{PRODUCT_ID}-{ColorName}` (radios) or `tcustomizer-form-field-{FIELD_ID}-{PRODUCT_ID}` (selects). Both use `MutationObserver` to re-sync when the TC widget updates the DOM dynamically.

## Deployment

Deployed to Vercel. `vercel.json` configures CORS headers permitting `granola.games` and Shopify origins. The `public/` directory is served as-is (GLTF models, logo texture, bridge scripts). Environment variables for model URLs must be set in Vercel project settings.
