/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { YarnSkein } from '../types';
import { Trash, Edit, Plus, Minus, Hash, Ruler, FileText, Bookmark, Anchor } from 'lucide-react';

interface YarnCardProps {
  key?: React.Key;
  skein: YarnSkein;
  onEdit: (skein: YarnSkein) => void;
  onDelete: (id: string) => void;
  onUpdateQty: (id: string, newQty: number) => void;
}

export default function YarnCard({ skein, onEdit, onDelete, onUpdateQty }: YarnCardProps) {
  const totalMeters = skein.meters * skein.quantity;
  const isOutOfStock = skein.quantity === 0;

  // Split recommended hook size comma list
  const sizes = skein.hookSizes
    ? skein.hookSizes.split(',').map((val) => val.trim()).filter(Boolean)
    : [];

  return (
    <div
      id={`yarn-card-${skein.id}`}
      style={{ borderLeftColor: skein.colorHex || '#E6DFD3' }}
      className={`relative bg-white dark:bg-[#1C1917] border-1 border-[#E6DFD3] dark:border-[#2E2925] border-l-8 rounded-2xl shadow-xs hover:shadow-md transition-all duration-305 flex flex-col justify-between overflow-hidden ${
        isOutOfStock ? 'opacity-70 bg-neutral-50/70 border-dashed dark:bg-neutral-900/40' : ''
      }`}
    >
      {/* Depleted/Out Of Stock Stamp */}
      {isOutOfStock && (
        <div id="badge-depleted" className="absolute top-3 right-3 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-sm tracking-wider rotate-3 select-none">
          Stash Empty
        </div>
      )}

      <div className="p-5 flex-1 flex flex-col justify-between">
        {/* Brand & Name */}
        <div>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-mono font-semibold text-amber-900/80 dark:text-amber-500/90 uppercase tracking-widest block">
                {skein.brand}
              </span>
              <h4 className="text-[17px] font-serif font-black text-neutral-800 dark:text-neutral-100 leading-tight mt-0.5">
                {skein.name}
              </h4>
            </div>
          </div>

          {/* Colorway Tag */}
          <div className="flex items-center space-x-2 mt-2.5 mb-3.5">
            <span
              className="w-4.5 h-4.5 rounded-full border border-neutral-300 dark:border-neutral-700 shadow-xxs flex-shrink-0"
              style={{ backgroundColor: skein.colorHex || '#E6DFD3' }}
            />
            <span className="text-sm font-sans font-medium text-neutral-700 dark:text-neutral-300 truncate" title={skein.color}>
              {skein.color}
            </span>
          </div>

          {/* Specs Block */}
          <div className="space-y-2 border-t border-neutral-100 dark:border-neutral-850 pt-3 text-xs text-neutral-600 dark:text-neutral-400">
            {/* Suitable Hook size Tags */}
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <Bookmark className="w-3.5 h-3.5 text-neutral-450 dark:text-neutral-500 flex-shrink-0" />
                <span className="font-mono text-[10px] text-neutral-400 dark:text-neutral-550 uppercase">Recommended Hooks:</span>
              </div>
              <div className="flex flex-wrap gap-1 pl-5">
                {sizes.length > 0 ? (
                  sizes.map((sz) => (
                    <span
                      key={sz}
                      className="inline-flex items-center bg-amber-50 dark:bg-amber-950/45 text-amber-900 dark:text-amber-300 px-1.5 py-0.5 rounded-md border border-amber-200/50 dark:border-amber-900/30 font-mono text-[10.5px] font-semibold"
                    >
                      {sz} mm
                    </span>
                  ))
                ) : (
                  <span className="text-neutral-405 dark:text-neutral-500 text-[11px] italic">Not specified</span>
                )}
              </div>
            </div>

            {/* Meter length */}
            <div className="flex items-center space-x-2 pt-1">
              <Ruler className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
              <span className="font-mono text-[10px] text-neutral-400 dark:text-neutral-550 uppercase">Skein Length:</span>
              <span className="font-sans font-medium text-neutral-700 dark:text-neutral-300">
                {skein.meters > 0 ? `${skein.meters} m` : 'Unspecified'}
              </span>
            </div>

            {/* Total length */}
            {skein.quantity > 0 && skein.meters > 0 && (
              <div className="flex items-center space-x-2">
                <Hash className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
                <span className="font-mono text-[10px] text-neutral-400 dark:text-neutral-550 uppercase">Total Length:</span>
                <span className="font-sans font-semibold text-neutral-800 dark:text-neutral-100 bg-[#E4ECF0]/40 dark:bg-sky-955/20 px-1.5 py-0.5 rounded text-[11.5px]">
                  {totalMeters.toLocaleString()} m
                </span>
              </div>
            )}
          </div>

          {/* Notes display */}
          {skein.notes && (
            <div className="mt-3.5 bg-[#FAF8F5] dark:bg-[#121110] border border-neutral-150/55 dark:border-neutral-850 p-2.5 rounded-xl flex items-start space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-neutral-600 dark:text-neutral-450 line-clamp-3 leading-snug">
                {skein.notes}
              </p>
            </div>
          )}
        </div>

        {/* Quantities adjuster and operations */}
        <div className="mt-5 border-t border-neutral-100 dark:border-neutral-850 pt-4 flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <button
              id={`qty-dec-${skein.id}`}
              onClick={() => onUpdateQty(skein.id, Math.max(0, skein.quantity - 1))}
              className="p-1.5 bg-neutral-105 dark:bg-neutral-800 hover:bg-neutral-200/80 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-lg transition"
              title="Minus 1 skein"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <div className="px-3 text-center animate-fade-in">
              <span className="block font-mono text-[10px] text-neutral-400 dark:text-neutral-550 uppercase leading-none">skeins</span>
              <span className="font-mono text-base font-black text-neutral-805 dark:text-neutral-100 leading-none">
                {skein.quantity}
              </span>
            </div>
            <button
              id={`qty-inc-${skein.id}`}
              onClick={() => onUpdateQty(skein.id, skein.quantity + 1)}
              className="p-1.5 bg-neutral-105 dark:bg-neutral-800 hover:bg-neutral-200/80 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-lg transition"
              title="Plus 1 skein"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Edit/Delete Actions */}
          <div className="flex items-center space-x-1">
            <button
              id={`edit-btn-${skein.id}`}
              onClick={() => onEdit(skein)}
              className="p-2 hover:bg-amber-50 dark:hover:bg-amber-950/45 rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-amber-900 dark:hover:text-amber-305 transition"
              title="Edit Yarn Specs"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              id={`delete-btn-${skein.id}`}
              onClick={() => onDelete(skein.id)}
              className="p-2 hover:bg-rose-50 dark:hover:bg-rose-955/45 rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-rose-700 dark:hover:text-rose-305 transition"
              title="Remove from DB"
            >
              <Trash className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
