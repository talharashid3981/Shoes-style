import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Grid, List, ChevronLeft, ChevronRight,
  Star, X, SlidersHorizontal, Heart, ChevronDown,
  Search, Package,
} from 'lucide-react';
import useProducts from '../hooks/useProducts';
import useCategories from '../hooks/useCategories';
import useWishlist from '../hooks/useWishlist';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const StarRow = ({ rating, size = 3 }) => (
  <div className="flex items-center gap-px">
    {[1, 2, 3, 4, 5].map(s => (
      <Star key={s} className={`${({ 3: 'w-3 h-3', 4: 'w-4 h-4', 5: 'w-5 h-5' }[size] || 'w-3 h-3')} flex-shrink-0 ${
        s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-100'
      }`} />
    ))}
  </div>
);

const LabelBadge = ({ label }) => {
  if (!label) return null;
  const cls = {
    Sale: 'bg-red-500 text-white',
    New: 'bg-emerald-500 text-white',
    'Best Seller': 'bg-amber-500 text-white',
  }[label] || 'bg-gray-800 text-white';
  return (
    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  );
};

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest' },
  { value: 'price',      label: 'Price: Low → High' },
  { value: '-price',     label: 'Price: High → Low' },
  { value: '-soldCount', label: 'Best Selling' },
  { value: '-rating',    label: 'Top Rated' },
];

