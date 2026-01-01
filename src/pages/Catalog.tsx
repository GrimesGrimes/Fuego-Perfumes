import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { products, getUniqueHouses, getUniqueCategories, type Product } from '../data/products';
import SearchBar from '../components/SearchBar';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';

type SortOption = 'popular' | 'az' | 'code';

interface Filters {
  gender: 'all' | 'men' | 'women';
  lines: string[];
  houses: string[];
  categories: string[];
  search: string;
}

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // ✅ filtros “aplicados” (lo que se ve en el grid)
  const [filters, setFilters] = useState<Filters>({
    gender: 'all',
    lines: [],
    houses: [],
    categories: [],
    search: '',
  });

  // ✅ móvil: bottom-sheet + filtros “draft” (solo se aplican al aceptar)
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<Filters>(filters);

  // Initialize filters from URL params
  useEffect(() => {
    const gender = searchParams.get('gender') as 'men' | 'women' | null;
    const line = searchParams.get('line');
    const house = searchParams.get('house');
    const category = searchParams.get('category');
    const q = searchParams.get('q');

    const next: Filters = {
      gender: gender || 'all',
      lines: line ? [line] : [],
      houses: house ? [house] : [],
      categories: category ? [category] : [],
      search: q || '',
    };

    setFilters(next);
    setDraftFilters(next);
  }, [searchParams]);

  const houses = useMemo(() => getUniqueHouses(), []);
  const categories = useMemo(() => getUniqueCategories(), []);

  // ---------- Helpers ----------
  const applyFilters = useCallback((list: Product[], f: Filters, s: SortOption) => {
    let result = [...list];

    // Search
    if (f.search) {
      const q = f.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.code.toLowerCase().includes(q) ||
          p.inspiredByName.toLowerCase().includes(q) ||
          p.house.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          p.line.toLowerCase().includes(q)
      );
    }

    // Gender
    if (f.gender !== 'all') {
      result = result.filter((p) => p.gender === f.gender);
    }

    // Line
    if (f.lines.length > 0) {
      result = result.filter((p) => f.lines.includes(p.line));
    }

    // House
    if (f.houses.length > 0) {
      result = result.filter((p) => f.houses.includes(p.house));
    }

    // Category
    if (f.categories.length > 0) {
      result = result.filter((p) => p.category && f.categories.includes(p.category));
    }

    // Sort
    switch (s) {
      case 'popular':
        result.sort((a, b) => b.popularity - a.popularity);
        break;
      case 'az':
        result.sort((a, b) => a.inspiredByName.localeCompare(b.inspiredByName));
        break;
      case 'code':
        result.sort((a, b) => a.code.localeCompare(b.code));
        break;
    }

    return result;
  }, []);

  const filteredProducts = useMemo(
    () => applyFilters(products, filters, sortBy),
    [applyFilters, filters, sortBy]
  );

  const draftCount = useMemo(() => {
    return applyFilters(products, draftFilters, sortBy).length;
  }, [applyFilters, draftFilters, sortBy]);

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key: 'lines' | 'houses' | 'categories', value: string) => {
    setFilters((prev) => {
      const current = prev[key];
      const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [key]: updated };
    });
  };

  // ✅ draft setters (móvil)
  const updateDraftFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setDraftFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleDraftArrayFilter = (key: 'lines' | 'houses' | 'categories', value: string) => {
    setDraftFilters((prev) => {
      const current = prev[key];
      const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [key]: updated };
    });
  };

  const clearFilters = () => {
    setFilters({
      gender: 'all',
      lines: [],
      houses: [],
      categories: [],
      search: '',
    });
    setSearchParams({});
  };

  const clearDraftFilters = () => {
    setDraftFilters({
      gender: 'all',
      lines: [],
      houses: [],
      categories: [],
      search: filters.search,
    });
  };

  const hasActiveFilters =
    filters.gender !== 'all' ||
    filters.lines.length > 0 ||
    filters.houses.length > 0 ||
    filters.categories.length > 0 ||
    filters.search !== '';

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.gender !== 'all') n += 1;
    n += filters.lines.length;
    n += filters.houses.length;
    n += filters.categories.length;
    if (filters.search.trim()) n += 1;
    return n;
  }, [filters]);

  const activeFilterChips = useMemo(() => {
    const chips: { label: string; onRemove: () => void }[] = [];

    if (filters.gender !== 'all') {
      chips.push({
        label: filters.gender === 'women' ? 'Mujer' : 'Hombre',
        onRemove: () => updateFilter('gender', 'all'),
      });
    }

    filters.lines.forEach((line) => {
      chips.push({
        label: `Linea: ${line}`,
        onRemove: () => toggleArrayFilter('lines', line),
      });
    });

    filters.houses.forEach((house) => {
      chips.push({
        label: house,
        onRemove: () => toggleArrayFilter('houses', house),
      });
    });

    filters.categories.forEach((cat) => {
      chips.push({
        label: cat,
        onRemove: () => toggleArrayFilter('categories', cat),
      });
    });

    if (filters.search) {
      chips.push({
        label: `"${filters.search}"`,
        onRemove: () => updateFilter('search', ''),
      });
    }

    return chips;
  }, [filters]);

  // ✅ abrir/cerrar sheet móvil
  const openMobileFilters = () => {
    setDraftFilters(filters);
    setIsMobileFiltersOpen(true);
  };

  const closeMobileFilters = () => setIsMobileFiltersOpen(false);

  const applyMobileFilters = () => {
    setFilters(draftFilters);
    setIsMobileFiltersOpen(false);
  };

  // ✅ lock scroll al abrir sheet
  useEffect(() => {
    if (!isMobileFiltersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobileFiltersOpen]);

  // ✅ cerrar con ESC
  useEffect(() => {
    if (!isMobileFiltersOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobileFilters();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMobileFiltersOpen]);

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <section className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Catalogo</h1>
          <p className="text-white/60">
            {filteredProducts.length} fragancia{filteredProducts.length !== 1 ? 's' : ''} disponible
            {filteredProducts.length !== 1 ? 's' : ''}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ✅ MAIN primero en móvil */}
          <div className="flex-1 order-1 lg:order-2">
            {/* ✅ Toolbar móvil: buscar + filtros */}
            <div className="lg:hidden mb-6">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <SearchBar variant="catalog" onSearch={(q) => updateFilter('search', q)} />
                </div>

                <button
                  onClick={openMobileFilters}
                  className="relative inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-surface-light border border-border text-white/80 hover:text-white hover:border-white/20 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M6 12h12M10 20h4" />
                  </svg>
                  Filtros
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 rounded-full bg-gold text-black text-xs font-bold grid place-items-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 mt-4">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {activeFilterChips.slice(0, 6).map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={chip.onRemove}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold/10 border border-gold/30 rounded-full text-sm text-gold hover:bg-gold/20 transition-colors"
                    >
                      {chip.label}
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  ))}
                  {activeFilterChips.length > 6 && (
                    <span className="shrink-0 text-sm text-white/40 self-center">+{activeFilterChips.length - 6}</span>
                  )}
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
                >
                  <option value="popular">Populares</option>
                  <option value="az">A-Z</option>
                  <option value="code">Codigo</option>
                </select>
              </div>
            </div>

            {/* ✅ Desktop: Active Filters & Sort */}
            <div className="hidden lg:flex flex-wrap items-center justify-between gap-4 mb-6">
              {activeFilterChips.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {activeFilterChips.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={chip.onRemove}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold/10 border border-gold/30 rounded-full text-sm text-gold hover:bg-gold/20 transition-colors"
                    >
                      {chip.label}
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  ))}
                  <button onClick={clearFilters} className="text-sm text-white/50 hover:text-white transition-colors">
                    Limpiar todo
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <label className="text-sm text-white/50">Ordenar:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
                >
                  <option value="popular">Mas populares</option>
                  <option value="az">A-Z</option>
                  <option value="code">Por codigo</option>
                </select>
              </div>
            </div>

            {/* ✅ Product Grid: 2 columnas en móvil */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.code} product={product} onQuickView={setQuickViewProduct} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <svg className="w-16 h-16 text-white/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-xl font-semibold text-white mb-2">No se encontraron fragancias</h3>
                <p className="text-white/50 mb-4">Intenta ajustar tus filtros de busqueda</p>
                <button onClick={clearFilters} className="btn-secondary">
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>

          {/* ✅ Sidebar SOLO desktop */}
          <aside className="hidden lg:block lg:w-64 flex-shrink-0 order-2 lg:order-1">
            <div className="sticky top-24 space-y-6">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Buscar</label>
                <SearchBar variant="catalog" onSearch={(q) => updateFilter('search', q)} />
              </div>

              {/* Gender Filter */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-3">Genero</label>
                <div className="flex gap-2">
                  {[
                    { value: 'all', label: 'Todos' },
                    { value: 'women', label: 'Mujer' },
                    { value: 'men', label: 'Hombre' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateFilter('gender', opt.value as Filters['gender'])}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        filters.gender === opt.value
                          ? 'bg-gold text-black'
                          : 'bg-surface-light border border-border text-white/70 hover:text-white hover:border-gold/50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Line Filter */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-3">Linea</label>
                <div className="space-y-2">
                  {['FM', 'HM', 'UM'].map((line) => (
                    <label key={line} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.lines.includes(line)}
                        onChange={() => toggleArrayFilter('lines', line)}
                        className="w-4 h-4 rounded border-border bg-surface-light text-gold focus:ring-gold focus:ring-offset-0"
                      />
                      <span className="text-white/70 group-hover:text-white transition-colors">{line}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* House Filter */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-3">Casa / Marca</label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                  {houses.map((house) => (
                    <label key={house} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.houses.includes(house)}
                        onChange={() => toggleArrayFilter('houses', house)}
                        className="w-4 h-4 rounded border-border bg-surface-light text-gold focus:ring-gold focus:ring-offset-0"
                      />
                      <span className="text-white/70 group-hover:text-white transition-colors text-sm">{house}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-3">Categoria / Familia</label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                  {categories.map((cat) => (
                    <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(cat)}
                        onChange={() => toggleArrayFilter('categories', cat)}
                        className="w-4 h-4 rounded border-border bg-surface-light text-gold focus:ring-gold focus:ring-offset-0"
                      />
                      <span className="text-white/70 group-hover:text-white transition-colors text-sm">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Clear Button */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full py-2.5 text-sm font-medium text-white/60 hover:text-white border border-border rounded-lg hover:border-white/30 transition-all"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* ✅ Bottom-sheet filtros móvil */}
      {isMobileFiltersOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={closeMobileFilters} />

          <div
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] rounded-t-3xl bg-surface border-t border-border overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header sheet */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <div>
                <p className="text-white font-semibold">Filtros</p>
                <p className="text-white/50 text-sm">Ajusta y aplica para ver resultados</p>
              </div>
              <button
                onClick={closeMobileFilters}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition"
                aria-label="Cerrar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body sheet */}
            <div className="px-4 py-4 overflow-y-auto space-y-6" style={{ maxHeight: 'calc(85vh - 160px)' }}>
              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-3">Genero</label>
                <div className="flex gap-2">
                  {[
                    { value: 'all', label: 'Todos' },
                    { value: 'women', label: 'Mujer' },
                    { value: 'men', label: 'Hombre' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateDraftFilter('gender', opt.value as Filters['gender'])}
                      className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                        draftFilters.gender === opt.value
                          ? 'bg-gold text-black'
                          : 'bg-surface-light border border-border text-white/70 hover:text-white hover:border-gold/50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Line */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-3">Linea</label>
                <div className="space-y-2">
                  {['FM', 'HM', 'UM'].map((line) => (
                    <label key={line} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={draftFilters.lines.includes(line)}
                        onChange={() => toggleDraftArrayFilter('lines', line)}
                        className="w-4 h-4 rounded border-border bg-surface-light text-gold focus:ring-gold focus:ring-offset-0"
                      />
                      <span className="text-white/70 group-hover:text-white transition-colors">{line}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* House */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-3">Casa / Marca</label>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-2 scrollbar-hide">
                  {houses.map((house) => (
                    <label key={house} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={draftFilters.houses.includes(house)}
                        onChange={() => toggleDraftArrayFilter('houses', house)}
                        className="w-4 h-4 rounded border-border bg-surface-light text-gold focus:ring-gold focus:ring-offset-0"
                      />
                      <span className="text-white/70 group-hover:text-white transition-colors text-sm">{house}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-3">Categoria / Familia</label>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-2 scrollbar-hide">
                  {categories.map((cat) => (
                    <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={draftFilters.categories.includes(cat)}
                        onChange={() => toggleDraftArrayFilter('categories', cat)}
                        className="w-4 h-4 rounded border-border bg-surface-light text-gold focus:ring-gold focus:ring-offset-0"
                      />
                      <span className="text-white/70 group-hover:text-white transition-colors text-sm">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer sheet */}
            <div className="px-4 py-4 border-t border-border bg-surface/80 backdrop-blur">
              <button onClick={applyMobileFilters} className="btn-primary w-full">
                Ver {draftCount} resultado{draftCount !== 1 ? 's' : ''}
              </button>

              <div className="flex gap-3 mt-3">
                <button
                  onClick={clearDraftFilters}
                  className="flex-1 py-2.5 text-sm font-medium text-white/60 hover:text-white border border-border rounded-lg hover:border-white/30 transition-all"
                >
                  Limpiar
                </button>
                <button
                  onClick={closeMobileFilters}
                  className="flex-1 py-2.5 text-sm font-medium text-white/60 hover:text-white border border-border rounded-lg hover:border-white/30 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </main>
  );
}
