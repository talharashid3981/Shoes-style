import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Star, Heart, Share2, Truck, Shield, RotateCcw,
  ChevronRight, ZoomIn, X, ThumbsUp, BadgeCheck,
  Loader, ChevronLeft,
} from 'lucide-react';
import useProducts from '../hooks/useProducts';
import useCart from '../hooks/useCart';
import useWishlist from '../hooks/useWishlist';
import useAuth from '../hooks/useAuth';
import { getProductReviewsAPI, getMyProductReviewAPI, createReviewAPI } from '../services/reviewService';
import { getRelatedProductsAPI } from '../services/productService';
import Toast from '../utils/Toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const StarRow = ({ rating, size = 4, interactive = false, onRate }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(s => (
      <button
        key={s}
        type={interactive ? 'button' : undefined}
        onClick={interactive ? () => onRate(s) : undefined}
        className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default pointer-events-none'}
      >
        <Star className={`${({ 3: 'w-3 h-3', 4: 'w-4 h-4', 7: 'w-7 h-7' }[size] || 'w-4 h-4')} transition-colors ${
          s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-100'
        }`} />
      </button>
    ))}
  </div>
);

const LabelBadge = ({ label }) => {
  if (!label) return null;
  const cls = { Sale: 'bg-red-500 text-white', New: 'bg-emerald-500 text-white', 'Best Seller': 'bg-amber-500 text-white' }[label] || 'bg-gray-800 text-white';
  return <span className={`inline-block px-3 py-1 text-xs font-black uppercase tracking-widest rounded-full ${cls}`}>{label}</span>;
};

// ─── Safe API unwrap ──────────────────────────────────────────────────────────
// ✅ Backend returns { success, count, data } but the axios interceptor in api.js
//    may already unwrap to the response.data object. Handle both shapes:
//    - If res.data is an array → use it (interceptor already unwrapped)
//    - If res is an array → use it directly
//    - Otherwise fall back to []
const unwrapArray = (res, key = 'data') => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.[key])) return res[key];
  if (Array.isArray(res?.products)) return res.products;
  return [];
};

