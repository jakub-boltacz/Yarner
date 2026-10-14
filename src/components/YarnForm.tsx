/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { YarnSkein, PRESET_SHADES, HOOK_SIZES_LIST, BrandLine } from '../types';
import { X, Save, Plus, Palette, Grid, Bookmark, Check } from 'lucide-react';

interface YarnFormProps {
  initialSkein?: YarnSkein | null;
  brandLines: BrandLine[];
  onSubmit: (data: Omit<YarnSkein, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export default function YarnForm({ initialSkein, brandLines, onSubmit, onCancel }: YarnFormProps) {
  const [selectedBrand, setSelectedBrand] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [isCustomBrand, setIsCustomBrand] = useState(false);

  const [selectedLine, setSelectedLine] = useState('');
  const [customLine, setCustomLine] = useState('');
  const [isCustomLine, setIsCustomLine] = useState(false);

  const [color, setColor] = useState('');
  const [colorHex, setColorHex] = useState('#E6DFD3');
  const [meters, setMeters] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState('');

  // Smashed hook sizes comma list state
  const [activeHooks, setActiveHooks] = useState<number[]>([]);
  const [showHooksRegistry, setShowHooksRegistry] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');

  // Extract unique brands from reference catalog
  const availableBrands = Array.from(new Set(brandLines.map(b => b.brand))).sort();

  // Extract lines for selected brand
  const filteredLines = brandLines
    .filter(b => b.brand === selectedBrand)
    .map(b => b.line)
    .sort();

  useEffect(() => {
    if (initialSkein) {
      // Check if current brand is in registry
      const hasBrand = availableBrands.includes(initialSkein.brand);
      if (hasBrand) {
        setSelectedBrand(initialSkein.brand);
        setIsCustomBrand(false);
      } else {
        setSelectedBrand('__custom__');
        setCustomBrand(initialSkein.brand);
        setIsCustomBrand(true);
      }

      // Check if current line is in registry
      const hasLine = brandLines.some(b => b.brand === initialSkein.brand && b.line === initialSkein.name);
      if (hasLine && hasBrand) {
        setSelectedLine(initialSkein.name);
        setIsCustomLine(false);
      } else {
        setSelectedLine('__custom__');
        setCustomLine(initialSkein.name);
        setIsCustomLine(true);
      }

      setColor(initialSkein.color);
      setColorHex(initialSkein.colorHex || '#E6DFD3');
      setMeters(initialSkein.meters || '');
      setQuantity(initialSkein.quantity);
      setNotes(initialSkein.notes);

      // Parse initial hook sizes
      if (initialSkein.hookSizes) {
        const parsed = initialSkein.hookSizes
          .split(',')
          .map(s => parseFloat(s.trim()))
          .filter(n => !isNaN(n));
        setActiveHooks(parsed);
      } else {
        setActiveHooks([]);
      }
    } else {
      setSelectedBrand(availableBrands[0] || '');
      setIsCustomBrand(availableBrands.length === 0);
      setCustomBrand('');

      setSelectedLine('');
      setIsCustomLine(true);
      setCustomLine('');

      setColor('');
      setColorHex('#E6DFD3');
      setMeters('');
      setQuantity(1);
      setNotes('');
      setActiveHooks([]);
    }
    setErrorMsg('');
  }, [initialSkein, brandLines]);

  // Handle selected brand dropdown change
  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedBrand(val);
    if (val === '__custom__') {
      setIsCustomBrand(true);
      setIsCustomLine(true);
      setSelectedLine('__custom__');
    } else {
      setIsCustomBrand(false);
      // set line to first available for this brand, or custom
      const linesForNewBrand = brandLines.filter(b => b.brand === val).map(b => b.line);
      if (linesForNewBrand.length > 0) {
        setSelectedLine(linesForNewBrand[0]);
        setIsCustomLine(false);
      } else {
        setSelectedLine('__custom__');
        setIsCustomLine(true);
      }
    }
  };

  // Handle selected line dropdown change
  const handleLineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedLine(val);
    if (val === '__custom__') {
      setIsCustomLine(true);
    } else {
      setIsCustomLine(false);
    }
  };

