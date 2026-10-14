/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BrandLine } from '../types';
import { Trash, Plus, Sparkles, Search, Library, AlertCircle } from 'lucide-react';

interface BrandLinesManagerProps {
  brandLines: BrandLine[];
  onAddBrandLine: (brand: string, line: string) => void;
  onDeleteBrandLine: (id: string) => void;
}

export default function BrandLinesManager({
  brandLines,
  onAddBrandLine,
  onDeleteBrandLine,
}: BrandLinesManagerProps) {
  const [brandInput, setBrandInput] = useState('');
  const [lineInput, setLineInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandInput.trim()) {
      setErrorMsg('Brand name must not be blank.');
      return;
    }
    if (!lineInput.trim()) {
      setErrorMsg('Yarn Line name must not be blank.');
      return;
    }

    // Check duplicate locally for immediate response
    const exists = brandLines.some(
      b =>
        b.brand.toLowerCase() === brandInput.trim().toLowerCase() &&
        b.line.toLowerCase() === lineInput.trim().toLowerCase()
    );

    if (exists) {
      setErrorMsg('This brand and line combination is already registered.');
      return;
    }

    setErrorMsg('');
    onAddBrandLine(brandInput.trim(), lineInput.trim());
    setBrandInput('');
    setLineInput('');
  };

  const filteredCatalog = brandLines.filter(item => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      item.brand.toLowerCase().includes(query) ||
      item.line.toLowerCase().includes(query)
    );
  });

  return (
    <div id="brand-lines-tab-container" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Registration Column Form */}
      <div id="catalog-registration-form-panel" className="bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DFD3] dark:border-[#2E2925] p-6 rounded-2xl shadow-xs h-fit transition-all">
        <h3 className="text-lg font-serif font-black text-neutral-800 dark:text-neutral-100 flex items-center space-x-2 pb-3 mb-4 border-b border-neutral-155 dark:border-[#2E2925]">
          <Plus className="w-5 h-5 text-amber-800 dark:text-amber-500" />
          <span>Register Brand & Line Reference</span>
        </h3>

        {errorMsg && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-xs p-3 rounded-lg mb-3 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-medium text-neutral-600 dark:text-neutral-400 mb-1 uppercase tracking-wider">
              Brand / Manufacturer
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sandnes Garn, Rowan"
              className="w-full bg-white dark:bg-[#121110] text-sm text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-850 outline-none focus:border-amber-700 dark:focus:border-amber-500 focus:ring-1 focus:ring-amber-700 transition"
              value={brandInput}
              onChange={e => setBrandInput(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-neutral-600 dark:text-neutral-400 mb-1 uppercase tracking-wider">
              Yarn Line Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Peer Gynt, Double Sunday"
              className="w-full bg-white dark:bg-[#121110] text-sm text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-850 outline-none focus:border-amber-700 dark:focus:border-amber-500 focus:ring-1 focus:ring-amber-700 transition"
              value={lineInput}
              onChange={e => setLineInput(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-amber-805 hover:bg-amber-900 text-white font-mono text-xs uppercase tracking-wider font-semibold rounded-xl transition shadow-xs"
          >
            Add to Reference List
          </button>
        </form>

        <p className="text-[11px] text-neutral-450 dark:text-neutral-500 italic mt-4 leading-relaxed">
          * Registered selections instantly appear under the brand and model dropdown menus when documentating yarn skeins.
        </p>
      </div>

      {/* Directory Browser List Column */}
      <div id="catalog-explorer-list-panel" className="lg:col-span-2 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DFD3] dark:border-[#2E2925] p-6 rounded-2xl shadow-xs transition-all">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 mb-4 gap-3 border-b border-neutral-155 dark:border-[#2E2925]">
          <h3 className="text-lg font-serif font-black text-neutral-800 dark:text-neutral-100 flex items-center space-x-2">
            <Library className="w-5 h-5 text-amber-800 dark:text-amber-500" />
            <span>Reference Database ({brandLines.length} pairs)</span>
          </h3>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
            <input
              type="text"
              placeholder="Quick search catalog..."
              className="w-full bg-white dark:bg-[#121110] text-xs text-neutral-800 dark:text-[#E6DFD3] pl-8 pr-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-850 outline-none focus:border-amber-700 dark:focus:border-amber-500 transition"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {filteredCatalog.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
            {filteredCatalog.map(item => (
              <div
                key={item.id}
                className="bg-white dark:bg-[#121110] border border-neutral-200/60 dark:border-[#2E2925] p-3.5 rounded-xl flex items-center justify-between hover:border-amber-700/25 transition duration-200"
              >
                <div>
                  <span className="block text-[10px] font-mono uppercase text-amber-900 dark:text-amber-500 font-bold tracking-wider leading-none">
                    {item.brand}
                  </span>
                  <span className="block text-sm font-sans font-medium text-neutral-800 dark:text-[#E6DFD3] mt-1">
                    {item.line}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteBrandLine(item.id)}
                  title="Remove from custom dropdown helpers"
                  className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-955/30 rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-rose-700 dark:hover:text-rose-400 transition"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl bg-white/40 dark:bg-black/10">
            <AlertCircle className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
            <p className="text-sm text-neutral-500 dark:text-neutral-450 font-sans font-medium">No brands matching search filter</p>
            <p className="text-xs text-neutral-400 dark:text-neutral-550 mt-1 font-mono">Create new custom combinations using the entry form</p>
          </div>
        )}
      </div>
    </div>
  );
}