// ─── Main Component ────────────────────────────────────────────────────────────

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentProduct, isLoading, fetchProductById } = useProducts();
  const { addToCart } = useCart();
  const {
    items: wishlistItems,
    addToWishlist,
    removeProductFromWishlist,
    isInWishlist,
    fetchWishlist,
  } = useWishlist();
  const { isAuthenticated } = useAuth();

  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize]   = useState('');
  const [quantity, setQuantity]           = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [zoomed, setZoomed]               = useState(false);

  const [reviews, setReviews]           = useState([]);
  const [userReview, setUserReview]     = useState(null);
  const [relatedProducts, setRelated]   = useState([]);
  const [reviewLoading, setRevLoading]  = useState(false);
  const [activeTab, setActiveTab]       = useState('description');
  const [addingToCart, setAddingToCart] = useState(false);
  const [wishlistStatus, setWishStatus] = useState(false);

  const [reviewForm, setReviewForm]         = useState({ rating: 5, title: '', comment: '' });
  const [submittingReview, setSubReview]    = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // ── Fetch product + reviews + wishlist on mount ──
  useEffect(() => {
    if (!id) return;
    fetchProductById(id);
    fetchWishlist();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  useEffect(() => {
    if (!currentProduct?._id) return;
    setWishStatus(isInWishlist(currentProduct._id));
  }, [currentProduct?._id, wishlistItems]);

  // ── Fetch related products once we know the product id ──
  useEffect(() => {
    if (!currentProduct?._id) return;
    setSelectedImage(0);
    loadReviews(currentProduct._id);
    if (isAuthenticated) loadMyReview(currentProduct._id);
    else setUserReview(null);

    // Set default color + size
    if (currentProduct.variants?.length > 0) {
      const firstVariant = currentProduct.variants[0];
      setSelectedColor(firstVariant.color || '');
      setSelectedSize(firstVariant.sizes?.[0]?.size || '');
    } else {
      setSelectedColor('');
      setSelectedSize('');
    }

    // ✅ Related products — called with product _id (not slug/URL id)
    getRelatedProductsAPI(currentProduct._id)
      .then(res => {
        // backend: { success, count, products }
        const arr = unwrapArray(res, 'products');
        setRelated(arr.filter(p => p._id !== currentProduct._id).slice(0, 8));
      })
      .catch(() => setRelated([]));
  }, [currentProduct?._id, isAuthenticated]);

  const loadReviews = async (productId) => {
    setRevLoading(true);
    try {
      const res = await getProductReviewsAPI(productId);
      // ✅ backend returns { success, count, data: [...] }
      // api.js interceptor may unwrap to { count, data } or return raw array
      setReviews(unwrapArray(res, 'data'));
    } catch {
      setReviews([]);
    } finally {
      setRevLoading(false);
    }
  };

  const loadMyReview = async (productId) => {
    try {
      const res = await getMyProductReviewAPI(productId);
      setUserReview(res?.data || null);
    } catch {
      setUserReview(null);
    }
  };

  useEffect(() => {
    if (userReview?._id) setShowReviewForm(false);
  }, [userReview?._id]);

  const handleAddToCart = async () => {
    if (!selectedColor || !selectedSize) {
      Toast('Please select a color and size', 'warning'); return;
    }
    setAddingToCart(true);
    try {
      await addToCart(currentProduct._id, { color: selectedColor, size: selectedSize }, quantity);
      Toast('Added to cart! 🛍️', 'success');
    } catch (err) {
      Toast(err?.message || 'Failed to add to cart', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) { Toast('Sign in to save items', 'info'); return; }
    try {
      if (wishlistStatus) {
        await removeProductFromWishlist(currentProduct._id);
        setWishStatus(false);
        Toast('Removed from wishlist', 'info');
      } else {
        await addToWishlist(currentProduct._id);
        setWishStatus(true);
        Toast('Saved to wishlist!', 'success');
      }
    } catch (err) {
      Toast(err?.message || 'Failed', 'error');
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    Toast('Link copied!', 'success');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) { Toast('Please write a comment', 'warning'); return; }
    setSubReview(true);
    try {
      const res = await createReviewAPI(currentProduct._id, reviewForm);
      if (res?.data) setUserReview(res.data);
      Toast('Review submitted! It will appear after approval.', 'success');
      setShowReviewForm(false);
      setReviewForm({ rating: 5, title: '', comment: '' });
      loadReviews(currentProduct._id);
    } catch (err) {
      if (String(err?.message || '').toLowerCase().includes('already reviewed')) {
        await loadMyReview(currentProduct._id);
      }
      Toast(err?.message || 'Failed to submit review', 'error');
    } finally {
      setSubReview(false);
    }
  };

  // ── Derived values ──
  const selectedVariant = currentProduct?.variants?.find(v => v.color === selectedColor);
  const stock = selectedVariant?.sizes?.find(s => s.size === selectedSize)?.stock ?? 0;
  const hasDiscount = currentProduct?.compareAtPrice > currentProduct?.price;
  const discountPct = hasDiscount
    ? Math.round(((currentProduct.compareAtPrice - currentProduct.price) / currentProduct.compareAtPrice) * 100)
    : 0;
  const images     = currentProduct?.images || [];
  const avgRating  = currentProduct?.rating || 0;
  const numReviews = currentProduct?.numReviews || 0;
  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    star, count: reviews.filter(r => r.rating === star).length,
  }));
  const hasUserReview = Boolean(userReview?._id);
  const reviewStatusMeta = {
    pending: {
      cls: 'bg-amber-50 border-amber-200 text-amber-800',
      title: 'Review Submitted',
      text: 'Your review is pending admin approval. You cannot submit another review for this product.',
    },
    approved: {
      cls: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      title: 'Review Approved',
      text: 'Your review is approved and visible in the reviews list.',
    },
    rejected: {
      cls: 'bg-red-50 border-red-200 text-red-700',
      title: 'Review Rejected',
      text: 'Your review was rejected by admin. One review per product is allowed.',
    },
  }[userReview?.status || 'pending'];

  // ── Loading state ──
  if (isLoading || !currentProduct) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24 gap-3">
        <Loader className="w-9 h-9 text-gray-300 animate-spin" />
        <p className="text-gray-400 text-sm">Loading product…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-20 pb-20">

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <nav className="flex items-center gap-1.5 text-xs text-gray-400">
          <Link to="/" className="hover:text-gray-700 transition">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/products" className="hover:text-gray-700 transition">Shop</Link>
          {currentProduct.categories?.[0] && (
            <>
              <ChevronRight className="w-3 h-3" />
              <Link to={`/products?category=${currentProduct.categories[0].slug}`} className="hover:text-gray-700 transition capitalize">
                {currentProduct.categories[0].name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-700 font-medium truncate max-w-[200px]">{currentProduct.name}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Product Section ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">

          {/* Gallery */}
          <div className="flex flex-col gap-3">
            <div
              className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-gray-50 cursor-zoom-in group"
              onClick={() => setZoomed(true)}
            >
              <img
                src={images[selectedImage]?.url || 'https://placehold.co/600x750'}
                alt={currentProduct.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                <LabelBadge label={currentProduct.label} />
                {hasDiscount && (
                  <span className="bg-red-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full">
                    -{discountPct}%
                  </span>
                )}
              </div>
              {stock === 0 && selectedColor && selectedSize && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="bg-white text-gray-900 font-black text-sm px-5 py-2 rounded-full uppercase tracking-widest">
                    Out of Stock
                  </span>
                </div>
              )}
              <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-sm p-2 rounded-xl shadow opacity-0 group-hover:opacity-100 transition">
                <ZoomIn className="w-4 h-4 text-gray-700" />
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === idx ? 'border-gray-900 shadow-md' : 'border-transparent opacity-60 hover:opacity-90'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col lg:pt-2">
            {currentProduct.categories?.[0] && (
              <Link
                to={`/products?category=${currentProduct.categories[0].slug}`}
                className="text-xs font-bold text-gray-400 uppercase tracking-[0.15em] hover:text-gray-600 transition mb-2"
              >
                {currentProduct.categories[0].name}
              </Link>
            )}

            <h1 className="text-2xl lg:text-3xl font-black text-gray-900 leading-tight mb-2">
              {currentProduct.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-4">
              <StarRow rating={avgRating} size={4} />
              <span className="text-sm font-semibold text-gray-600">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</span>
              <button
                onClick={() => setActiveTab('reviews')}
                className="text-sm text-gray-400 hover:text-gray-700 underline underline-offset-2 transition"
              >
                {numReviews} review{numReviews !== 1 ? 's' : ''}
              </button>
              {currentProduct.soldCount > 0 && (
                <span className="text-xs text-gray-400 border-l border-gray-200 pl-3">{currentProduct.soldCount}+ sold</span>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-5 pb-5 border-b border-gray-100">
              <span className="text-3xl font-black text-gray-900">Rs. {currentProduct.price?.toLocaleString()}</span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-gray-400 line-through">Rs. {currentProduct.compareAtPrice?.toLocaleString()}</span>
                  <span className="text-sm font-bold text-red-500 bg-red-50 px-2.5 py-0.5 rounded-full">
                    Save Rs. {(currentProduct.compareAtPrice - currentProduct.price).toLocaleString()}
                  </span>
                </>
              )}
            </div>

            {/* Color */}
            {currentProduct.variants?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Color: <span className="text-gray-900 normal-case font-black">{selectedColor}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {currentProduct.variants.map(v => (
                    <button
                      key={v.color}
                      onClick={() => { setSelectedColor(v.color); setSelectedSize(v.sizes?.[0]?.size || ''); setQuantity(1); }}
                      className={`px-4 py-2 text-sm rounded-xl border-2 font-semibold transition-all ${
                        selectedColor === v.color
                          ? 'border-gray-900 bg-gray-900 text-white shadow'
                          : 'border-gray-200 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {v.color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size */}
            {selectedColor && selectedVariant && (
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Size: <span className="text-gray-900 normal-case font-black">{selectedSize}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedVariant.sizes.map(s => {
                    const oos = s.stock === 0;
                    const sel = selectedSize === s.size;
                    return (
                      <button
                        key={s.size}
                        onClick={() => { if (!oos) { setSelectedSize(s.size); setQuantity(1); } }}
                        disabled={oos}
                        className={`relative min-w-[48px] px-3 py-2 text-sm rounded-xl border-2 font-bold transition-all ${
                          sel ? 'border-gray-900 bg-gray-900 text-white shadow'
                          : oos ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50 line-through'
                          : 'border-gray-200 text-gray-700 hover:border-gray-500'
                        }`}
                      >
                        {s.size}
                      </button>
                    );
                  })}
                </div>
                {stock > 0 && stock <= 5 && (
                  <p className="mt-2 text-xs font-bold text-amber-600 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                    Only {stock} left!
                  </p>
                )}
              </div>
            )}

            {/* Quantity */}
            <div className="mb-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Quantity</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition font-bold text-lg leading-none"
                  >−</button>
                  <span className="px-5 py-2.5 font-black text-gray-900 text-base min-w-[3rem] text-center border-x-2 border-gray-200">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(q => Math.min(stock, q + 1))}
                    disabled={quantity >= stock || stock === 0}
                    className="px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition font-bold text-lg leading-none disabled:opacity-30"
                  >+</button>
                </div>
                {stock > 0 && selectedSize && <span className="text-xs text-gray-400">{stock} available</span>}
              </div>
            </div>

            {/* CTA */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || stock === 0}
                className="flex-1 py-3.5 bg-gray-900 hover:bg-gray-700 text-white font-black rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
              >
                {addingToCart
                  ? <><Loader className="w-4 h-4 animate-spin" />Adding…</>
                  : stock === 0 && selectedSize
                  ? 'Out of Stock'
                  : 'Add to Bag'}
              </button>
              <button
                onClick={handleWishlist}
                className={`p-3.5 border-2 rounded-xl transition-all ${
                  wishlistStatus ? 'border-red-200 bg-red-50 text-red-500' : 'border-gray-200 hover:border-gray-400 text-gray-500'
                }`}
              >
                <Heart className={`w-5 h-5 ${wishlistStatus ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
              <button onClick={handleShare} className="p-3.5 border-2 border-gray-200 rounded-xl hover:border-gray-400 text-gray-500 transition-all">
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-2 pt-5 border-t border-gray-100">
              {[
                { icon: Truck,     label: 'Free Shipping', sub: 'On orders Rs. 999+' },
                { icon: RotateCcw, label: '30-Day Returns', sub: 'Hassle-free' },
                { icon: Shield,    label: 'Secure Payment', sub: '100% protected' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center text-center gap-1 p-2.5 bg-gray-50 rounded-xl">
                  <Icon className="w-4 h-4 text-gray-600" />
                  <p className="text-xs font-bold text-gray-800 leading-tight">{label}</p>
                  <p className="text-[10px] text-gray-400">{sub}</p>
                </div>
              ))}
            </div>

            {currentProduct.sku && (
              <p className="mt-3 text-[10px] text-gray-400 font-medium">SKU: {currentProduct.sku}</p>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="mt-14">
          <div className="flex border-b border-gray-200">
            {[
              { key: 'description', label: 'Description' },
              { key: 'reviews',     label: `Reviews (${numReviews})` },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3 text-sm font-bold transition-all border-b-2 -mb-px ${
                  activeTab === tab.key
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="py-8">
            {/* Description */}
            {activeTab === 'description' && (
              <div className="max-w-3xl">
                <p className="text-gray-600 leading-relaxed">{currentProduct.description}</p>
                {currentProduct.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-5">
                    {currentProduct.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-600">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reviews */}
            {activeTab === 'reviews' && (
              <div className="max-w-3xl">
                {/* Summary */}
                {reviews.length > 0 && (
                  <div className="flex flex-col sm:flex-row gap-6 mb-8 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex flex-col items-center justify-center min-w-[100px] gap-1.5">
                      <span className="text-5xl font-black text-gray-900">{avgRating.toFixed(1)}</span>
                      <StarRow rating={avgRating} size={4} />
                      <span className="text-xs text-gray-400">{numReviews} reviews</span>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {ratingDist.map(({ star, count }) => (
                        <div key={star} className="flex items-center gap-2 text-sm">
                          <span className="w-3 text-xs text-gray-500">{star}</span>
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-1.5 bg-amber-400 rounded-full transition-all duration-500"
                              style={{ width: numReviews > 0 ? `${(count / numReviews) * 100}%` : '0%' }}
                            />
                          </div>
                          <span className="w-5 text-right text-xs text-gray-400">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Write review / sign in prompt */}
                {isAuthenticated && hasUserReview && (
                  <div className={`mb-6 border rounded-xl px-4 py-3 ${reviewStatusMeta.cls}`}>
                    <p className="text-sm font-bold">{reviewStatusMeta.title}</p>
                    <p className="text-xs mt-1">{reviewStatusMeta.text}</p>
                  </div>
                )}
                {isAuthenticated && !hasUserReview && !showReviewForm && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="mb-6 px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-700 transition uppercase tracking-wider"
                  >
                    Write a Review
                  </button>
                )}
                {!isAuthenticated && (
                  <p className="mb-6 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                    <Link to="/login" className="font-bold text-gray-900 underline">Sign in</Link> to leave a review.
                  </p>
                )}

                {/* Review form */}
                {showReviewForm && !hasUserReview && (
                  <div className="mb-8 bg-gray-50 border border-gray-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-900">Your Review</h3>
                      <button onClick={() => setShowReviewForm(false)} className="text-gray-400 hover:text-gray-600 transition">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Your Rating</label>
                        <StarRow rating={reviewForm.rating} size={7} interactive onRate={r => setReviewForm(f => ({ ...f, rating: r }))} />
                        <p className="text-xs text-gray-400 mt-1">{['', 'Terrible', 'Bad', 'OK', 'Good', 'Excellent'][reviewForm.rating]}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Title</label>
                        <input
                          value={reviewForm.title}
                          onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400"
                          placeholder="Summarize your experience"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                          Comment <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          required rows={4}
                          value={reviewForm.comment}
                          onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 resize-none"
                          placeholder="Share your honest experience with this product…"
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="submit" disabled={submittingReview}
                          className="px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-700 transition disabled:opacity-50 flex items-center gap-2"
                        >
                          {submittingReview && <Loader className="w-3.5 h-3.5 animate-spin" />}
                          Submit
                        </button>
                        <button type="button" onClick={() => setShowReviewForm(false)} className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-200 transition">
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Reviews list */}
                {reviewLoading ? (
                  <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
                    <Loader className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Loading reviews…</span>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl">
                    <Star className="w-10 h-10 text-gray-200 fill-gray-100 mx-auto mb-3" />
                    <p className="text-gray-500 font-semibold">No reviews yet</p>
                    <p className="text-sm text-gray-400 mt-1">Be the first to share your thoughts!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {reviews.map(review => <ReviewCard key={review._id} review={review} />)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Related Products ── */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-10 border-t border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">You May Also Like</h2>
              <Link to="/products" className="text-sm font-semibold text-gray-400 hover:text-gray-900 flex items-center gap-1 transition">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedProducts.map(p => <RelatedCard key={p._id} product={p} />)}
            </div>
          </div>
        )}
      </div>

      {/* ── Image Zoom Modal ── */}
      {zoomed && (
        <div className="fixed inset-0 bg-black/92 z-50 flex items-center justify-center p-4" onClick={() => setZoomed(false)}>
          <button className="absolute top-5 right-5 text-white/70 hover:text-white transition">
            <X className="w-7 h-7" />
          </button>
          {images.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); setSelectedImage(i => Math.max(0, i - 1)); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); setSelectedImage(i => Math.min(images.length - 1, i + 1)); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={e => { e.stopPropagation(); setSelectedImage(idx); }}
                    className={`h-1.5 rounded-full transition-all ${selectedImage === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`}
                  />
                ))}
              </div>
            </>
          )}
          <img
            src={images[selectedImage]?.url}
            alt=""
            className="max-h-[88vh] max-w-[88vw] object-contain rounded-xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

// ─── Review Card ───────────────────────────────────────────────────────────────

const ReviewCard = ({ review }) => (
  <div className="py-5 first:pt-0">
    <div className="flex items-start gap-3 mb-3">
      <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center font-black text-sm flex-shrink-0">
        {review.user?.name?.charAt(0)?.toUpperCase() || 'U'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm text-gray-900">{review.user?.name || 'Anonymous'}</span>
          {review.isVerifiedPurchase && (
            <span className="flex items-center gap-0.5 text-xs text-emerald-600 font-semibold">
              <BadgeCheck className="w-3.5 h-3.5" />Verified
            </span>
          )}
          <span className="text-xs text-gray-400 ml-auto">
            {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <StarRow rating={review.rating} size={3} />
      </div>
    </div>
    {review.title && <p className="font-bold text-gray-900 text-sm mb-1">"{review.title}"</p>}
    <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
    {review.helpfulVotes > 0 && (
      <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
        <ThumbsUp className="w-3 h-3" />{review.helpfulVotes} found this helpful
      </div>
    )}
  </div>
);

// ─── Related Product Card ──────────────────────────────────────────────────────

const RelatedCard = ({ product }) => {
  const navigate = useNavigate();
  const image = product.images?.[0]?.url || 'https://placehold.co/300x300';
  const hasDiscount = product.compareAtPrice > product.price;

  return (
    <div
      onClick={() => { navigate(`/products/${product.slug || product._id}`); window.scrollTo(0, 0); }}
      className="group cursor-pointer"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-gray-100 mb-2.5">
        <img
          src={image} alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          loading="lazy"
        />
        {product.label && (
          <div className="absolute top-2 left-2">
            <LabelBadge label={product.label} />
          </div>
        )}
        {product.totalStock === 0 && (
          <div className="absolute inset-0 bg-black/35 flex items-end justify-center pb-3">
            <span className="text-white text-[10px] font-black bg-black/60 px-3 py-1 rounded-full uppercase tracking-widest">Sold Out</span>
          </div>
        )}
      </div>
      <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 group-hover:text-gray-500 transition-colors">{product.name}</h3>
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="font-bold text-gray-900 text-sm">Rs. {product.price?.toLocaleString()}</span>
        {hasDiscount && <span className="text-xs text-gray-400 line-through">Rs. {product.compareAtPrice?.toLocaleString()}</span>}
      </div>
      {product.rating > 0 && (
        <div className="flex items-center gap-1 mt-0.5">
          <StarRow rating={product.rating} size={3} />
          <span className="text-[10px] text-gray-400">({product.numReviews})</span>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
