export const BEACON_COLORS = [
  { name: 'Sage', hex: '#bdd49b', metallic: false },
  { name: 'Green', hex: '#168c49', metallic: false },
  { name: 'Purple', hex: '#6842b3', metallic: false },
  { name: 'Plum', hex: '#8c2485', metallic: false },
  { name: 'Pink', hex: '#ed93b1', metallic: false },
  { name: 'Magenta', hex: '#e32262', metallic: false },
  { name: 'Teal', hex: '#00272e', metallic: false },
  { name: 'Light Teal', hex: '#30a5b0', metallic: false },
  { name: 'Army Green', hex: '#665b28', metallic: false },
  { name: 'Army Beige', hex: '#ab6f41', metallic: false },
  { name: 'Red', hex: '#e8241a', metallic: false },
  { name: 'Gray', hex: '#74757d', metallic: false },
  { name: 'Black', hex: '#000000', metallic: false },
  { name: 'White', hex: '#ffffff', metallic: false },
  { name: 'Cheddar Cheese', hex: '#f5b402', metallic: false },
  { name: 'Yellow', hex: '#ffff00', metallic: false },
  { name: 'Light Yellow', hex: '#f5d467', metallic: false },
  { name: 'Brown', hex: '#4f2f1f', metallic: false },
  { name: 'Blue', hex: '#00327d', metallic: false },
  { name: 'Light Blue', hex: '#70adcc', metallic: false },
  { name: 'Orange', hex: '#ed6c02', metallic: false },
  { name: 'Salmon', hex: '#cc4e4b', metallic: false },
  { name: 'Metallic Gold', hex: '#bf7719', metallic: true },
  { name: 'Metallic Silver', hex: '#7a8491', metallic: true },
  { name: 'Metallic Bronze', hex: '#702803', metallic: true },
  { name: 'Metallic Blue', hex: '#0d2440', metallic: true },
]

// Maps Tapcart field IDs to our state keys
export const FIELD_MAP = {
  313063: 'caseColor',
  784763: 'buttons24mm',
  779935: 'buttons30mm',
  926482: 'buttonsMenu',
}

export function getDefaultColors() {
  return {
    caseColor: 'Green',
    buttons24mm: 'Sage',
    buttons30mm: 'Orange',
    buttonsMenu: 'Orange',
  }
}

export function findColor(name) {
  return BEACON_COLORS.find(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  )
}