  const toggleHookSize = (size: number) => {
    if (activeHooks.includes(size)) {
      setActiveHooks(activeHooks.filter(s => s !== size));
    } else {
      setActiveHooks([...activeHooks, size].sort((a, b) => a - b));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const brandName = isCustomBrand ? customBrand.trim() : selectedBrand.trim();
    const lineName = isCustomLine ? customLine.trim() : selectedLine.trim();

    if (!brandName || brandName === '__custom__') {
      setErrorMsg('Please specify a Spinner/Brand name.');
      return;
    }
    if (!lineName || lineName === '__custom__') {
      setErrorMsg('Please specify a Yarn Line name.');
      return;
    }
    setErrorMsg('');

    // Save hook sizes sorted from low to high as a comma list
    const hookSizesStr = activeHooks.join(',');

    onSubmit({
      brand: brandName,
      name: lineName,
      color: color.trim() || 'Undyed/Oatmeal',
      colorHex,
      hookSizes: hookSizesStr,
      meters: typeof meters === 'number' ? meters : 0,
      quantity,
      notes: notes.trim(),
    });
  };

  return (
    <div id="yarn-form-card" className="bg-[#FAF8F5] dark:bg-[#1C1917] border-2 border-[#D38E75]/30 dark:border-[#3E2922] rounded-2xl p-6 shadow-md transition-all duration-300">
      <div className="flex items-center justify-between border-b border-[#E6DFD3] dark:border-[#2E2925] pb-3 mb-5">
        <h3 className="text-lg font-serif font-black text-neutral-800 dark:text-neutral-100 flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-700 dark:bg-amber-500 animate-pulse" />
          <span>{initialSkein ? 'Modify Skein Registry' : 'Document a New Yarn Skein'}</span>
        </h3>
        <button
          id="close-form-btn"
          type="button"
          onClick={onCancel}
          className="p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-850 dark:hover:text-neutral-200 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {errorMsg && (
        <div id="form-error" className="bg-rose-50 border border-rose-200 text-rose-800 text-sm px-4 py-2.5 rounded-xl mb-4 font-sans">
          {errorMsg}
        </div>
      )}

      <form id="yarn-skein-form" onSubmit={handleSubmit} className="space-y-5">
        
        {/* Brand & Line Selection Block */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Brand Selection dropdown */}
          <div id="form-group-brand">
            <label className="block text-xs font-mono font-medium text-neutral-600 dark:text-neutral-400 mb-1 uppercase tracking-wider">
              Spinner / Brand <span className="text-amber-805 dark:text-amber-500">*</span>
            </label>
            <select
              id="form-select-brand"
              className="w-full bg-white dark:bg-[#121110] text-sm text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 outline-none focus:border-amber-700 dark:focus:border-amber-500 focus:ring-1 focus:ring-amber-700 transition"
              value={selectedBrand}
              onChange={handleBrandChange}
            >
              <option value="" disabled className="bg-white dark:bg-[#1C1917]">-- Select Brand --</option>
              {availableBrands.map(b => (
                <option key={b} value={b} className="bg-white dark:bg-[#1C1917]">{b}</option>
              ))}
              <option value="__custom__" className="bg-white dark:bg-[#1C1917]">[ + Add Custom Brand... ]</option>
            </select>

            {isCustomBrand && (
              <input
                id="form-input-brand-custom"
                type="text"
                required
                placeholder="Type brand name..."
                className="mt-2 w-full bg-white dark:bg-[#121110] text-sm text-neutral-855 dark:text-neutral-100 px-3 py-2.5 rounded-xl border border-amber-600/30 outline-none focus:border-amber-700 dark:focus:border-amber-500 focus:ring-1 focus:ring-amber-700 transition"
                value={customBrand}
                onChange={(e) => setCustomBrand(e.target.value)}
              />
            )}
          </div>

          {/* Yarn Line / Model selection dropdown */}
          <div id="form-group-name">
            <label className="block text-xs font-mono font-medium text-neutral-600 dark:text-neutral-400 mb-1 uppercase tracking-wider">
              Yarn Line Name <span className="text-amber-805 dark:text-amber-500">*</span>
            </label>
            {!isCustomBrand && (
              <select
                id="form-select-name"
                className="w-full bg-white dark:bg-[#121110] text-sm text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 outline-none focus:border-amber-700 dark:focus:border-amber-500 focus:ring-1 focus:ring-amber-700 transition"
                value={selectedLine}
                onChange={handleLineChange}
              >
                <option value="" disabled className="bg-white dark:bg-[#1C1917]">-- Select Line --</option>
                {filteredLines.map(l => (
                  <option key={l} value={l} className="bg-white dark:bg-[#1C1917]">{l}</option>
                ))}
                <option value="__custom__" className="bg-white dark:bg-[#1C1917]">[ + Add Custom Line... ]</option>
              </select>
            )}

