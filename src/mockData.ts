/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { YarnSkein } from './types';

export const INITIAL_YARNS: YarnSkein[] = [
  {
    id: 'skein-1',
    brand: 'Malabrigo',
    name: 'Rios',
    color: 'Sunset Glow',
    colorHex: '#D38E75',
    hookSizes: '4.5,5.0,5.5',
    meters: 192, // ~210 yds convert to meters
    quantity: 4,
    notes: '100% Superwash Merino Wool. Incredibly soft, plyed yarn. Scheduled for a cozy winter cables hat and scarf combo.',
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(), // 5 days ago
  },
  {
    id: 'skein-2',
    brand: 'Cascade Yarns',
    name: '220 Heathers',
    color: 'Sage Moss',
    colorHex: '#A3B899',
    hookSizes: '4.5,5.0',
    meters: 201, // ~220 yds
    quantity: 6,
    notes: '100% Peruvian Highland Wool. Perfect classic heather gray-green. Great structural definition for cable-knitting or cardigans.',
    createdAt: new Date(Date.now() - 3600000 * 24 * 12).toISOString(), // 12 days ago
  },
  {
    id: 'skein-3',
    brand: 'Noro',
    name: 'Silk Garden',
    color: 'Vintage Lilac Blend',
    colorHex: '#A19CB3',
    hookSizes: '4.5,5.0,5.5',
    meters: 100, // ~110 yds
    quantity: 2,
    notes: '45% Silk, 45% Mohair, 10% Wool. Self-striping premium luxury fiber. Rich transitions. Need 1 more skein for a full cowl.',
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(), // 2 days ago
  },
  {
    id: 'skein-4',
    brand: 'Shibui Knits',
    name: 'Silk Cloud',
    color: 'Mist Gray',
    colorHex: '#E6DFD3',
    hookSizes: '2.25,2.75,3.0,3.25',
    meters: 297, // ~325 yds
    quantity: 0,
    notes: '60% Kid Mohair, 40% Silk. Used for blending or featherweight knits. Out of stock - fully knitted into holding-yarn shawl.',
    createdAt: new Date(Date.now() - 3600000 * 24 * 25).toISOString(), // 25 days ago
  }
];
