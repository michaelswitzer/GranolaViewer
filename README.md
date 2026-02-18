# Beacon 3D Configurator

A React + Three.js product viewer for the [Granola Beacon](https://granola.games/products/beacon) fight stick controller. Displays a 3D model that updates colors in real-time based on Shopify/Tapcart product customization selections.

## Setup

```bash
npm install
cp .env.example .env
# Set VITE_MODEL_URL to your GLB/GLTF model path (e.g. /beacon.gltf)
npm run dev
```

Place your model file in `public/`.

## How It Works

- **3D Viewer** — Built with `@react-three/fiber` and `@react-three/drei`. Loads a GLTF model and maps meshes to configurable color groups (case, 24mm buttons, 30mm buttons, menu buttons) by parent node name.
- **Shopify Bridge** — Communicates with the Shopify product page via `postMessage`. The viewer listens for `SET_COLOR` and `SET_ALL_COLORS` messages and posts `VIEWER_READY` when loaded.
- **Embedding** — Deploy to Vercel and embed as an iframe on the Shopify product page. `vercel.json` includes CORS and CSP headers for `granola.games`.

## Testing Colors

With the dev server running, paste in the browser console:

```js
window.postMessage({ type: 'SET_COLOR', fieldId: 313063, colorName: 'Green' }, '*')  // Case
window.postMessage({ type: 'SET_COLOR', fieldId: 784763, colorName: 'Purple' }, '*') // 24mm buttons
window.postMessage({ type: 'SET_COLOR', fieldId: 779935, colorName: 'Blue' }, '*')   // 30mm buttons
window.postMessage({ type: 'SET_COLOR', fieldId: 926482, colorName: 'Red' }, '*')    // Menu buttons
```

## Shopify Embed

```html
<iframe id="beacon-viewer" src="https://your-app.vercel.app"
  style="width:100%;height:500px;border:none;" loading="lazy"></iframe>
<script src="https://your-app.vercel.app/shopify-bridge.js" defer></script>
```

## License

MIT
