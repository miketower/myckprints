export const extraPrintPrice = 40;
export const printLabels = new Map([
  ['frente', 'Frente'],
  ['reverso', 'Reverso'],
  ['ambos', 'Frente y reverso'],
]);

export function unitPrice(pricing, printSides) {
  return pricing.unit + (printSides === 'ambos' ? extraPrintPrice : 0);
}

export const checkoutProducts = new Map([
  ['sudaderas', Object.freeze({ name: 'Sudadera con capucha', quote: 'Sudaderas con capucha', minimum: 10, unit: 420, shipping: 150 })],
  ['sudaderas-sin-capucha', Object.freeze({ name: 'Sudadera sin capucha', quote: 'Sudaderas sin capucha', minimum: 10, unit: 390, shipping: 150 })],
  ['playeras', Object.freeze({ name: 'Playera de manga corta', quote: 'Playeras', minimum: 10, unit: 180, shipping: 150 })],
  ['playeras-manga-larga', Object.freeze({ name: 'Playera de manga larga', quote: 'Playeras de manga larga', minimum: 12, unit: 220, shipping: 150 })],
]);
