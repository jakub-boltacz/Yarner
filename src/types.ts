/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface YarnSkein {
  id: string;
  brand: string;
  name: string; // Yarn Line Name
  color: string;
  colorHex?: string;
  hookSizes: string; // comma separated list e.g. "3.5,4.0" representing recommended hook sizes in mm
  meters: number; // meters per skein
  quantity: number;
  notes: string;
  createdAt: string;
}

export interface BrandLine {
  id: string;
  brand: string;
  line: string;
}

// Generate hook size options from 0.25 to 12.00 with 0.25 increments
export const HOOK_SIZES_LIST: number[] = (() => {
  const list: number[] = [];
  for (let s = 0.25; s <= 12.00; s += 0.25) {
    list.push(Number(s.toFixed(2)));
  }
  return list;
})();

export const PRESET_SHADES = [
  { name: 'Oatmeal', hex: '#E6DFD3' },
  { name: 'Terracotta', hex: '#D38E75' },
  { name: 'Sage Green', hex: '#A3B899' },
  { name: 'Dusty Rose', hex: '#D6A6B1' },
  { name: 'Mustard Gold', hex: '#DEB841' },
  { name: 'Charcoal', hex: '#4A4E51' },
  { name: 'Deep Teal', hex: '#2C5A66' },
  { name: 'Vintage Lavender', hex: '#A19CB3' },
  { name: 'Cream White', hex: '#FAF9F6' },
];
