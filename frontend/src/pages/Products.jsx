import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, Grid, List, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import useProducts from '../hooks/useProducts';
import useCategories from '../hooks/useCategories';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, total, page, pages, isLoading, fetchProducts } = useProducts();
  const { categories, fetchCategories } = useCategories();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  
  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    category: searchParams.get('category') || '',
    collection: searchParams.get('collection') || '',
    label: searchParams.get('label') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || '-createdAt',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const params = {};
    if (filters.keyword) params.keyword = filters.keyword;
    if (filters.category) params.category = filters.category;
    if (filters.collection) params.collection = filters.collection;
    if (filters.label) params.label = filters.label;
    if (filters.minPrice) params.minPrice = filters.minPrice;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;
    if (filters.sort) params.sort = filters.sort;
    params.page = page;
    params.limit = 12;
    
    fetchProducts(params);
    setSearchParams(params);
  }, [filters, page]);

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setSearchParams({ ...filters, [key]: value, page: 1 });
  };

  const clearFilters = () => {
    setFilters({
      keyword: '',
      category: '',
      collection: '',
      label: '',
      minPrice: '',
      maxPrice: '',
      sort: '-createdAt',
    });
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {filters.keyword ? `Search: ${filters.keyword}` : 'All Products'}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-900 text-white' : 'bg-white'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-900 text-white' : 'bg-white'}`}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden p-2 bg-white rounded"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:block w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden'}`}>
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Filters</h3>
                <button onClick={clearFilters} className="text-sm text-red-600 hover:underline">
                  Clear All
                </button>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h4 className="font-medium mb-2">Categories</h4>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Labels */}
              <div className="mb-6">
                <h4 className="font-medium mb-2">Labels</h4>
                <div className="space-y-2">
                  {['New', 'Sale', 'Best Seller'].map((label) => (
                    <label key={label} className="flex items-center">
                      <input
                        type="radio"
                        name="label"
                        value={label}
                        checked={filters.label === label}
                        onChange={(e) => handleFilterChange('label', e.target.value)}
                        className="mr-2"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="font-medium mb-2">Price Range</h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="w-1/2 px-3 py-2 border border-gray-200 rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="w-1/2 px-3 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Sort */}
              <div className="mb-6">
                <h4 className="font-medium mb-2">Sort By</h4>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                >
                  <option value="-createdAt">Newest First</option>
                  <option value="createdAt">Oldest First</option>
                  <option value="price">Price: Low to High</option>
                  <option value="-price">Price: High to Low</option>
                  <option value="-soldCount">Best Selling</option>
                  <option value="-rating">Highest Rated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No products found matching your criteria.</p>
                <button onClick={clearFilters} className="btn-primary mt-4">
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
                  {products.map((product) => (
                    viewMode === 'grid' ? (
                      <ProductGridCard key={product._id} product={product} />
                    ) : (
                      <ProductListCard key={product._id} product={product} />
                    )
                  ))}
                </div>

                {/* Pagination */}
                {pages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <button
                      onClick={() => fetchProducts({ ...filters, page: page - 1 })}
                      disabled={page === 1}
                      className="px-4 py-2 border rounded-lg disabled:opacity-50"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="px-4 py-2">
                      Page {page} of {pages}
                    </span>
                    <button
                      onClick={() => fetchProducts({ ...filters, page: page + 1 })}
                      disabled={page === pages}
                      className="px-4 py-2 border rounded-lg disabled:opacity-50"
                    >
                      <ChevronRight className="w-5 h-5" />
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

const ProductGridCard = ({ product }) => {
  const image = product.images?.[0]?.url || 'https://via.placeholder.com/400';
  
  return (
    <Link to={`/products/${product.slug || product._id}`} className="group">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition">
        <div className="relative aspect-square overflow-hidden">
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
          {product.label && (
            <span className={`absolute top-2 left-2 px-2 py-1 text-xs font-medium rounded ${
              product.label === 'Sale' ? 'bg-red-500 text-white' :
              product.label === 'New' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
            }`}>
              {product.label}
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
          <div className="mt-2 flex items-center space-x-2">
            <span className="text-lg font-semibold text-gray-900">₹{product.price}</span>
            {product.compareAtPrice && (
              <span className="text-sm text-gray-500 line-through">₹{product.compareAtPrice}</span>
            )}
          </div>
          <div className="mt-2 flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.round(product.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                }`}
              />
            ))}
            <span className="ml-1 text-sm text-gray-500">({product.numReviews || 0})</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

const ProductListCard = ({ product }) => {
  const image = product.images?.[0]?.url || 'https://via.placeholder.com/200';
  
  return (
    <Link to={`/products/${product.slug || product._id}`} className="group flex gap-4 bg-white rounded-lg shadow-sm p-4 hover:shadow-lg transition">
      <div className="w-32 h-32 flex-shrink-0 overflow-hidden rounded-lg">
        <img src={image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">{product.name}</h3>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</p>
        <div className="mt-2 flex items-center space-x-2">
          <span className="text-xl font-bold text-gray-900">₹{product.price}</span>
          {product.compareAtPrice && (
            <span className="text-sm text-gray-500 line-through">₹{product.compareAtPrice}</span>
          )}
        </div>
        <div className="mt-2 flex items-center">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-4 h-4 ${i < Math.round(product.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
          ))}
          <span className="ml-1 text-sm text-gray-500">({product.numReviews || 0})</span>
        </div>
      </div>
    </Link>
  );
};

export default Products;