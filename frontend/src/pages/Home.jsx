import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowRight, ShoppingBag, Star, Truck, Shield,
  RotateCcw, ChevronLeft, ChevronRight, Sparkles,
  Tag, Heart, Eye, TrendingUp, Zap,
} from 'lucide-react';
import { setProducts, setLoading, setError } from '../store/slices/productSlice';
import { getProductsAPI } from '../services/productService';
import { getActiveBannersAPI } from '../services/bannerService';
import { getCategoriesAPI } from '../services/adminService';
import { subscribeAPI } from '../services/newsletterService';
import Toast from '../utils/Toast.jsx';

const FontInjector = () => {
  useEffect(() => {
    if (document.getElementById('home-fonts')) return;
    const link = document.createElement('link');
    link.id = 'home-fonts';
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600&display=swap';
    document.head.appendChild(link);
  }, []);
  return null;
};

const GlobalStyles = () => (
  <style>{`
    * { font-family: 'DM Sans', sans-serif; }
    .playfair { font-family: 'Playfair Display', serif !important; }

    @keyframes ticker-scroll {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .ticker-track { animation: ticker-scroll 28s linear infinite; }
    .ticker-track:hover { animation-play-state: paused; }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .fade-up { animation: fadeUp 0.6s ease forwards; }

    @keyframes shimmer { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .shimmer { animation: shimmer 1.5s ease-in-out infinite; }

    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { animation: spin 0.8s linear infinite; }

    .banner-slide { position: absolute; inset: 0; transition: opacity 0.8s ease; }
    .banner-slide.active   { opacity: 1; z-index: 1; }
    .banner-slide.inactive { opacity: 0; z-index: 0; }

    .prod-img-main,
    .prod-img-hover {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      object-fit: cover;
      transition: opacity 0.4s ease;
    }
    .prod-img-hover { opacity: 0; }
    .prod-card-wrap:hover .prod-img-hover { opacity: 1; }
    .prod-card-wrap:hover .prod-img-main  { opacity: 0; }

    .prod-actions {
      transform: translateY(56px);
      opacity: 0;
      transition: transform 0.3s ease, opacity 0.3s ease;
    }
    .prod-card-wrap:hover .prod-actions {
      transform: translateY(0);
      opacity: 1;
    }

    .cat-img { transition: transform 0.7s cubic-bezier(.2,.8,.3,1); }
    .cat-card:hover .cat-img { transform: scale(1.06); }

    .nl-input:focus { outline: none; border-color: #1a1a1a; }
    .arrow-btn:hover { background: rgba(255,255,255,0.25) !important; }
  `}</style>
);

