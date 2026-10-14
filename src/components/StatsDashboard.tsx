/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { YarnSkein } from '../types';
import { Layers, ListChecks, Ruler, Sparkles } from 'lucide-react';

interface StatsDashboardProps {
  skeins: YarnSkein[];
}

export default function StatsDashboard({ skeins }: StatsDashboardProps) {
  const totalSkeins = skeins.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalMeters = skeins.reduce((acc, curr) => acc + (curr.meters * curr.quantity), 0);
  
  const distinctBrands = new Set(skeins.map(s => s.brand.trim().toLowerCase())).size;
  const inStockItems = skeins.filter(s => s.quantity > 0).length;

  // Classify hook sizes into 3 brackets:
  // - Fine (< 3.0mm)
  // - Medium (3.0mm to 6.0mm)
  // - Bulky (> 6.0mm)
  let fineCount = 0;
  let mediumCount = 0;
  let bulkyCount = 0;

  skeins.forEach(s => {
    if (!s.hookSizes || s.quantity === 0) return;
    const sizes = s.hookSizes.split(',').map(val => parseFloat(val.trim())).filter(num => !isNaN(num));
    if (sizes.length === 0) return;

    // Check where they fall. We can distribute the quantity proportionally, or attribute it.
    // Let's divide the skein quantity across all its specified hook sizes
    const qtyPerSize = s.quantity / sizes.length;
    sizes.forEach(size => {
      if (size < 3.0) {
        fineCount += qtyPerSize;
      } else if (size <= 6.0) {
        mediumCount += qtyPerSize;
      } else {
        bulkyCount += qtyPerSize;
      }
    });
  });

  const totalRated = fineCount + mediumCount + bulkyCount || 1;
  const finePct = Math.round((fineCount / totalRated) * 100);
  const mediumPct = Math.round((mediumCount / totalRated) * 100);
  const bulkyPct = Math.round((bulkyCount / totalRated) * 100);

  return (
    <div id="stats-dashboard" className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {/* Total Skeins */}
      <div id="stat-skeins" className="bg-[#FAF8F5] dark:bg-[#1C1917] p-5 rounded-2xl border border-[#E6DFD3] dark:border-[#2E2925] shadow-xs flex items-center space-x-4 transition-all">
        <div className="p-3 bg-amber-150 dark:bg-amber-950/45 rounded-xl text-amber-800 dark:text-amber-300">
          <Layers className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <p className="text-xs font-mono text-neutral-500 dark:text-neutral-450 uppercase tracking-wider">Total Skeins</p>
          <p className="text-2xl font-serif font-black text-neutral-800 dark:text-neutral-100">{totalSkeins}</p>
          <p className="text-xs text-neutral-400 dark:text-neutral-400 font-sans mt-0.5">
            across {inStockItems} distinct lines
          </p>
        </div>
      </div>

      {/* Total Meters */}
      <div id="stat-meters" className="bg-[#FAF8F5] dark:bg-[#1C1917] p-5 rounded-2xl border border-[#E6DFD3] dark:border-[#2E2925] shadow-xs flex items-center space-x-4 transition-all">
        <div className="p-3 bg-[#E4ECF0] dark:bg-sky-950/45 rounded-xl text-[#2C5A66] dark:text-sky-305">
          <Ruler className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-mono text-neutral-500 dark:text-neutral-450 uppercase tracking-wider">Total Meters</p>
          <div className="flex items-baseline space-x-1">
            <p className="text-2xl font-serif font-black text-neutral-800 dark:text-neutral-100">
              {totalMeters.toLocaleString()}
            </p>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">m</span>
          </div>
          <p className="text-xs text-neutral-400 dark:text-neutral-400 font-sans mt-0.5">
            {(totalMeters / 1000).toFixed(2)} km of fiber length
          </p>
        </div>
      </div>

      {/* Brands Count */}
      <div id="stat-brands" className="bg-[#FAF8F5] dark:bg-[#1C1917] p-5 rounded-2xl border border-[#E6DFD3] dark:border-[#2E2925] shadow-xs flex items-center space-x-4 transition-all">
        <div className="p-3 bg-rose-100 dark:bg-rose-950/45 rounded-xl text-rose-800 dark:text-rose-300">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-mono text-neutral-500 dark:text-neutral-450 uppercase tracking-wider">Unique Brands</p>
          <p className="text-2xl font-serif font-black text-neutral-800 dark:text-neutral-100">{distinctBrands}</p>
          <p className="text-xs text-neutral-400 dark:text-neutral-405 font-sans mt-0.5">
            spinners & mills in catalog
          </p>
        </div>
      </div>

      {/* Recommended Hook Distribution Widget */}
      <div id="stat-distribution" className="bg-[#FAF8F5] dark:bg-[#1C1917] p-4 rounded-2xl border border-[#E6DFD3] dark:border-[#2E2925] shadow-xs md:col-span-1 flex flex-col justify-between transition-all">
        <div className="flex items-center space-x-2 mb-2">
          <ListChecks className="w-4 h-4 text-neutral-600 dark:text-neutral-350" />
          <span className="text-xs font-mono text-neutral-600 dark:text-neutral-350 uppercase tracking-wider">Hooks Split</span>
        </div>
        <div className="space-y-1.5 pt-0.5">
          {/* Fine Hooks Row */}
          <div className="flex items-center justify-between text-xs text-neutral-700 dark:text-neutral-300">
            <span className="w-16 font-sans">Fine (&lt;3mm)</span>
            <div className="flex-1 bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden mx-2">
              <div className="bg-amber-800 dark:bg-amber-600 h-full rounded-full transition-all duration-500" style={{ width: `${finePct || 0}%` }} />
            </div>
            <span className="w-8 text-right font-mono text-[11px] text-neutral-500 dark:text-neutral-400">{finePct}%</span>
          </div>

          {/* Medium Hooks Row */}
          <div className="flex items-center justify-between text-xs text-neutral-700 dark:text-neutral-300">
            <span className="w-16 font-sans">Med (3-6mm)</span>
            <div className="flex-1 bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden mx-2">
              <div className="bg-amber-600 dark:bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${mediumPct || 0}%` }} />
            </div>
            <span className="w-8 text-right font-mono text-[11px] text-neutral-500 dark:text-neutral-400">{mediumPct}%</span>
          </div>

          {/* Bulky Hooks Row */}
          <div className="flex items-center justify-between text-xs text-neutral-700 dark:text-neutral-300">
            <span className="w-16 font-sans">Bulk (&gt;6mm)</span>
            <div className="flex-1 bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden mx-2">
              <div className="bg-amber-50 dark:bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${bulkyPct || 0}%` }} />
            </div>
            <span className="w-8 text-right font-mono text-[11px] text-neutral-500 dark:text-neutral-400">{bulkyPct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
