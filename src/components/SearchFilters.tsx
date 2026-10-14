/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SlidersHorizontal, Search } from 'lucide-react';

interface SearchFiltersProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedHook: string;
  setSelectedHook: (val: string) => void;
  availableHookSizes: string[]; // List of hook sizes that exist in stash
  stockFilter: 'all' | 'inStock' | 'outOfStock';
  setStockFilter: (val: 'all' | 'inStock' | 'outOfStock') => void;
  sortBy: string;
  setSortBy: (val: string) => void;
}

export default function SearchFilters({
  searchQuery,
  setSearchQuery,
  selectedHook,
  setSelectedHook,
  availableHookSizes,
  stockFilter,
  setStockFilter,
  sortBy,
  setSortBy,
}: SearchFiltersProps) {
  return (
    <div id="search-filters" className="bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DFD3] dark:border-[#2E2925] p-5 rounded-2xl mb-6 shadow-xs transition-all">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div id="filter-search-container" className="relative md:col-span-2">
          <label className="block text-xs font-mono font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">
            Search Inventory
          </label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-450 dark:text-neutral-500" />
            <input
              id="search-input"
              type="text"
              placeholder="Search by brand, name, colorway, or note..."
              className="w-full bg-white dark:bg-[#121110] text-sm text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-850 outline-none focus:border-amber-700 dark:focus:border-amber-500 focus:ring-1 focus:ring-amber-700 transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Dynamic Hook Size Filter */}
        <div id="filter-hook-container">
          <label className="block text-xs font-mono font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">
            Filter by Hook (mm)
          </label>
          <select
            id="filter-hook-select"
            className="w-full bg-white dark:bg-[#121110] text-sm text-neutral-800 dark:text-neutral-100 py-2.5 px-3 rounded-xl border border-neutral-200 dark:border-neutral-850 outline-none focus:border-amber-700 dark:focus:border-amber-500 focus:ring-1 focus:ring-amber-700 transition"
            value={selectedHook}
            onChange={(e) => setSelectedHook(e.target.value)}
          >
            <option value="" className="bg-white dark:bg-[#1C1917]">All Hook Sizes</option>
            {availableHookSizes.map((size) => (
              <option key={size} value={size} className="bg-white dark:bg-[#1C1917]">
                {size} mm
              </option>
            ))}
          </select>
        </div>

        {/* Sort Order */}
        <div id="filter-sort-container">
          <label className="block text-xs font-mono font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">
            Sort Order
          </label>
          <div className="relative">
            <select
              id="filter-sort-select"
              className="w-full bg-white dark:bg-[#121110] text-sm text-neutral-800 dark:text-neutral-100 py-2.5 px-3 rounded-xl border border-neutral-200 dark:border-neutral-850 outline-none focus:border-amber-700 dark:focus:border-amber-500 focus:ring-1 focus:ring-amber-700 transition"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="recent" className="bg-white dark:bg-[#1C1917]">Recently Added</option>
              <option value="brand" className="bg-white dark:bg-[#1C1917]">Brand (A - Z)</option>
              <option value="name" className="bg-white dark:bg-[#1C1917]">Name (A - Z)</option>
              <option value="quantity-desc" className="bg-white dark:bg-[#1C1917]">Quantity (High to Low)</option>
              <option value="quantity-asc" className="bg-white dark:bg-[#1C1917]">Quantity (Low to High)</option>
              <option value="meters-desc" className="bg-white dark:bg-[#1C1917]">Meters (High to Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stock toggle tabs */}
      <div id="stock-toggle-bar" className="flex items-center justify-between border-t border-neutral-200 dark:border-neutral-850 mt-4 pt-4">
        <div className="flex items-center space-x-2">
          <SlidersHorizontal className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
          <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Stock Level:</span>
          <div className="inline-flex bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-850">
            <button
              id="filter-stock-all"
              onClick={() => setStockFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                stockFilter === 'all'
                  ? 'bg-white dark:bg-[#121110] text-amber-900 dark:text-amber-400 shadow-xs border border-neutral-200/50 dark:border-neutral-700'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              All Items
            </button>
            <button
              id="filter-stock-instack"
              onClick={() => setStockFilter('inStock')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                stockFilter === 'inStock'
                  ? 'bg-white dark:bg-[#121110] text-amber-900 dark:text-amber-400 shadow-xs border border-neutral-200/50 dark:border-neutral-700'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              In Stock Only
            </button>
            <button
              id="filter-stock-out"
              onClick={() => setStockFilter('outOfStock')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                stockFilter === 'outOfStock'
                  ? 'bg-white dark:bg-[#121110] text-amber-900 dark:text-amber-400 shadow-xs border border-neutral-200/50 dark:border-neutral-700'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              Out of Stock
            </button>
          </div>
        </div>

        {searchQuery || selectedHook || stockFilter !== 'all' ? (
          <button
            id="clear-filters-btn"
            onClick={() => {
              setSearchQuery('');
              setSelectedHook('');
              setStockFilter('all');
            }}
            className="text-xs font-mono text-amber-800 dark:text-amber-405 hover:text-amber-950 dark:hover:text-amber-300 underline underline-offset-2 transition"
          >
            Reset Filters
          </button>
        ) : null}
      </div>
    </div>
  );
}