// ─── Main Component ────────────────────────────────────────────────────────────

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, total, page, pages, isLoading, fetchProducts } = useProducts();
  const { categories, fetchCategories } = useCategories();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [viewMode, setViewMode]       = useState('grid');

  const [filters, setFilters] = useState({
    keyword:    searchParams.get('keyword')    || '',
    category:   searchParams.get('category')   || '',
    collection: searchParams.get('collection') || '',
    label:      searchParams.get('label')      || '',
    minPrice:   searchParams.get('minPrice')   || '',
    maxPrice:   searchParams.get('maxPrice')   || '',
    sort:       searchParams.get('sort')       || '-createdAt',
    page:       Number(searchParams.get('page')) || 1,
  });

  useEffect(() => { fetchCategories(); }, []);

  useEffect(() => {
    const params = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) params[k] = v;
    });
    params.limit = 12;
    fetchProducts(params);
    setSearchParams(params);
  }, [filters]);

  const setFilter = useCallback((key, value) => {
    setFilters(f => ({ ...f, [key]: value, page: 1 }));
  }, []);

  const clearFilters = () => {
    setFilters({ keyword: '', category: '', collection: '', label: '', minPrice: '', maxPrice: '', sort: '-createdAt', page: 1 });
  };

  const goPage = (p) => setFilters(f => ({ ...f, page: p }));

  const activeFilterCount = [filters.category, filters.label, filters.minPrice, filters.maxPrice, filters.keyword]
    .filter(Boolean).length;

  return (
    <div className="min-h-screen bg-white pt-20">

      {/* ── Sticky toolbar: [Filter btn] | [count + chips] | [sort] [view] ── */}
      <div className="sticky top-16 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-13 py-2 gap-3">

            {/* Filter toggle — desktop */}
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className={`hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all flex-shrink-0 ${
                sidebarOpen
                  ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className={`text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center leading-none ${
                  sidebarOpen ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'
                }`}>{activeFilterCount}</span>
              )}
            </button>

            {/* Filter toggle — mobile */}
            <button
              onClick={() => setDrawerOpen(true)}
              className={`lg:hidden flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all flex-shrink-0 ${
                activeFilterCount > 0
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center bg-white text-gray-900">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <div className="hidden lg:block w-px h-5 bg-gray-200 flex-shrink-0" />

            {/* Center: count + active filter chips */}
            <div className="flex-1 flex items-center gap-2 min-w-0 overflow-hidden">
              <span className="text-sm font-semibold text-gray-500 whitespace-nowrap flex-shrink-0">
                {isLoading ? '…' : `${total ?? 0} ${(total ?? 0) === 1 ? 'product' : 'products'}`}
              </span>

              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-1">
                {filters.keyword && (
                  <FilterChip label={`"${filters.keyword}"`} onRemove={() => setFilter('keyword', '')} />
                )}
                {filters.category && (
                  <FilterChip label={filters.category} onRemove={() => setFilter('category', '')} />
                )}
                {filters.label && (
                  <FilterChip label={filters.label} onRemove={() => setFilter('label', '')} />
                )}
                {(filters.minPrice || filters.maxPrice) && (
                  <FilterChip
                    label={`Rs. ${filters.minPrice || 0}–${filters.maxPrice || '∞'}`}
                    onRemove={() => setFilters(f => ({ ...f, minPrice: '', maxPrice: '', page: 1 }))}
                  />
                )}
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="flex-shrink-0 text-[10px] text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded-lg hover:bg-red-50 transition whitespace-nowrap"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Right: sort + view */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="relative">
                <select
                  value={filters.sort}
                  onChange={e => setFilter('sort', e.target.value)}
                  className="appearance-none pl-3 pr-7 py-1.5 border border-gray-200 rounded-xl text-xs sm:text-sm bg-white text-gray-700 focus:outline-none focus:border-gray-400 cursor-pointer"
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>

              <div className="flex border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 transition ${viewMode === 'grid' ? 'bg-gray-900 text-white' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 transition ${viewMode === 'list' ? 'bg-gray-900 text-white' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">

          {/* Desktop sidebar */}
          {sidebarOpen && (
            <aside className="hidden lg:block w-52 flex-shrink-0">
              <div className="sticky top-32">
                <FiltersSidebar
                  filters={filters}
                  categories={categories}
                  setFilter={setFilter}
                  setFilters={setFilters}
                  clearFilters={clearFilters}
                />
              </div>
            </aside>
          )}

          {/* Mobile drawer */}
          {drawerOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
              <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl overflow-y-auto">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
                  <h2 className="font-bold text-gray-900">Filters</h2>
                  <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <div className="p-5">
                  <FiltersSidebar
                    filters={filters}
                    categories={categories}
                    setFilter={setFilter}
                    setFilters={setFilters}
                    clearFilters={clearFilters}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Products area */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className={viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-3 gap-3 lg:gap-5'
                : 'space-y-3'}>
                {[...Array(12)].map((_, i) => (
                  <div key={i} className={`rounded-2xl bg-gray-100 animate-pulse ${viewMode === 'grid' ? 'aspect-[4/5]' : 'h-28'}`} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Package className="w-14 h-14 text-gray-200 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-1">No products found</h3>
                <p className="text-gray-400 text-sm mb-6">Try adjusting your filters or search terms.</p>
                <button onClick={clearFilters} className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition">
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:gap-5">
                    {products.map(p => <ProductGridCard key={p._id} product={p} />)}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {products.map(p => <ProductListCard key={p._id} product={p} />)}
                  </div>
                )}

                {pages > 1 && (
                  <div className="flex justify-center items-center gap-1.5 mt-12">
                    <button
                      onClick={() => goPage(filters.page - 1)}
                      disabled={filters.page <= 1}
                      className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft className="w-4 h-4" />Prev
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: pages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === pages || Math.abs(p - filters.page) <= 1)
                        .reduce((acc, p, i, arr) => {
                          if (i > 0 && p - arr[i - 1] > 1) acc.push('…');
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((p, i) => p === '…'
                          ? <span key={`d${i}`} className="px-2 py-2 text-gray-300 text-sm">…</span>
                          : (
                            <button key={p} onClick={() => goPage(p)}
                              className={`w-9 h-9 rounded-xl text-sm font-semibold transition ${
                                filters.page === p ? 'bg-gray-900 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                              }`}
                            >{p}</button>
                          )
                        )}
                    </div>
                    <button
                      onClick={() => goPage(filters.page + 1)}
                      disabled={filters.page >= pages}
                      className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      Next<ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Filter Chip ───────────────────────────────────────────────────────────────

const FilterChip = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full flex-shrink-0 whitespace-nowrap">
    {label}
    <button onClick={onRemove} className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-gray-300 transition">
      <X className="w-2.5 h-2.5" />
    </button>
  </span>
);

// ─── Filters Sidebar ───────────────────────────────────────────────────────────

const FiltersSidebar = ({ filters, categories, setFilter, setFilters, clearFilters }) => {
  const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition bg-white";
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Search</p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input type="text" value={filters.keyword} onChange={e => setFilter('keyword', e.target.value)} placeholder="Search…" className={`${inputCls} pl-8`} />
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Category</p>
        <div className="space-y-0.5">
          {[{ _id: 'all', name: 'All Categories', slug: '' }, ...categories].map(cat => (
            <button key={cat._id} onClick={() => setFilter('category', cat.slug)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${filters.category === cat.slug ? 'bg-gray-900 text-white font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
            >{cat.name}</button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Label</p>
        <div className="space-y-0.5">
          {[{ v: '', l: 'All' }, { v: 'New', l: 'New' }, { v: 'Sale', l: 'Sale' }, { v: 'Best Seller', l: 'Best Seller' }].map(({ v, l }) => (
            <button key={v || 'all'} onClick={() => setFilter('label', v)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${filters.label === v ? 'bg-gray-900 text-white font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
            >{l}</button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Price Range</p>
        <div className="flex gap-2 items-center">
          <input type="number" min="0" placeholder="Min Rs" value={filters.minPrice} onChange={e => setFilter('minPrice', e.target.value)} className={inputCls} />
          <span className="text-gray-300 text-xs flex-shrink-0">—</span>
          <input type="number" min="0" placeholder="Max Rs" value={filters.maxPrice} onChange={e => setFilter('maxPrice', e.target.value)} className={inputCls} />
        </div>
        {(filters.minPrice || filters.maxPrice) && (
          <button onClick={() => setFilters(f => ({ ...f, minPrice: '', maxPrice: '', page: 1 }))} className="mt-1.5 text-xs text-red-500 hover:text-red-700 font-medium transition">Clear price</button>
        )}
      </div>
    </div>
  );
};

// ─── Product Grid Card ─────────────────────────────────────────────────────────

const ProductGridCard = ({ product }) => {
  const image       = product.images?.[0]?.url || 'https://placehold.co/400x500';
  const hasDiscount = product.compareAtPrice > product.price;
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [wishlisted, setWishlisted] = useState(isInWishlist(product._id));

  const toggleWishlist = async (e) => {
    e.preventDefault(); e.stopPropagation();
    try {
      wishlisted ? await removeFromWishlist(product._id) : await addToWishlist(product._id);
      setWishlisted(w => !w);
    } catch {}
  };

  return (
    <Link to={`/products/${product.slug || product._id}`} className="group block">
      {/* ✅ aspect-[4/5] — compact, not too tall, dominant image */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-gray-100 mb-2.5">
        <img
          src={image} alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          loading="lazy"
        />
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
          <LabelBadge label={product.label} />
          {hasDiscount && (
            <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
              -{Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%
            </span>
          )}
        </div>
        <button
          onClick={toggleWishlist}
          className="absolute top-2.5 right-2.5 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 hover:scale-110 transition-all duration-200"
        >
          <Heart className={`w-3.5 h-3.5 ${wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
        </button>
        {product.totalStock === 0 && (
          <div className="absolute inset-0 bg-black/35 flex items-end justify-center pb-3">
            <span className="text-white text-[10px] font-black bg-black/60 px-3 py-1 rounded-full uppercase tracking-widest">Sold Out</span>
          </div>
        )}
      </div>

      <div className="space-y-0.5 px-0.5">
        {product.categories?.[0] && (
          <p className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold">{product.categories[0].name}</p>
        )}
        <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-1 group-hover:text-gray-500 transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-1.5 pt-0.5">
          <span className="font-bold text-gray-900 text-sm">Rs. {product.price?.toLocaleString()}</span>
          {hasDiscount && <span className="text-xs text-gray-400 line-through">Rs. {product.compareAtPrice?.toLocaleString()}</span>}
        </div>
        {product.rating > 0 && (
          <div className="flex items-center gap-1">
            <StarRow rating={product.rating} size={3} />
            <span className="text-[10px] text-gray-400">({product.numReviews})</span>
          </div>
        )}
        {product.variants?.length > 1 && (
          <div className="flex items-center gap-1 pt-0.5">
            {product.variants.slice(0, 5).map(v => (
              <div key={v.color} title={v.color} className="w-2.5 h-2.5 rounded-full border border-gray-300"
                style={{ backgroundColor: v.colorCode || '#9ca3af' }} />
            ))}
            {product.variants.length > 5 && <span className="text-[9px] text-gray-400">+{product.variants.length - 5}</span>}
          </div>
        )}
      </div>
    </Link>
  );
};

// ─── Product List Card ─────────────────────────────────────────────────────────

const ProductListCard = ({ product }) => {
  const image       = product.images?.[0]?.url || 'https://placehold.co/200x200';
  const hasDiscount = product.compareAtPrice > product.price;
  return (
    <Link to={`/products/${product.slug || product._id}`}
      className="group flex gap-4 bg-white border border-gray-100 rounded-2xl p-3.5 hover:shadow-md hover:border-gray-200 transition-all"
    >
      <div className="relative w-24  h-24 sm:w-28 sm:h-28 md:w-24 md:h-24 lg:w-20 lg:h-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
        <img src={image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        {product.label && <div className="absolute top-1.5 left-1.5"><LabelBadge label={product.label} /></div>}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div className="min-w-0">
          {product.categories?.[0] && (
            <p className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold mb-0.5">{product.categories[0].name}</p>
          )}
          <h3 className="font-semibold text-gray-900 text-sm group-hover:text-gray-500 transition line-clamp-1">{product.name}</h3>
          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mt-0.5">{product.description}</p>
        </div>
        <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-gray-900 text-sm">Rs. {product.price?.toLocaleString()}</span>
            {hasDiscount && (
              <>
                <span className="text-xs text-gray-400 line-through">Rs. {product.compareAtPrice?.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">
                  -{Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%
                </span>
              </>
            )}
            {product.rating > 0 && (
              <div className="flex items-center gap-1 ml-1">
                <StarRow rating={product.rating} size={3} />
                <span className="text-[10px] text-gray-400">({product.numReviews})</span>
              </div>
            )}
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            product.totalStock === 0 ? 'bg-red-50 text-red-500 border-red-200'
            : product.totalStock <= 5 ? 'bg-amber-50 text-amber-600 border-amber-200'
            : 'bg-emerald-50 text-emerald-600 border-emerald-200'
          }`}>
            {product.totalStock === 0 ? 'Sold Out' : product.totalStock <= 5 ? `${product.totalStock} left` : 'In Stock'}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default Products;
