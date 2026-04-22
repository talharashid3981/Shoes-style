import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowRight, ShoppingBag, Star, Truck, Shield, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { setProducts, setLoading, setError } from '../store/slices/productSlice';
import { getProductsAPI } from '../services/productService';
import { getActiveBannersAPI } from '../services/bannerService';
import { subscribeAPI } from '../services/newsletterService';
import Toast from '../utils/Toast';

const Home = () => {
  const dispatch = useDispatch();
  const { products, isLoading } = useSelector((state) => state.products);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [banners, setBanners] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  const features = [
    { icon: Truck, title: 'Free Shipping', desc: 'On orders over ₹500' },
    { icon: Shield, title: 'Secure Payment', desc: '100% secure checkout' },
    { icon: RotateCcw, title: 'Easy Returns', desc: '30-day return policy' },
    { icon: Star, title: 'Premium Quality', desc: 'Handpicked products' },
  ];

  // Fetch banners from backend
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await getActiveBannersAPI();
        if (response.success && response.banners?.length > 0) {
          setBanners(response.banners);
        } else {
          // Fallback banners if none exist in DB
          setBanners([
            {
              _id: '1',
              title: 'Step Into Style',
              description: 'Discover our new collection of premium footwear',
              image: { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200' },
              link: '/products',
              ctaText: 'Shop Now',
            },
            {
              _id: '2',
              title: 'Comfort Meets Fashion',
              description: 'Experience the perfect blend of style and comfort',
              image: { url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200' },
              link: '/products',
              ctaText: 'Explore Collection',
            },
            {
              _id: '3',
              title: 'Summer Sale',
              description: 'Up to 50% off on selected items',
              image: { url: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=1200' },
              link: '/products?label=Sale',
              ctaText: 'Shop Sale',
            },
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch banners:', error);
        setBanners([
          {
            _id: '1',
            title: 'Step Into Style',
            description: 'Discover our new collection of premium footwear',
            image: { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200' },
            link: '/products',
            ctaText: 'Shop Now',
          },
          {
            _id: '2',
            title: 'Comfort Meets Fashion',
            description: 'Experience the perfect blend of style and comfort',
            image: { url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200' },
            link: '/products',
            ctaText: 'Explore Collection',
          },
        ]);
      } finally {
        setBannersLoading(false);
      }
    };

    fetchBanners();
  }, []);

  // Fetch products from backend WITHOUT async thunk
  useEffect(() => {
    const fetchNewProducts = async () => {
      dispatch(setLoading(true));
      try {
        const response = await getProductsAPI({ limit: 8, label: 'New' });
        if (response.success) {
          dispatch(setProducts(response));
        } else {
          dispatch(setError(response.message || 'Failed to fetch products'));
        }
      } catch (error) {
        dispatch(setError(error.message));
        console.error('Error fetching products:', error);
      }
    };

    fetchNewProducts();
  }, [dispatch]);

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length === 0) return;
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const nextBanner = () => setCurrentBanner((prev) => (prev + 1) % banners.length);
  const prevBanner = () => setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail) {
      Toast('Please enter your email address', 'warning');
      return;
    }

    setNewsletterLoading(true);
    try {
      const response = await subscribeAPI(newsletterEmail);
      if (response.success) {
        Toast(response.message || 'Subscription successful! Please check your email to confirm.', 'success');
        setNewsletterEmail('');
      }
    } catch (error) {
      Toast(error.message || 'Failed to subscribe. Please try again.', 'error');
    } finally {
      setNewsletterLoading(false);
    }
  };

  if (bannersLoading && banners.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Banner Slider */}
      <section className="relative h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden">
        {banners.map((banner, index) => (
          <div
            key={banner._id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentBanner ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${banner.image?.url})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />
            </div>
            <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
              <div className="max-w-xl text-white">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                  {banner.title}
                </h1>
                <p className="text-lg md:text-xl mb-8 text-gray-200">
                  {banner.description}
                </p>
                <Link
                  to={banner.link || '/products'}
                  className="inline-flex items-center px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {banner.ctaText || 'Shop Now'}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        ))}

        {/* Banner Navigation - Only show if more than 1 banner */}
        {banners.length > 1 && (
          <>
            <button
              onClick={prevBanner}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextBanner}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Banner Indicators */}
        {banners.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentBanner(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentBanner ? 'w-8 bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <feature.icon className="w-6 h-6 text-gray-900" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-500">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">New Arrivals</h2>
            <Link
              to="/products?label=New"
              className="flex items-center text-gray-900 font-medium hover:underline"
            >
              View All
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.slice(0, 8).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No products found.</p>
            </div>
          )}
        </div>
      </section>

      {/* Categories Section - Fetch from backend */}
      <CategoriesSection />

      {/* Sale Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-900 rounded-2xl overflow-hidden">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="p-8 md:p-12">
                <span className="inline-block px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-full mb-4">
                  Limited Time Offer
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Up to 50% Off
                </h2>
                <p className="text-gray-300 mb-6">
                  Don't miss out on our biggest sale of the season. Limited time offer on selected items.
                </p>
                <Link
                  to="/products?label=Sale"
                  className="inline-flex items-center px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Shop Sale
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </div>
              <div className="h-64 md:h-96">
                <img
                  src="https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800"
                  alt="Sale"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Stay Updated</h2>
          <p className="text-gray-600 mb-8">
            Subscribe to our newsletter for exclusive offers, new arrivals, and more.
          </p>
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              required
            />
            <button
              type="submit"
              disabled={newsletterLoading}
              className="px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {newsletterLoading ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

// Product Card Component
const ProductCard = ({ product }) => {
  const image = product.images?.[0]?.url || 'https://via.placeholder.com/400';
  
  return (
    <Link to={`/products/${product.slug || product._id}`} className="group">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {product.label && (
            <span className={`absolute top-2 left-2 px-2 py-1 text-xs font-medium rounded ${
              product.label === 'Sale' ? 'bg-red-500 text-white' :
              product.label === 'New' ? 'bg-green-500 text-white' :
              'bg-yellow-500 text-white'
            }`}>
              {product.label}
            </span>
          )}
          {product.totalStock === 0 && (
            <span className="absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded bg-gray-900 text-white">
              Sold Out
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
          <div className="mt-2 flex items-center space-x-2">
            <span className="text-lg font-semibold text-gray-900">₹{product.price.toLocaleString()}</span>
            {product.compareAtPrice && (
              <span className="text-sm text-gray-500 line-through">
                ₹{product.compareAtPrice.toLocaleString()}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.round(product.rating || 0)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
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

// Product Skeleton Component
const ProductSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200"></div>
      <div className="p-4">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
    </div>
  );
};

// Categories Section Component
const CategoriesSection = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        if (data.success) {
          setCategories(data.categories.slice(0, 3));
        } else {
          // Fallback categories
          setCategories([
            { _id: '1', name: 'Men', slug: 'men', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600' },
            { _id: '2', name: 'Women', slug: 'women', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600' },
            { _id: '3', name: 'Kids', slug: 'kids', image: 'https://images.unsplash.com/photo-1514989940723-e31e2b4c76e0?w=600' },
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setCategories([
          { _id: '1', name: 'Men', slug: 'men', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600' },
          { _id: '2', name: 'Women', slug: 'women', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600' },
          { _id: '3', name: 'Kids', slug: 'kids', image: 'https://images.unsplash.com/photo-1514989940723-e31e2b4c76e0?w=600' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Shop by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-[4/5] bg-gray-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Shop by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((category) => (
            <CategoryCard
              key={category._id}
              title={category.name}
              image={category.image?.url || category.image}
              link={`/products?category=${category.slug}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// Category Card Component
const CategoryCard = ({ title, image, link }) => (
  <Link to={link} className="group relative overflow-hidden rounded-xl aspect-[4/5]">
    <img
      src={image}
      alt={title}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 p-6">
      <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
      <span className="inline-flex items-center text-white font-medium group-hover:underline">
        Shop Now
        <ArrowRight className="ml-2 w-4 h-4" />
      </span>
    </div>
  </Link>
);

export default Home;