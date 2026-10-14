/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { YarnSkein, BrandLine } from './types';
import StatsDashboard from './components/StatsDashboard';
import SearchFilters from './components/SearchFilters';
import YarnCard from './components/YarnCard';
import YarnForm from './components/YarnForm';
import BrandLinesManager from './components/BrandLinesManager';
import { Plus, RotateCcw, Sparkles, Layers, Info, Library, Sun, Moon, Download, Upload, Trash2, AlertTriangle } from 'lucide-react';
import { convertSkeinsToCSV, parseCSVToSkeins } from './utils/csv';

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('yarner-dark-mode');
    if (saved !== null) {
      return saved === 'true';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [purgeStep, setPurgeStep] = useState<0 | 1 | 2>(0);

  const [skeins, setSkeins] = useState<YarnSkein[]>([]);
  const [brandLines, setBrandLines] = useState<BrandLine[]>([]);
  
  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<'inventory' | 'brand-catalog'>('inventory');

  const [showForm, setShowForm] = useState(false);
  const [editingSkein, setEditingSkein] = useState<YarnSkein | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHook, setSelectedHook] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'inStock' | 'outOfStock'>('all');
  const [sortBy, setSortBy] = useState('recent');

  // Set tab title and dark mode class on mount/change
  useEffect(() => {
    document.title = "Yarner • Yarn Skein Stash Database";
  }, []);

  useEffect(() => {
    localStorage.setItem('yarner-dark-mode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load skeins from server SQLite on mount
  useEffect(() => {
    fetch('/api/skeins')
      .then(res => {
        if (!res.ok) throw new Error('API server error');
        return res.json();
      })
      .then(data => {
        setSkeins(data);
      })
      .catch(err => {
        console.error('Failed to fetch skeins from server SQLite:', err);
        showToast('error', 'Failed to connect to SQLite server storage.');
      });
  }, []);

  // Load brand lines from SQLite on mount
  useEffect(() => {
    fetch('/api/brand-lines')
      .then(res => {
        if (!res.ok) throw new Error('API brand-lines database error');
        return res.json();
      })
      .then(data => {
        setBrandLines(data);
      })
      .catch(err => {
        console.error('Failed to fetch brand-lines reference list:', err);
      });
  }, []);

  // Notification helper
  const showToast = (type: 'success' | 'info' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(prev => prev?.message === message ? null : prev);
    }, 4500);
  };

  // Add/Modify Skein Handler
  const handleFormSubmit = (formData: Omit<YarnSkein, 'id' | 'createdAt'>) => {
    if (editingSkein) {
      // Editing on backend
      fetch(`/api/skeins/${editingSkein.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
        .then(res => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then(updatedItem => {
          setSkeins(prev => prev.map(s => s.id === updatedItem.id ? updatedItem : s));
          showToast('success', `Updated specs for ${formData.brand} - ${formData.name}.`);
        })
        .catch(() => {
          showToast('error', 'Failed to save edits to server SQLite.');
        });
    } else {
      // Adding new to backend
      fetch('/api/skeins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
        .then(res => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then(newItem => {
          setSkeins(prev => [newItem, ...prev]);
          showToast('success', `Added ${formData.brand} - ${formData.name} to stash registry.`);
        })
        .catch(() => {
          showToast('error', 'Failed to add yarn to server database.');
        });
    }
    setShowForm(false);
    setEditingSkein(null);
  };

  // Quick Quantity Update on backend
  const handleUpdateQty = (id: string, newQty: number) => {
    const target = skeins.find(s => s.id === id);
    if (!target) return;
    
    const cleanQty = Math.max(0, newQty);
    const updatedRaw = { ...target, quantity: cleanQty };

    fetch(`/api/skeins/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedRaw)
    })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(updatedItem => {
        setSkeins(prev => prev.map(s => s.id === id ? updatedItem : s));
        if (cleanQty === 0) {
          showToast('info', `Stash level depleted for ${target.brand} - ${target.name}.`);
        }
      })
      .catch(() => {
        showToast('error', 'Failed to save quantity changes to backend.');
      });
  };

  // Remove Skein from backend
  const handleDeleteSkein = (id: string) => {
    const target = skeins.find(s => s.id === id);
    if (!target) return;

    if (confirm(`Remove ${target.brand} - ${target.name} from your stash database?`)) {
      fetch(`/api/skeins/${id}`, {
        method: 'DELETE'
      })
        .then(res => {
          if (!res.ok) throw new Error();
          setSkeins(prev => prev.filter(s => s.id !== id));
          showToast('info', `Deleted ${target.brand} registry from database.`);
        })
        .catch(() => {
          showToast('error', 'Failed to drop item from server SQLite database.');
        });
    }
  };

  // Supplement Brand Line reference helper on back-end
  const handleAddBrandLine = (brand: string, line: string) => {
    fetch('/api/brand-lines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand, line })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to save to reference list');
        return res.json();
      })
      .then(newItem => {
        setBrandLines(prev => {
          const exists = prev.some(item => item.id === newItem.id);
          if (exists) return prev;
          return [...prev, newItem].sort((a,b) => a.brand.localeCompare(b.brand) || a.line.localeCompare(b.line));
        });
        showToast('success', `Added database entry for "${brand}" - "${line}".`);
      })
      .catch(() => {
        showToast('error', 'Failed to register brand line helper to SQLite.');
      });
  };

  // Delete brand line reference selection item
  const handleDeleteBrandLine = (id: string) => {
    const target = brandLines.find(bl => bl.id === id);
    if (!target) return;

    if (confirm(`Remove dropdown reference combo "${target.brand} - ${target.line}"?`)) {
      fetch(`/api/brand-lines/${id}`, {
        method: 'DELETE'
      })
        .then(res => {
          if (!res.ok) throw new Error();
          setBrandLines(prev => prev.filter(item => item.id !== id));
          showToast('info', `Removed brand reference combo.`);
        })
        .catch(() => {
          showToast('error', 'Failed to drop brand reference option from database.');
        });
    }
  };

  // Reload Initial Examples (hard reset of skeins catalog)
  const handleResetExamples = () => {
    fetch('/api/skeins/reset-samples', {
      method: 'POST'
    })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        setSkeins(data);
        showToast('success', 'Replenished database with sample stash yarns.');
      })
      .catch(() => {
        showToast('error', 'Failed to reset and load SQLite sample yarns.');
      });
  };

  // Dynamically compute hook sizes that actually exist in the current yarn stash items list
  const availableHookSizes = useMemo(() => {
    const sizesSet = new Set<string>();
    skeins.forEach(s => {
      if (s.hookSizes) {
        s.hookSizes.split(',').forEach(sz => {
          const trimmed = sz.trim();
          if (trimmed) {
            sizesSet.add(trimmed);
          }
        });
      }
    });
    return Array.from(sizesSet).sort((a, b) => parseFloat(a) - parseFloat(b));
  }, [skeins]);

  // Export Stash to CSV helper
  const handleExportCSV = () => {
    try {
      if (skeins.length === 0) {
        showToast('info', 'No registered skeins to export.');
        return;
      }
      const csvString = convertSkeinsToCSV(skeins);
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Yarner_Stash_Backup_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('success', `Exported ${skeins.length} skeins to local CSV backup.`);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      showToast('error', 'Failed to generate and download CSV file.');
    }
  };

  // Import CSV handler
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          showToast('error', 'Unable to read upload content.');
          return;
        }
        const parsedItems = parseCSVToSkeins(text);
        if (parsedItems.length === 0) {
          showToast('error', 'No valid yarn skein rows detected in the CSV file.');
          return;
        }

        // Upload to server via bulk endpoint
        fetch('/api/skeins/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsedItems)
        })
          .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
          })
          .then(data => {
            setSkeins(data);
            showToast('success', `Successfully imported ${parsedItems.length} skeins to database.`);
            return fetch('/api/brand-lines');
          })
          .then(res => res?.json())
          .then(newBrands => {
            if (newBrands) setBrandLines(newBrands);
          })
          .catch(() => {
            showToast('error', 'Server error uploading bulk CSV rows.');
          });

      } catch (err) {
        console.error('Parsing error uploading CSV:', err);
        showToast('error', 'Error occurred whilst parsing CSV file structure.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Final confirmation database clean
  const handleConfirmWipeDatabase = () => {
    fetch('/api/skeins/purge', {
      method: 'POST'
    })
      .then(res => {
        if (!res.ok) throw new Error();
        setSkeins([]);
        showToast('info', 'All database skeins purged successfully.');
      })
      .catch(() => {
        showToast('error', 'Database purge failed on server.');
      })
      .finally(() => {
        setPurgeStep(0);
      });
  };

  // Filter & Sort Logic
  const processedSkeins = useMemo(() => {
    let result = [...skeins];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(s => 
        s.brand.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.color.toLowerCase().includes(q) ||
        s.notes.toLowerCase().includes(q)
      );
    }

    // Recommended hook selection filter
    if (selectedHook) {
      result = result.filter(s => {
        if (!s.hookSizes) return false;
        const array = s.hookSizes.split(',').map(v => v.trim());
        return array.includes(selectedHook);
      });
    }

    // Stock Filter
    if (stockFilter === 'inStock') {
      result = result.filter(s => s.quantity > 0);
    } else if (stockFilter === 'outOfStock') {
      result = result.filter(s => s.quantity === 0);
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'brand':
          return a.brand.localeCompare(b.brand);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'quantity-desc':
          return b.quantity - a.quantity;
        case 'quantity-asc':
          return a.quantity - b.quantity;
        case 'meters-desc':
          return b.meters - a.meters;
        case 'recent':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [skeins, searchQuery, selectedHook, stockFilter, sortBy]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#121110] text-neutral-800 dark:text-neutral-100 font-sans pb-16 antialiased transition-colors duration-300">
      {/* Toast Notification block */}
      {notification && (
        <div
          id="global-toast"
          className={`fixed bottom-6 right-6 z-55 px-5 py-3.5 rounded-2xl shadow-lg border flex items-center space-x-3 max-w-sm transition-all duration-300 ${
            notification.type === 'success'
              ? 'bg-[#EBF7EE] border-emerald-300 text-emerald-950'
              : notification.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-950'
              : 'bg-[#FAF8F5] border-amber-300 text-amber-950'
          }`}
        >
          <Info className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Hero Header Banner */}
      <header id="main-header" className="border-b border-[#E6DFD3] dark:border-[#2E2925] bg-[#FAF8F5] dark:bg-[#1C1917] py-6 px-4 sm:px-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#D38E75] dark:bg-amber-605 flex items-center justify-center text-white shadow-xs">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase bg-amber-100 dark:bg-amber-955/40 text-amber-850 dark:text-amber-400 px-2 py-0.5 rounded-sm">
                  Full-Stoppers SQLite Registry
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" title="Connected to Server DB" />
              </div>
              <h1 className="text-2xl font-serif font-black tracking-tight text-neutral-850 dark:text-neutral-100">
                Yarner
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {skeins.length === 0 && (
              <button
                id="reset-init-data"
                onClick={handleResetExamples}
                className="px-4 py-2 text-xs font-mono uppercase tracking-wider text-[#2C5A66] dark:text-[#E6DFD3] bg-[#E4ECF0] dark:bg-neutral-800/80 hover:bg-[#D4E2E8] dark:hover:bg-neutral-700 rounded-xl transition flex items-center space-x-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Load Sample Stash</span>
              </button>
            )}

            {/* Theme Toggle Button */}
            <button
              id="theme-toggler"
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 bg-white dark:bg-[#121110] border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-[#E6DFD3] hover:text-[#D38E75] dark:hover:text-amber-400 rounded-xl shadow-xxs transition-all cursor-pointer flex items-center justify-center"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            <button
              id="header-add-skein-btn"
              onClick={() => {
                setEditingSkein(null);
                setShowForm(!showForm);
                setActiveTab('inventory'); // force return to inventory tab to edit
              }}
              className="px-5 py-2.5 bg-amber-800 hover:bg-[#D38E75] text-white text-xs font-mono uppercase tracking-wider font-semibold rounded-xl inline-flex items-center space-x-2 shadow-xs hover:shadow-md transition-all duration-300"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>{showForm && !editingSkein ? 'Close Editor' : 'Register Skein'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Sub-header Bar (Tabs Switcher) */}
      <div className="bg-[#F5EFE6] dark:bg-[#161413] border-b border-[#E6DFD3] dark:border-[#2E2925] select-none sticky top-0 z-40 shadow-xs transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex space-x-1 py-2">
            <button
              id="tab-yarns-inventory"
              onClick={() => {
                setActiveTab('inventory');
              }}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider font-semibold transition inline-flex items-center space-x-2 ${
                activeTab === 'inventory'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'text-neutral-650 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Yarn Inventory</span>
            </button>
            
            <button
              id="tab-brands-catalog"
              onClick={() => {
                setActiveTab('brand-catalog');
                setShowForm(false); // hide form on managing drops
              }}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider font-semibold transition inline-flex items-center space-x-2 ${
                activeTab === 'brand-catalog'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'text-neutral-650 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <Library className="w-4 h-4" />
              <span>Brands & Lines Manager</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-8">
        {activeTab === 'inventory' ? (
          <>
            {/* Document Yarn Form Overlay */}
            {showForm && (
              <div id="active-form-overlay" className="mb-8">
                <YarnForm
                  initialSkein={editingSkein}
                  brandLines={brandLines}
                  onSubmit={handleFormSubmit}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingSkein(null);
                  }}
                />
              </div>
            )}

            {/* Stash Utilities Toolbar (CSV Import, Export, Purge Database) */}
            <div id="stash-utilities-toolbar" className="mb-6 flex flex-wrap gap-3 items-center justify-between p-4 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DFD3] dark:border-[#2E2925] rounded-2xl transition-all duration-300">
              <div className="flex flex-wrap gap-2.5 items-center">
                <span className="text-xs font-mono font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mr-1">Data Tools:</span>
                
                {/* Export Button */}
                <button
                  id="btn-export-csv"
                  onClick={handleExportCSV}
                  className="px-3.5 py-1.5 bg-white dark:bg-[#121110] hover:bg-neutral-50 dark:hover:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-[#E6DFD3] rounded-xl text-xs font-mono tracking-wide transition flex items-center space-x-1.5 shadow-xxs cursor-pointer"
                  title="Export your current stash database to a CSV file"
                >
                  <Download className="w-3.5 h-3.5 text-amber-700 dark:text-amber-500" />
                  <span>Backup to CSV</span>
                </button>

                {/* Import Button with hidden file option */}
                <label
                  htmlFor="csv-file-uploader"
                  className="px-3.5 py-1.5 bg-white dark:bg-[#121110] hover:bg-neutral-50 dark:hover:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-[#E6DFD3] rounded-xl text-xs font-mono tracking-wide transition flex items-center space-x-1.5 shadow-xxs cursor-pointer animate-none"
                  title="Bulk import skeins from a CSV file"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
                  <span>Import CSV Stash</span>
                </label>
                <input
                  type="file"
                  id="csv-file-uploader"
                  accept=".csv"
                  className="hidden"
                  onChange={handleImportCSV}
                />
              </div>

              {/* Reset/Purge Group */}
              <div className="flex items-center space-x-2.5">
                {skeins.length > 0 ? (
                  <button
                    id="btn-trigger-purge"
                    onClick={() => setPurgeStep(1)}
                    className="px-3.5 py-1.5 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 border border-rose-150 dark:border-rose-900/40 text-rose-800 dark:text-rose-400 rounded-xl text-xs font-mono tracking-wide transition flex items-center space-x-1.5 shadow-xxs cursor-pointer"
                    title="Clear raw yarn database"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Purge Stash</span>
                  </button>
                ) : (
                  <button
                    id="quick-restore-samples"
                    onClick={handleResetExamples}
                    className="px-3.5 py-1.5 bg-amber-50 dark:bg-amber-955/25 hover:bg-amber-100 dark:hover:bg-amber-900/30 border border-amber-205 dark:border-[#2E2925] text-amber-095 dark:text-amber-400 rounded-xl text-xs font-mono tracking-wide transition flex items-center space-x-1.5 shadow-xxs cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Load Samples</span>
                  </button>
                )}
              </div>
            </div>

            {/* Stats Dashboard */}
            <StatsDashboard skeins={skeins} />

            {/* Queries & Filters panel */}
            <SearchFilters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedHook={selectedHook}
              setSelectedHook={setSelectedHook}
              availableHookSizes={availableHookSizes}
              stockFilter={stockFilter}
              setStockFilter={setStockFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
            />

            {/* Results Header Info */}
            <div id="results-count-bar" className="flex items-center justify-between mb-4 px-1">
              <p className="text-xs font-mono font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Displaying {processedSkeins.length} of {skeins.length} Registered Skeins
              </p>
              {processedSkeins.length > 0 && (
                <span className="text-xs text-neutral-400 dark:text-neutral-500 italic font-sans">
                  * Click +/- buttons to quick-adjust skein counts
                </span>
              )}
            </div>

            {/* Cards Grid */}
            {processedSkeins.length > 0 ? (
              <div id="yarn-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
                {processedSkeins.map((skein) => (
                  <YarnCard
                    key={skein.id}
                    skein={skein}
                    onEdit={(s) => {
                      setEditingSkein(s);
                      setShowForm(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onDelete={handleDeleteSkein}
                    onUpdateQty={handleUpdateQty}
                  />
                ))}
              </div>
            ) : (
              <div
                id="empty-state-card"
                className="flex flex-col items-center justify-center py-20 px-4 bg-[#FAF8F5] dark:bg-[#1C1917] border border-dashed border-[#E6DFD3] dark:border-[#2E2925] rounded-3xl text-center transition-all duration-305"
              >
                <div className="w-16 h-16 rounded-full bg-cream dark:bg-[#121110] p-3 border border-[#E6DFD3] dark:border-[#2E2925] text-amber-900/30 flex items-center justify-center mb-4">
                  <Layers className="w-8 h-8 text-amber-800 dark:text-amber-500" />
                </div>
                <h3 className="text-xl font-serif font-black text-neutral-800 dark:text-neutral-100">
                  {skeins.length === 0 ? 'No fibers registered' : 'No matches found'}
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md mt-1.5 mb-6 leading-relaxed font-sans font-medium">
                  {skeins.length === 0
                    ? "Start documenting your beautiful collection of yarns! Choose from pre-registered spinning brands and yarn lines under the second tab list."
                    : 'Modify your search words, metrics filter or inventory toggles above to locate your skeins.'}
                </p>
                <div className="flex items-center space-x-3">
                  {skeins.length === 0 ? (
                    <>
                      <button
                        id="empty-reset-examples-btn"
                        onClick={handleResetExamples}
                        className="px-5 py-2.5 text-xs font-mono uppercase tracking-wider border border-[#E6DFD3] dark:border-neutral-800 text-neutral-600 dark:text-neutral-405 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-900 transition font-bold cursor-pointer"
                      >
                        Load Examples
                      </button>
                      <button
                        id="empty-add-skein-btn"
                        onClick={() => {
                          setEditingSkein(null);
                          setShowForm(true);
                        }}
                        className="px-5 py-2.5 text-xs font-mono uppercase tracking-wider bg-amber-800 hover:bg-amber-900 text-white rounded-xl shadow-xs transition font-bold cursor-pointer"
                      >
                        Add Yours Now
                      </button>
                    </>
                  ) : (
                    <button
                      id="reset-search-btn"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedHook('');
                        setStockFilter('all');
                      }}
                      className="px-5 py-2.5 text-xs font-mono uppercase tracking-wider bg-amber-800 hover:bg-amber-900 text-white rounded-xl shadow-xs transition cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Second Tab Content (Brands & Lines Manager references) */
          <div className="animate-fade-in">
            <div className="mb-6 bg-amber-50/50 dark:bg-amber-955/15 p-4 border border-amber-205 dark:border-[#2E2925] rounded-xl flex items-start space-x-3 transition-colors duration-300">
              <Sparkles className="w-5 h-5 text-amber-805 dark:text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-mono font-bold text-amber-900 dark:text-amber-400 uppercase">Interactive Setup Catalog</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-350 mt-0.5 leading-relaxed">
                  Manage persistent manufacturers and lines (custom colors, wool ranges, weights) in your personal directory. 
                  Once added here, they are instantly synchronized with the interactive skein document selection selectors so you never have to type them from scratch.
                </p>
              </div>
            </div>
            
            <BrandLinesManager
              brandLines={brandLines}
              onAddBrandLine={handleAddBrandLine}
              onDeleteBrandLine={handleDeleteBrandLine}
            />
          </div>
        )}
      </main>

      {/* Craft Footer block */}
      <footer id="app-footer" className="mt-16 text-center text-xs font-mono text-neutral-400 dark:text-neutral-500 border-t border-[#E6DFD3] dark:border-[#2E2925] pt-6 max-w-7xl mx-auto px-4 transition-colors duration-300">
        <p>© {new Date().getFullYear()} Yarner Companion Database • Beautifully structured for creative hands</p>
        <p className="text-[10px] mt-1 text-neutral-400 dark:text-neutral-600 opacity-60">Persistent container-ready registry powered by SQLite Server</p>
      </footer>

      {/* Purge Double Confirmation Modal Dialog Box */}
      {purgeStep > 0 && (
        <div id="purge-modal-backdrop" className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-55 animate-fade-in">
          <div id="purge-modal-card" className="bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DFD3] dark:border-[#2E2925] w-full max-w-md rounded-2xl p-6 shadow-2xl transition-all duration-300">
            <div className="flex items-start space-x-3.5 mb-4">
              <div className="p-2 sm:p-2.5 rounded-xl bg-amber-50 dark:bg-amber-955/20 text-amber-805 dark:text-amber-500 flex-shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse text-amber-805 dark:text-amber-500" />
              </div>
              <div>
                <h4 className="text-md font-serif font-black text-neutral-850 dark:text-neutral-100">
                  {purgeStep === 1 ? 'Step 1 of 2: Danger Zone Archive Offer' : 'Step 2 of 2: Final Destructive Confirmation'}
                </h4>
                <p className="text-xs font-mono text-neutral-450 dark:text-neutral-500 mt-0.5 tracking-wider">
                  Purging Local SQLite Database
                </p>
              </div>
            </div>

            {purgeStep === 1 ? (
              <div className="space-y-4">
                <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans">
                  You are about to purge all registered yarn skeins from your database. This action is irreversible. 
                  We strongly recommend exporting your current stash to a backup CSV file before wiping the data.
                </p>
                <div className="flex flex-col space-y-2 pt-2">
                  <button
                    id="purge-backup-accent-btn"
                    onClick={() => {
                      handleExportCSV();
                      setPurgeStep(2);
                    }}
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-xs uppercase tracking-wider font-semibold rounded-xl transition shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Backup To CSV & Continue</span>
                  </button>
                  <button
                    id="purge-skip-backup-btn"
                    onClick={() => setPurgeStep(2)}
                    className="w-full py-2.5 bg-white dark:bg-[#121110] hover:bg-neutral-50 dark:hover:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 text-neutral-700 dark:text-[#E6DFD3] font-mono text-xs uppercase tracking-wider font-semibold rounded-xl transition cursor-pointer"
                  >
                    Skip Backup, Continue Wiping
                  </button>
                  <button
                    id="purge-cancel-btn-one"
                    onClick={() => setPurgeStep(0)}
                    className="w-full py-2.5 text-neutral-500 dark:text-neutral-450 hover:bg-neutral-200/45 dark:hover:bg-neutral-800 font-mono text-xs uppercase tracking-wider font-semibold rounded-xl transition cursor-pointer"
                  >
                    Cancel Action
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-[#B91C1C] dark:text-red-400 font-bold bg-red-50 dark:bg-red-955/20 p-3 rounded-lg flex items-center space-x-2">
                  <span>⚠️ WARNING: Absolutely no return path after this selection!</span>
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans">
                  Confirm count: <strong>This deletes all {skeins.length} registered skeins forever.</strong> Are you completely sure you want to proceed and purge the Yarner database stash?
                </p>
                <div className="flex flex-col space-y-2 pt-2">
                  <button
                    id="purge-final-destroy-btn"
                    onClick={handleConfirmWipeDatabase}
                    className="w-full py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-mono text-xs uppercase tracking-wider font-bold rounded-xl transition shadow-md cursor-pointer"
                  >
                    🔥 Delete Stash Permanently
                  </button>
                  <button
                    id="purge-cancel-btn-two"
                    onClick={() => setPurgeStep(0)}
                    className="w-full py-2.5 bg-white dark:bg-[#121110] hover:bg-neutral-50 dark:hover:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 text-neutral-700 dark:text-[#E6DFD3] font-mono text-xs uppercase tracking-wider font-semibold rounded-xl transition cursor-pointer"
                  >
                    Nevermind, Take Me Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
