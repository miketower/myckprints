export const extraPrintPrice = 40;
export const printLabels = new Map([
  ['frente', 'Frente'],
  ['reverso', 'Reverso'],
  ['ambos', 'Frente y reverso'],
]);

export function unitPrice(pricing, printSides) {
  return pricing.unit + (printSides === 'ambos' ? extraPrintPrice : 0);
}

// Approximate screen values for the polo body and inner collar trim.
export const poloColors = Object.freeze({
  'WH/WH': ['#ffffff', '#ffffff'],
  'SL/GRA': ['#bebfba', '#36b8a5'],
  'CHC/RD': ['#48464c', '#e51840'],
  'NY/SL': ['#202636', '#c8cac8'],
  'RB/SL': ['#074b9c', '#c8cac8'],
  'BK/SL': ['#201e22', '#c8cac8'],
  'RD/NY': ['#c90031', '#202636'],
  'DN/NY': ['#284677', '#202636'],
  'BU/BK': ['#640634', '#201e22'],
  'DS/BK': ['#ac997b', '#201e22'],
});

export const capModels = Object.freeze({
  '600': { name: '600 · Gorra de red', colors: { RD: '#d62026', WH: '#f5f3ed', BK: '#1e2021', NY: '#20293b', RB: '#1657a6' } },
  '601': { name: '601 · Gorra de red combinada', colors: { RD: '#d62026', GR: '#178252', NY: '#20293b', BU: '#801f30', BK: '#1e2021', RB: '#1657a6' } },
});

export const capColorNames = { RD: 'Rojo', WH: 'Blanco', BK: 'Negro', NY: 'Azul marino', RB: 'Azul rey', GR: 'Verde', BU: 'Vino' };

const sportShirtColors = Object.freeze({
  FUE: '#f474a0', WH: '#ffffff', BK: '#1c1c1a', RD: '#e51840', RB: '#006db1',
  NY: '#202f40', TU: '#00b7be', SYF: '#dfea32', ORF: '#ffa121', LMF: '#58b744',
});

const tumblerColors = { OR: '#f89c2c', SK: '#9ed3da', RB: '#075bab', RD: '#b31c28', ST: '#999c99', WH: '#eef1ef', BK: '#242728', FU: '#d51564', NY: '#173668', GF: '#62686b' };
export const tumblerColorNames = { OR: 'Naranja', SK: 'Azul cielo', RB: 'Azul rey', RD: 'Rojo', ST: 'Acero', WH: 'Blanco', BK: 'Negro', FU: 'Fucsia', NY: 'Azul marino', GF: 'Gris' };
export const tumblerModels = {
  kansas: { name: 'Kansas', unit: 180, initialColor: 'OR', area: [32.25, 20, 35.5, 37], colors: Object.fromEntries(['OR', 'SK', 'RB', 'RD', 'ST', 'WH', 'BK', 'FU'].map((code) => [code, tumblerColors[code]])) },
  nevada: { name: 'Nevada', unit: 250, initialColor: 'WH', area: [32.25, 15, 35.5, 31], colors: Object.fromEntries(['WH', 'ST', 'NY', 'GF', 'RB', 'BK', 'RD', 'OR'].map((code) => [code, tumblerColors[code]])) },
};
export const tumblerTechniques = new Map([['full-color', 'Impresión a todo color'], ['laser', 'Grabado láser']]);

export const checkoutProducts = new Map([
  ['sudaderas', Object.freeze({ name: 'Sudadera con capucha', quote: 'Sudaderas con capucha', minimum: 10, unit: 420, shipping: 150 })],
  ['sudaderas-sin-capucha', Object.freeze({ name: 'Sudadera sin capucha', quote: 'Sudaderas sin capucha', minimum: 10, unit: 390, shipping: 150 })],
  ['playeras', Object.freeze({ name: 'Playera de manga corta', quote: 'Playeras', minimum: 10, unit: 180, shipping: 150 })],
  ['playeras-deportivas', Object.freeze({ name: 'Playera deportiva Dry Fit', quote: 'Playera deportiva Dry Fit', minimum: 12, unit: 200, shipping: 150, defaultColor: 'BK', colors: sportShirtColors })],
  ['termos', Object.freeze({ name: 'Termo', quote: 'Termos', minimum: 12, shipping: 150 })],
  ['gorras', Object.freeze({ name: 'Gorra de red DKPS', quote: 'Gorras', minimum: 12, unit: 90, shipping: 150 })],
  ['playeras-polo', Object.freeze({ name: 'Polo Dry Fit', quote: 'Playeras polo', minimum: 12, unit: 260, shipping: 150, defaultColor: 'NY/SL' })],
  ['playeras-manga-larga', Object.freeze({ name: 'Playera de manga larga', quote: 'Playeras de manga larga', minimum: 12, unit: 220, shipping: 150 })],
]);
