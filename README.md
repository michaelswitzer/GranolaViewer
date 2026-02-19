# Granola 3D Configurator

A React + Three.js product viewer for [Granola](https://granola.games) controllers. Displays a 3D model that updates colors in real-time based on Shopify product customization selections. Supports multiple products from a single deployment.

## Setup

```bash
npm install
cp .env.example .env
# Set model URLs for each product (e.g. /beacon.gltf, /plateau.gltf)
npm run dev
```

Place your GLTF model files in `public/`.

## Multi-Product Support

Products are selected via URL parameter: `?product=beacon` (default) or `?product=plateau`.

Each product config in `src/products.jsx` defines:
- Model URL, camera position, and FOV
- Color state keys and default colors
- Shopify field ID mapping
- GLTF mesh grouping rules (parent prefix map)
- Optional acrylic and logo settings

## How It Works

- **3D Viewer** — Built with `@react-three/fiber` and `@react-three/drei`. Loads a GLTF model and maps meshes to configurable color groups by walking the ancestor node hierarchy to match named parent prefixes.
- **Shopify Bridge** — Communicates with the Shopify product page via `postMessage`. The viewer listens for `SET_COLOR` and `SET_ALL_COLORS` messages and posts `VIEWER_READY` when loaded. Separate bridge scripts handle different input types (radio buttons vs dropdowns).
- **Embedding** — Deploy to Vercel and embed as an iframe on the Shopify product page.

## Deployment (Vercel)

1. Connect the repo to a Vercel project
2. Add environment variables in Vercel project settings:
   - `VITE_BEACON_MODEL_URL` — path to Beacon GLTF (e.g. `/beacon.gltf`)
   - `VITE_PLATEAU_MODEL_URL` — path to Plateau GLTF (e.g. `/plateau.gltf`)
   - `VITE_MODEL_URL` — legacy fallback for Beacon
3. Deploy — `vercel.json` configures CORS and CSP headers for embedding
4. Embed on Shopify product pages (see below)

## Shopify Embed

Each product needs an iframe and its corresponding bridge script on the Shopify product page.

```html
<!-- Product viewer iframe -->
<iframe
  id="your-product-viewer"
  src="https://your-app.vercel.app/?product=your-product"
  style="width: 100%; height: 500px; border: none;"
  loading="lazy"
  allow="fullscreen"
  allowtransparency="true"
></iframe>

<!-- Bridge script (handles customizer widget → iframe communication) -->
<script src="https://your-app.vercel.app/shopify-bridge-your-product.js" defer></script>
```

The iframe `id` must match the `IFRAME_ID` in the corresponding bridge script.

## Testing Colors

With the dev server running, paste in the browser console:

```js
// Change a color by field ID
window.postMessage({ type: 'SET_COLOR', fieldId: 313063, colorName: 'Green' }, '*')
```

## License

MIT