/* ── Fallback data ── */
const FALLBACK_BANNERS = [
  { _id: 'f1', title: 'The New\nSeason Edit', description: 'Curated styles for the discerning wardrobe', image: { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1400&q=85' }, link: '/products', ctaText: 'Explore Now', accent: '#C9A96E' },
  { _id: 'f2', title: 'Walk With\nConfidence', description: 'Premium footwear crafted for every stride', image: { url: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=1400&q=85' }, link: '/products', ctaText: 'Shop Collection', accent: '#8B9E7A' },
  { _id: 'f3', title: 'Summer\nSale — 50% Off', description: 'Limited time offers on iconic styles', image: { url: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=1400&q=85' }, link: '/products?label=Sale', ctaText: 'Shop Sale', accent: '#DC2626' },
];

const FALLBACK_CATS = [
  { _id: 'c1', name: 'Men',   slug: 'men',   image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=700&q=80' },
  { _id: 'c2', name: 'Women', slug: 'women', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=700&q=80' },
  { _id: 'c3', name: 'Kids',  slug: 'kids',  image: 'https://images.unsplash.com/photo-1514989940723-e31e2b4c76e0?w=700&q=80' },
];

const FEATURES = [
  { icon: Truck,     title: 'Free Delivery',  desc: 'Orders over Rs. 500' },
  { icon: RotateCcw, title: 'Easy Returns',    desc: '30-day policy' },
  { icon: Shield,    title: 'Secure Checkout', desc: '100% protected' },
  { icon: Sparkles,  title: 'Premium Quality', desc: 'Handpicked styles' },
];

const TICKER_ITEMS = [
  '✦ FREE SHIPPING ON ORDERS OVER RS. 500',
  '✦ NEW ARRIVALS EVERY WEEK',
  '✦ EASY 30-DAY RETURNS',
  '✦ PREMIUM QUALITY FOOTWEAR',
  '✦ COD AVAILABLE NATIONWIDE',
  '✦ EXCLUSIVE MEMBER DISCOUNTS',
];

/* ═══════════════════════════════════════════
   MAIN HOME COMPONENT
═══════════════════════════════════════════ */
const Home = () => {
  const dispatch = useDispatch();
  const { products, isLoading } = useSelector((s) => s.products);

  const [currentBanner, setCurrentBanner]         = useState(0);
  const [banners, setBanners]                     = useState([]);
  const [bannersLoading, setBannersLoading]       = useState(true);
  const [newsletterEmail, setNewsletterEmail]     = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const autoSlideRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getActiveBannersAPI();
        setBanners(res.success && res.banners?.length > 0 ? res.banners : FALLBACK_BANNERS);
      } catch { setBanners(FALLBACK_BANNERS); }
      finally  { setBannersLoading(false); }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      dispatch(setLoading(true));
      try {
        const res = await getProductsAPI({ limit: 8, label: 'New' });
        if (res.success) dispatch(setProducts(res));
        else dispatch(setError(res.message || 'Failed'));
      } catch (e) { dispatch(setError(e.message)); }
    })();
  }, [dispatch]);

  const startAutoSlide = useCallback(() => {
    clearInterval(autoSlideRef.current);
    if (banners.length < 2) return;
    autoSlideRef.current = setInterval(
      () => setCurrentBanner((p) => (p + 1) % banners.length), 5500,
    );
  }, [banners.length]);

  useEffect(() => { startAutoSlide(); return () => clearInterval(autoSlideRef.current); }, [startAutoSlide]);

  const goTo = (idx) => { setCurrentBanner(idx); startAutoSlide(); };
  const prev = () => goTo((currentBanner - 1 + banners.length) % banners.length);
  const next = () => goTo((currentBanner + 1) % banners.length);

  const handleNewsletter = async (e) => {
    e.preventDefault();
    if (!newsletterEmail) { Toast('Please enter your email', 'warning'); return; }
    setNewsletterLoading(true);
    try {
      const res = await subscribeAPI(newsletterEmail);
      if (res.success) { Toast(res.message || 'Subscribed!', 'success'); setNewsletterEmail(''); }
    } catch (err) { Toast(err.message || 'Failed to subscribe', 'error'); }
    finally { setNewsletterLoading(false); }
  };

  if (bannersLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAF8]">
        <div className="spin w-11 h-11 rounded-full mb-4" style={{ border: '2px solid #1a1a1a', borderTopColor: 'transparent' }} />
        <p className="text-sm text-gray-400 tracking-wide">Loading…</p>
      </div>
    );
  }

  return (
    /*
     * ✅ THE FIX IS HERE:
     *
     * The Navbar is `fixed top-0` with height ~64px (py-4 + content).
     * Previously the ticker used `mt-13` (= 52px) which was not enough
     * — the ticker and banner were sliding UNDER the navbar.
     *
     * Solution: Add `pt-16` (= 64px) to the root wrapper so ALL page
     * content starts exactly below the navbar. Remove any margin/padding
     * hacks from individual sections.
     */
    <div className="bg-[#FAFAF8] text-[#1a1a1a] pt-16">
      <FontInjector />
      <GlobalStyles />

      {/* ── Ticker — no extra margin needed, pt-16 on parent handles offset ── */}
      <div className="bg-[#1a1a1a] text-[#F0E8D8] py-2.5 overflow-hidden">
        <div className="ticker-track flex whitespace-nowrap">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="inline-block px-10 text-[11px] font-semibold tracking-[0.12em]">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Hero Banner ── */}
      <section className="relative mx-3 sm:mx-6 mt-4 sm:mt-6 h-[430px] sm:h-[520px] rounded-xl overflow-hidden bg-[#111]">
        {banners.map((banner, i) => (
          <div key={banner._id} className={`banner-slide ${i === currentBanner ? 'active' : 'inactive'}`}>
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${banner.image?.url || banner.image})` }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(105deg,rgba(0,0,0,.75) 0%,rgba(0,0,0,.3) 60%,transparent 100%)' }} />
            <div className="relative h-full flex items-center max-w-screen-xl mx-auto px-5 sm:px-10">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-3.5 py-1.5 mb-5">
                  <Zap className="w-3.5 h-3.5" style={{ color: banner.accent || '#C9A96E' }} />
                  <span className="text-[11px] font-semibold tracking-[0.12em] text-white/90">NEW COLLECTION 2025</span>
                </div>
                <h1 className="playfair font-black text-white leading-[1.08] mb-5 whitespace-pre-line" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)' }}>
                  {banner.title}
                </h1>
                <p className="text-sm sm:text-[17px] text-white/75 mb-7 sm:mb-9 font-light leading-relaxed">{banner.description}</p>
                <Link
                  to={banner.link || '/products'}
                  className="inline-flex items-center gap-2.5 px-6 sm:px-9 py-3 sm:py-4 bg-white text-[#1a1a1a] font-semibold text-sm tracking-[0.06em] rounded-sm no-underline shadow-2xl transition-all duration-300 hover:bg-[#1a1a1a] hover:text-white"
                >
                  {banner.ctaText || 'Shop Now'} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}

        {/* Dots */}
        <div className="absolute bottom-5 sm:bottom-8 right-4 sm:right-10 flex items-center gap-3 z-20">
          <span className="hidden sm:inline text-white/50 text-xs font-semibold">
            {String(currentBanner + 1).padStart(2, '0')} / {String(banners.length).padStart(2, '0')}
          </span>
          <div className="flex gap-1.5">
            {banners.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} className="h-1.5 rounded-full border-none cursor-pointer p-0 transition-all duration-300"
                style={{ width: i === currentBanner ? 28 : 6, background: i === currentBanner ? 'white' : 'rgba(255,255,255,0.35)' }}
              />
            ))}
          </div>
        </div>

        {/* Arrows */}
        {banners.length > 1 && (
          <>
            <button onClick={prev} className="arrow-btn absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full hidden sm:flex items-center justify-center text-white cursor-pointer border border-white/20 transition-all duration-200" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={next} className="arrow-btn absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full hidden sm:flex items-center justify-center text-white cursor-pointer border border-white/20 transition-all duration-200" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </section>

      {/* ── Feature Strip ── */}
      <div className="bg-white mt-8 border-t border-b border-[#E8E6E3]">
        <div className="max-w-screen-xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#E8E6E3]">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-3.5 px-4 sm:px-6 py-4 sm:py-5 bg-white">
                <div className="w-10 h-10 bg-[#F2F0ED] rounded-full flex items-center justify-center shrink-0">
                  <f.icon className="w-4 h-4 text-[#1a1a1a]" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#1a1a1a] mb-0.5">{f.title}</p>
                  <p className="text-xs text-[#888]">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── New Arrivals ── */}
      <section className="py-20 max-w-screen-xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-[11px] font-bold tracking-[0.16em] text-[#888] mb-2 uppercase">Just Landed</p>
            <h2 className="playfair text-[2.4rem] font-bold text-[#1a1a1a] leading-tight">New Arrivals</h2>
          </div>
          <Link to="/products?label=New" className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#1a1a1a] no-underline tracking-[0.04em] border-b border-[#1a1a1a] pb-0.5">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            {[...Array(8)].map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : products?.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            {products.slice(0, 8).map((p, i) => (
              <div key={p._id} className="fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-16 text-[#888]">
            <ShoppingBag className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-sm">No products found</p>
          </div>
        )}
      </section>

      <CategoriesSection />
      <TrendingSection />

      {/* ── Sale Banner ── */}
      <section className="px-6 pb-20 max-w-screen-xl mx-auto">
        <div className="relative rounded-md overflow-hidden bg-[#1a1a1a] min-h-[380px]">
          <div className="absolute inset-0">
            <img src="https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=1200&q=80" alt="Sale" className="w-full h-full object-cover opacity-35" />
          </div>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 items-center min-h-[380px]">
            <div className="p-8 sm:p-10 lg:p-16">
              <div className="inline-flex items-center gap-2 bg-red-600 rounded-sm px-3.5 py-1.5 mb-5">
                <Tag className="w-3 h-3 text-white" />
                <span className="text-[11px] font-bold tracking-[0.1em] text-white">LIMITED TIME OFFER</span>
              </div>
              <h2 className="playfair font-black text-white leading-tight mb-4" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}>
                Up to<br /><span className="text-red-600">50% Off</span>
              </h2>
              <p className="text-base text-white/70 mb-9 leading-relaxed">Don't miss our biggest season sale. Premium styles at unbeatable prices.</p>
              <Link to="/products?label=Sale" className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-white text-[#1a1a1a] font-bold text-[13px] tracking-[0.06em] rounded-sm no-underline transition-all duration-300 hover:bg-red-600 hover:text-white">
                SHOP SALE <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="hidden lg:flex justify-end items-center gap-4 p-12">
              {[{ pct: '40%', label: 'SNEAKERS' }, { pct: '30%', label: 'BOOTS' }, { pct: '50%', label: 'SANDALS' }].map((item) => (
                <div key={item.label} className="rounded-md text-center min-w-[90px] px-5 py-6 border border-white/10" style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}>
                  <p className="playfair font-bold text-red-600 mb-1" style={{ fontSize: '1.8rem' }}>{item.pct}</p>
                  <p className="text-[11px] text-white/55 tracking-[0.08em] font-semibold">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section className="bg-[#F2F0ED] py-20 px-6">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-11 h-11 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-5">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h2 className="playfair font-bold text-[#1a1a1a] mb-3" style={{ fontSize: '2.2rem' }}>Stay in the Loop</h2>
          <p className="text-[15px] text-[#666] mb-9 leading-relaxed">Subscribe for exclusive drops, style guides, and member-only discounts.</p>
          <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-3">
            <input type="email" value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)} placeholder="Your email address" required className="nl-input flex-1 px-5 py-3.5 border border-[#E8E6E3] rounded-sm text-sm bg-white transition-colors duration-200" />
            <button type="submit" disabled={newsletterLoading} className="px-8 py-3.5 bg-[#1a1a1a] text-white rounded-sm text-sm font-semibold tracking-[0.06em] cursor-pointer transition-colors duration-200 hover:bg-[#333] disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap">
              {newsletterLoading ? 'JOINING…' : 'SUBSCRIBE'}
            </button>
          </form>
          <p className="text-xs text-[#999] mt-3.5">No spam. Unsubscribe anytime.</p>
        </div>
      </section>

      {/* ── Footer Strip ── */}
      <div className="bg-[#1a1a1a] px-4 sm:px-10 py-5 flex items-center justify-between flex-wrap gap-3">
        <p className="playfair text-white text-lg font-bold tracking-wider">SOLE STYLE</p>
        <p className="text-white/40 text-xs">© 2025 Sole Style. All rights reserved.</p>
      </div>
    </div>
  );
};

/* ── Product Card ── */
const ProductCard = ({ product }) => {
  const image      = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600';
  const hoverImage = product.images?.[1]?.url || image;
  const discount   = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : null;

  const BadgeLabel = () => {
    if (!product.label) return null;
    const colorMap = { Sale: 'bg-red-600', New: 'bg-[#1a1a1a]', Hot: 'bg-amber-500' };
    return <span className={`${colorMap[product.label] || 'bg-[#1a1a1a]'} text-white text-[10px] font-semibold tracking-[0.08em] px-2 py-0.5 rounded-[2px]`}>{product.label}</span>;
  };

  return (
    <Link to={`/products/${product.slug || product._id}`} className="block no-underline text-inherit">
      <div className="prod-card-wrap bg-white rounded-sm overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl">
        <div className="relative overflow-hidden bg-[#F2F0ED]" style={{ aspectRatio: '3/4' }}>
          <img src={image}      alt={product.name} className="prod-img-main" />
          <img src={hoverImage} alt={product.name} className="prod-img-hover" />
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            <BadgeLabel />
            {discount > 0 && <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[2px]">-{discount}%</span>}
          </div>
          {product.totalStock === 0 && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
              <span className="text-xs font-bold tracking-[0.1em] text-[#1a1a1a] bg-white px-4 py-2 rounded-[2px]">SOLD OUT</span>
            </div>
          )}
          <div className="prod-actions absolute bottom-3 left-0 right-0 flex justify-center gap-2 z-20">
            {[{ Icon: Heart, title: 'Wishlist' }, { Icon: Eye, title: 'Quick View' }, { Icon: ShoppingBag, title: 'Add to Cart' }].map(({ Icon, title }) => (
              <button key={title} title={title} onClick={(e) => e.preventDefault()} className="w-9 h-9 bg-white rounded-full flex items-center justify-center border-none cursor-pointer shadow-md transition-all duration-200 hover:bg-[#1a1a1a] hover:scale-110 group/btn">
                <Icon className="w-4 h-4 text-[#1a1a1a] group-hover/btn:text-white transition-colors" />
              </button>
            ))}
          </div>
        </div>
        <div className="pt-3.5 pb-1 px-0.5">
          <p className="text-[13px] text-[#888] mb-0.5 uppercase tracking-[0.06em] font-medium">{product.brand || product.category?.name || 'Sole Style'}</p>
          <h3 className="text-sm font-semibold text-[#1a1a1a] mb-2 truncate">{product.name}</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-bold text-[#1a1a1a]">Rs. {product.price?.toLocaleString()}</span>
              {product.compareAtPrice && <span className="text-xs text-[#aaa] line-through">Rs. {product.compareAtPrice?.toLocaleString()}</span>}
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-[11px] text-[#888] font-semibold">{(product.rating || 0).toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

/* ── Product Skeleton ── */
const ProductSkeleton = () => (
  <div className="rounded-sm overflow-hidden bg-white">
    <div className="shimmer bg-[#E8E6E3]" style={{ aspectRatio: '3/4' }} />
    <div className="p-3.5 space-y-2">
      <div className="shimmer h-2.5 w-2/4 rounded-sm bg-[#E8E6E3]" />
      <div className="shimmer h-3 w-4/5 rounded-sm bg-[#E8E6E3]" />
      <div className="shimmer h-3 w-2/5 rounded-sm bg-[#E8E6E3]" />
    </div>
  </div>
);

/* ── Categories Section ── */
const CategoriesSection = () => {
  const [cats, setCats]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getCategoriesAPI();
        setCats(res.success && res.categories?.length ? res.categories.slice(0, 3) : FALLBACK_CATS);
      } catch { setCats(FALLBACK_CATS); }
      finally  { setLoading(false); }
    })();
  }, []);

  return (
    <section className="px-6 pb-20 max-w-screen-xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <p className="text-[11px] font-bold tracking-[0.16em] text-[#888] mb-2 uppercase">Browse</p>
          <h2 className="playfair text-[2.4rem] font-bold text-[#1a1a1a] leading-tight">Shop by Category</h2>
        </div>
        <Link to="/products" className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#1a1a1a] no-underline border-b border-[#1a1a1a] pb-0.5">
          All Categories <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="shimmer bg-[#E8E6E3] rounded-sm" style={{ aspectRatio: '4/5' }} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cats.map((cat) => (
            <Link key={cat._id} to={`/products?category=${cat.slug}`} className="block no-underline" style={{ aspectRatio: '4/5' }}>
              <div className="cat-card relative overflow-hidden rounded-sm h-full cursor-pointer">
                <img src={cat.image?.url || cat.image} alt={cat.name} className="cat-img w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(0,0,0,.75) 0%,rgba(0,0,0,.1) 50%,transparent 100%)' }} />
                <div className="absolute bottom-0 left-0 right-0 p-7">
                  <h3 className="playfair text-[1.6rem] font-bold text-white mb-2">{cat.name}</h3>
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white/85 border-b border-white/50 pb-0.5">
                    Shop Now <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

/* ── Trending Section ── */
const TrendingSection = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getProductsAPI({ limit: 4, sort: '-soldCount' });
        if (res.success && res.products?.length) setProducts(res.products);
      } catch { /* skip */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (!loading && products.length === 0) return null;

  return (
    <section className="px-6 pb-20 max-w-screen-xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <p className="text-[11px] font-bold tracking-[0.16em] text-[#888] mb-2 uppercase">Most Loved</p>
          <h2 className="playfair text-[2.4rem] font-bold text-[#1a1a1a] leading-tight flex items-center gap-3">
            Trending Now <TrendingUp className="w-7 h-7 text-red-600" />
          </h2>
        </div>
        <Link to="/products?sort=-soldCount" className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#1a1a1a] no-underline border-b border-[#1a1a1a] pb-0.5">
          View All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {[...Array(4)].map((_, i) => <ProductSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {products.map((p, i) => (
            <div key={p._id} className="fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default Home;