            {(isCustomLine || isCustomBrand) && (
              <input
                id="form-input-name-custom"
                type="text"
                required
                placeholder="Type yarn line/model (e.g., Cool Wool)..."
                className="mt-2 w-full bg-white dark:bg-[#121110] text-sm text-neutral-855 dark:text-neutral-100 px-3 py-2.5 rounded-xl border border-amber-600/30 outline-none focus:border-amber-700 dark:focus:border-amber-500 focus:ring-1 focus:ring-amber-700 transition"
                value={customLine}
                onChange={(e) => setCustomLine(e.target.value)}
              />
            )}
          </div>
        </div>

        {/* Colorway Info & Accent Hue */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div id="form-group-color">
            <label className="block text-xs font-mono font-medium text-neutral-600 dark:text-neutral-400 mb-1 uppercase tracking-wider">
              Colorway Label
            </label>
            <input
              id="form-input-color"
              type="text"
              placeholder="e.g. Sunset Breeze, Charcoal Heather"
              className="w-full bg-white dark:bg-[#121110] text-sm text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 outline-none focus:border-amber-700 dark:focus:border-amber-500 focus:ring-1 focus:ring-amber-700 transition"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>

          <div id="form-group-colorhex">
            <label className="block text-xs font-mono font-medium text-neutral-600 dark:text-neutral-400 mb-1 uppercase tracking-wider">
              Visual Color Hue Block
            </label>
            <div className="flex items-center space-x-3 bg-white dark:bg-[#121110] p-1 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <input
                id="form-input-colorhex"
                type="color"
                className="w-9 h-9 rounded-lg border-0 p-0 cursor-pointer overflow-hidden outline-none bg-transparent"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
              />
              <div className="flex-1 flex flex-wrap gap-1.5 p-1">
                {PRESET_SHADES.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    title={preset.name}
                    onClick={() => {
                      setColorHex(preset.hex);
                      if (!color) setColor(preset.name);
                    }}
                    className={`w-5.5 h-5.5 rounded-full border transition-all ${
                      colorHex.toLowerCase() === preset.hex.toLowerCase()
                        ? 'border-neutral-905 dark:border-white scale-110 shadow-xs ring-1 ring-neutral-905 dark:ring-white'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: preset.hex }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Hook Selections & physical details */}
        <div id="form-hook-panel" className="bg-[#F6F3ED] dark:bg-[#191715] border border-[#E6DFD3] dark:border-[#2E2925] p-4.5 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-amber-955 dark:text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Grid className="w-4 h-4 text-amber-800" />
              <span>Recommended Crochet Hooks (Select All That Apply)</span>
            </span>
            <button
              type="button"
              onClick={() => setShowHooksRegistry(!showHooksRegistry)}
              className="text-xs font-mono text-amber-805 dark:text-amber-400 hover:text-amber-955 underline underline-offset-2"
            >
              {showHooksRegistry ? 'Collapse Grid' : 'Expand 0.25-12mm Grid'}
            </button>
          </div>

          {/* Render selected hook chips */}
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {activeHooks.length === 0 ? (
              <span className="text-xs text-neutral-450 dark:text-neutral-500 italic">No crochet hooks chosen yet</span>
            ) : (
              activeHooks.map(sz => (
                <span
                  key={sz}
                  className="inline-flex items-center space-x-1 bg-amber-805 text-white font-mono text-xs px-2.5 py-1 rounded-lg border border-amber-900"
                >
                  <span>{sz} mm</span>
                  <button
                    type="button"
                    onClick={() => toggleHookSize(sz)}
                    className="hover:bg-amber-700 rounded p-0.5 ml-1 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>

          {/* Expandable Hook grid categorized by size groupings */}
          {showHooksRegistry && (
            <div className="mt-3 bg-white dark:bg-[#121110] p-3 rounded-xl border border-neutral-250/60 dark:border-neutral-800 max-h-56 overflow-y-auto space-y-3">
              {/* Fine Bracket (< 3.0mm) */}
              <div>
                <p className="text-[10px] font-mono font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1">Fine Hooks (&lt; 3.00 mm)</p>
                <div className="flex flex-wrap gap-1">
                  {HOOK_SIZES_LIST.filter(s => s < 3.0).map(s => {
                    const active = activeHooks.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleHookSize(s)}
                        className={`px-2 py-1 font-mono text-xs rounded-md border text-center transition ${
                          active
                            ? 'bg-amber-100 dark:bg-amber-955/45 border-amber-500 text-amber-900 dark:text-amber-305 font-bold shadow-xxs'
                            : 'bg-white dark:bg-[#1C1917] border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-904'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Medium Bracket (3.0mm to 6.0mm) */}
              <div>
                <p className="text-[10px] font-mono font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1 font-bold">Medium Hooks (3.00 - 6.00 mm)</p>
                <div className="flex flex-wrap gap-1">
                  {HOOK_SIZES_LIST.filter(s => s >= 3.0 && s <= 6.0).map(s => {
                    const active = activeHooks.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleHookSize(s)}
                        className={`px-2 py-1 font-mono text-xs rounded-md border text-center transition ${
                          active
                            ? 'bg-amber-100 dark:bg-amber-955/45 border-amber-500 text-amber-900 dark:text-amber-350 font-bold shadow-xxs'
                            : 'bg-white dark:bg-[#1C1917] border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-904'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bulky Bracket (&gt; 6.0) */}
              <div>
                <p className="text-[10px] font-mono font-semibold text-neutral-400 dark:text-neutral-550 uppercase tracking-widest mb-1">Bulky Hooks (&gt; 6.00 mm)</p>
                <div className="flex flex-wrap gap-1">
                  {HOOK_SIZES_LIST.filter(s => s > 6.0).map(s => {
                    const active = activeHooks.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleHookSize(s)}
                        className={`px-2 py-1 font-mono text-xs rounded-md border text-center transition ${
                          active
                            ? 'bg-amber-100 dark:bg-amber-955/45 border-amber-500 text-amber-900 dark:text-amber-305 font-bold shadow-xxs'
                            : 'bg-white dark:bg-[#1C1917] border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-904'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Meter and Quantity row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Meters */}
          <div id="form-group-yardage">
            <label className="block text-xs font-mono font-medium text-neutral-600 dark:text-neutral-400 mb-1 uppercase tracking-wider">
              Total Length (Meters per Skein)
            </label>
            <div className="relative">
              <input
                id="form-input-yardage"
                type="number"
                min="0"
                placeholder="e.g. 200"
                className="w-full bg-white dark:bg-[#121110] text-sm text-neutral-850 dark:text-neutral-100 px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 outline-none focus:border-amber-700 dark:focus:border-amber-500 focus:ring-1 focus:ring-amber-700 transition"
                value={meters}
                onChange={(e) => setMeters(e.target.value === '' ? '' : Number(e.target.value))}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-neutral-400 dark:text-neutral-550">meters</span>
            </div>
          </div>

          {/* Quantity skeins */}
          <div id="form-group-quantity">
            <label className="block text-xs font-mono font-medium text-neutral-600 dark:text-neutral-400 mb-1 uppercase tracking-wider">
              Quantity / Skeins Owned
            </label>
            <div className="flex items-center overflow-hidden bg-white dark:bg-[#121110] rounded-xl border border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                id="form-qty-dec"
                onClick={() => setQuantity(Math.max(0, quantity - 1))}
                className="px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-205 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold border-r border-neutral-200 dark:border-neutral-800 transition"
              >
                -
              </button>
              <input
                id="form-input-quantity"
                type="number"
                min="0"
                className="w-full bg-transparent text-sm text-neutral-850 dark:text-neutral-100 text-center font-mono outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
              />
              <button
                type="button"
                id="form-qty-inc"
                onClick={() => setQuantity(quantity + 1)}
                className="px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-205 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold border-l border-neutral-200 dark:border-neutral-800 transition"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div id="form-group-notes">
          <label className="block text-xs font-mono font-medium text-neutral-600 dark:text-neutral-400 mb-1 uppercase tracking-wider">
            Skein Notes / Fiber Blend / Project Ideas
          </label>
          <textarea
            id="form-input-notes"
            rows={3}
            placeholder="e.g. 100% Superwash Merino. Very soft, high twist. Purchased for crocheting autumnal lace projects..."
            className="w-full bg-white dark:bg-[#121110] text-sm text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 outline-none focus:border-amber-700 dark:focus:border-amber-500 focus:ring-1 focus:ring-amber-700 transition"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Form Controls */}
        <div id="form-controls" className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E6DFD3] dark:border-[#2E2925]">
          <button
            type="button"
            id="form-btn-cancel"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-450 hover:bg-neutral-250/60 dark:hover:bg-neutral-800 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            id="form-btn-submit"
            className="px-5 py-2.5 text-xs font-mono uppercase tracking-wider bg-amber-805 hover:bg-amber-900 text-white font-medium rounded-xl inline-flex items-center space-x-2 shadow-xs transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{initialSkein ? 'Save Changes' : 'Add to Stash'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
