const PLATEAU_BUTTON_KEYS = [
  'directionsButtons',
  'cStickButtons',
  'aButton',
  'bButton',
  'zButton',
  'lrxyButtons',
  'shieldStartDpadButtons',
]

const beaconConfig = {
  id: 'beacon',
  modelUrl: import.meta.env.VITE_BEACON_MODEL_URL || import.meta.env.VITE_MODEL_URL || '',
  camera: { position: [-0.08, 0.03, 0.25], fov: 45 },
  colorStateKeys: ['caseColor', 'buttons24mm', 'buttons30mm', 'buttonsMenu'],
  fieldMap: {
    313063: 'caseColor',
    784763: 'buttons24mm',
    779935: 'buttons30mm',
    926482: 'buttonsMenu',
  },
  specialFields: {},
  parentPrefixMap: [
    { prefix: 'Case_Top', key: 'caseColor' },
    { prefix: 'Case_Bottom', key: 'caseColor' },
    { prefix: 'Buttons_24mm', key: 'buttons24mm' },
    { prefix: 'Buttons_30mm', key: 'buttons30mm' },
    { prefix: 'Buttons_Menu', key: 'buttonsMenu' },
    { prefix: 'occurrence_of_', key: 'buttonsMenu' },
  ],
  acrylicPrefix: 'Acrylic_Top',
  logo: {
    enabled: true,
    texture: '/granola-logo.png',
    bottomGroupTest: (parentName) =>
      parentName === 'Case_Bottom' || parentName.startsWith('Case_Bottom_'),
  },
}

const plateauConfig = {
  id: 'plateau',
  modelUrl: import.meta.env.VITE_PLATEAU_MODEL_URL || '',
  camera: { position: [0, 0.15, 0.35], fov: 45 },
  colorStateKeys: ['caseColor', ...PLATEAU_BUTTON_KEYS],
  fieldMap: {
    313063: 'caseColor',
    784763: 'directionsButtons',
    779935: 'cStickButtons',
    926482: 'aButton',
    958032: 'bButton',
    849676: 'zButton',
    285053: 'lrxyButtons',
    16152: 'shieldStartDpadButtons',
  },
  specialFields: {
    741708: (colorName) => {
      if (colorName === 'Different Colors For Each Button') return null
      return PLATEAU_BUTTON_KEYS.map((key) => [key, colorName])
    },
  },
  parentPrefixMap: [],
  acrylicPrefix: 'Acrylic_Top',
  logo: {
    enabled: true,
    texture: '/granola-logo.png',
    bottomGroupTest: (parentName) =>
      parentName === 'Case_Bottom' || parentName.startsWith('Case_Bottom_'),
  },
}

const products = {
  beacon: beaconConfig,
  plateau: plateauConfig,
}

export function getProductConfig() {
  const params = new URLSearchParams(window.location.search)
  const productId = params.get('product') || 'beacon'
  return products[productId] || products.beacon
}
