import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard, Package, Users, Tag, Image, Mail,
  ShoppingBag, Plus, Edit, Trash2, Eye, Search,
  X, DollarSign, Clock, TrendingUp, ChevronDown,
  ChevronUp, RefreshCw, Send, CheckCircle, AlertCircle,
  BarChart2, ArrowUpRight, Layers, Zap, Star, ThumbsUp, BadgeCheck,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";
import {
  getDashboardStatsAPI, getRecentOrdersAPI, getAllUsersAPI,
  updateUserAdminAPI, deleteUserAdminAPI, updateCouponAPI,
  getCouponsAPI, createCouponAPI, deleteCouponAPI,
  getAllBannersAPI, updateBannerAPI, createBannerAPI, deleteBannerAPI,
  getSubscribersAPI, createCategoryAPI, deleteSubscriberAPI,
  createCollectionAPI, createProductAPI, deleteCategoryAPI,
  deleteCollectionAPI, deleteProductAPI, getCampaignsAPI,
  getCategoriesAPI, getCollectionsAPI, getProductsAPI,
  sendCampaignAPI, updateOrderStatusAPI, uploadImagesAPI,
  updateProductAPI, updateCategoryAPI, updateCollectionAPI,
  getAllReviewsAPI, updateReviewStatusAPI,
} from "../../services/adminService";
import { createCampaignAPI } from "../../services/newsletterService";
import Toast from "../../utils/Toast.jsx";

// ─── Shared helpers ────────────────────────────────────────────────────────────

const StatusBadge = ({ active }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
    active ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
           : "bg-red-50 text-red-600 border border-red-200"
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-red-400"}`} />
    {active ? "Active" : "Inactive"}
  </span>
);

const Modal = ({ title, onClose, children, wide = false }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[92vh] flex flex-col`}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      <div className="overflow-y-auto flex-1">{children}</div>
    </div>
  </div>
);

const Btn = ({ children, onClick, type = "button", variant = "primary", disabled, className = "" }) => {
  const base = "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-gray-900 text-white hover:bg-gray-700 shadow-sm",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition";

// ─── Main Component ────────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (activeSection === "dashboard") fetchDashboardStats();
  }, [activeSection]);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const response = await getDashboardStatsAPI();
      if (response.success) setStats(response.data); // ✅ response.data not response
    } catch (error) {
      Toast(error.message || "Failed to load stats", "error");
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products",  label: "Products",  icon: Package },
    { id: "orders",    label: "Orders",    icon: ShoppingBag },
    { id: "users",     label: "Users",     icon: Users },
    { id: "coupons",   label: "Coupons",   icon: Tag },
    { id: "banners",   label: "Banners",   icon: Image },
    { id: "categories",label: "Categories",icon: Layers },
    { id: "collections",label:"Collections",icon: Zap },
    { id: "reviews",   label: "Reviews",   icon: Star },
    { id: "newsletter",label: "Newsletter",icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-16 font-sans">
      <div className="flex">
        {/* Sidebar */}
        <aside className={`bg-white border-r border-gray-100 min-h-screen fixed top-16 left-0 z-30 transition-all duration-300 ${sidebarOpen ? "w-60" : "w-16"}`}>
          <div className={`px-4 py-5 border-b border-gray-100 ${sidebarOpen ? "" : "px-2"}`}>
            {sidebarOpen && (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin Panel</p>
                <p className="text-sm text-gray-600 mt-0.5 truncate">{user?.name}</p>
              </>
            )}
          </div>
          <nav className="p-2 space-y-0.5">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  title={!sidebarOpen ? s.label : ""}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                    activeSection === s.id
                      ? "bg-gray-900 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {sidebarOpen && <span className="text-sm font-medium">{s.label}</span>}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main */}
        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-60" : "ml-16"} p-6`}>
          {activeSection === "dashboard"   && <DashboardSection stats={stats} loading={loading} onRefresh={fetchDashboardStats} />}
          {activeSection === "products"    && <ProductsSection />}
          {activeSection === "orders"      && <OrdersSection />}
          {activeSection === "users"       && <UsersSection />}
          {activeSection === "coupons"     && <CouponsSection />}
          {activeSection === "banners"     && <BannersSection />}
          {activeSection === "categories"  && <CategoriesSection />}
          {activeSection === "collections" && <CollectionsSection />}
          {activeSection === "reviews"     && <ReviewsSection />}
          {activeSection === "newsletter"  && <NewsletterSection />}
        </main>
      </div>
    </div>
  );
};

// ─── Dashboard ─────────────────────────────────────────────────────────────────

const DashboardSection = ({ stats, loading, onRefresh }) => {
  const cards = [
    { title: "Total Orders",   value: stats?.orders?.total   || 0, sub: `+${stats?.orders?.today || 0} today`,  icon: ShoppingBag, color: "bg-blue-500",   light: "bg-blue-50"   },
    { title: "Total Revenue",  value: `Rs. ${(stats?.revenue?.total || 0).toLocaleString()}`, sub: `Rs. ${(stats?.revenue?.today || 0).toLocaleString()} today`, icon: DollarSign, color: "bg-emerald-500", light: "bg-emerald-50" },
    { title: "Total Users",    value: stats?.users?.total    || 0, sub: `+${stats?.users?.newToday || 0} today`, icon: Users,       color: "bg-violet-500", light: "bg-violet-50" },
    { title: "Total Products", value: stats?.products?.total || 0, sub: `${stats?.products?.lowStock || 0} low stock`, icon: Package, color: "bg-amber-500",  light: "bg-amber-50"  },
    { title: "Month Orders",   value: stats?.orders?.month   || 0, sub: `${stats?.orders?.week || 0} this week`, icon: BarChart2,  color: "bg-rose-500",   light: "bg-rose-50"   },
    { title: "Subscribers",    value: stats?.subscribers     || 0, sub: "active newsletter", icon: Mail,       color: "bg-cyan-500",   light: "bg-cyan-50"   },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back, here's what's happening</p>
        </div>
        <Btn onClick={onRefresh} variant="secondary" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Btn>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3 text-emerald-500" />{card.sub}
                    </p>
                  </div>
                  <div className={`${card.light} p-3 rounded-xl`}>
                    <Icon className={`w-5 h-5 ${card.color.replace("bg-", "text-")}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Products ──────────────────────────────────────────────────────────────────

const EMPTY_PRODUCT = {
  name: "", description: "", price: "", compareAtPrice: "",
  sku: "", label: "", categories: [], collections: [],
  variants: [], isActive: true,
};

const EMPTY_VARIANT = { color: "", sizes: [{ size: "", stock: 0, sku: "" }] };

const ProductsSection = () => {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [form, setForm]             = useState(EMPTY_PRODUCT);
  const [imageFiles, setImageFiles] = useState([]);
  const [previews, setPreviews]     = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [skuSuggestion, setSkuSuggestion] = useState("");

  useEffect(() => { fetchProducts(); }, [page]);
  useEffect(() => {
    Promise.all([getCategoriesAPI(), getCollectionsAPI()]).then(([catRes, colRes]) => {
      setCategories(catRes.categories || []);
      // collections: backend returns {success, count, data}
      setCollections(Array.isArray(colRes) ? colRes : (colRes.data || []));
    }).catch(() => {});
  }, []);

  // Auto-generate SKU suggestion when name changes
  useEffect(() => {
    if (form.name && !editing) {
      const base = form.name.replace(/[^a-zA-Z0-9]/g, "").substring(0, 6).toUpperCase();
      const suggestion = `${base}-${Date.now().toString().slice(-4)}`;
      setSkuSuggestion(suggestion);
    }
  }, [form.name, editing]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await getProductsAPI({ page, limit: 10 });
      setProducts(res.products || []);
      setTotalPages(res.pages || 1);
    } catch (e) { Toast(e.message, "error"); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_PRODUCT);
    setImageFiles([]);
    setPreviews([]);
    setSkuSuggestion("");
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name || "", description: p.description || "",
      price: p.price || "", compareAtPrice: p.compareAtPrice || "",
      sku: p.sku || "", label: p.label || "",   // "" is fine in form state; sanitized on submit
      categories: (p.categories || []).map(c => c._id || c),
      collections: (p.collections || []).map(c => c._id || c),
      variants: p.variants || [], isActive: p.isActive ?? true,
    });
    setImageFiles([]);
    setPreviews(p.images?.map(i => i.url) || []);
    setShowModal(true);
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(prev => [...prev, ...files]);
    files.forEach(f => {
      const r = new FileReader();
      r.onloadend = () => setPreviews(prev => [...prev, r.result]);
      r.readAsDataURL(f);
    });
  };

  const removePreview = (i) => {
    setImageFiles(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  // Variant helpers
  const addVariant = () => setForm(f => ({ ...f, variants: [...f.variants, { ...EMPTY_VARIANT, sizes: [{ size: "", stock: 0, sku: "" }] }] }));
  const removeVariant = (vi) => setForm(f => ({ ...f, variants: f.variants.filter((_, i) => i !== vi) }));
  const updateVariant = (vi, key, val) => setForm(f => {
    const v = [...f.variants];
    v[vi] = { ...v[vi], [key]: val };
    return { ...f, variants: v };
  });
  const addSize = (vi) => setForm(f => {
    const v = [...f.variants];
    v[vi] = { ...v[vi], sizes: [...v[vi].sizes, { size: "", stock: 0, sku: "" }] };
    return { ...f, variants: v };
  });
  const removeSize = (vi, si) => setForm(f => {
    const v = [...f.variants];
    v[vi].sizes = v[vi].sizes.filter((_, i) => i !== si);
    return { ...f, variants: v };
  });
  const updateSize = (vi, si, key, val) => setForm(f => {
    const v = JSON.parse(JSON.stringify(f.variants));
    v[vi].sizes[si][key] = key === "stock" ? Number(val) : val;
    return { ...f, variants: v };
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // ✅ Strip incomplete variants/sizes before sending to backend.
      // Mongoose requires size to be non-empty (required: true). Any size row
      // where the user left the size field blank must be removed, and any
      // variant where ALL sizes are blank (or no sizes remain) must also be
      // removed. This prevents ValidationError on the backend.
      const cleanVariants = form.variants
        .map(v => ({
          ...v,
          sizes: v.sizes.filter(s => s.size && String(s.size).trim() !== ""),
        }))
        .filter(v => v.color && String(v.color).trim() !== "" && v.sizes.length > 0);

      // Warn user if some rows were silently dropped
      const totalInputSizes  = form.variants.reduce((acc, v) => acc + v.sizes.length, 0);
      const totalCleanSizes  = cleanVariants.reduce((acc, v) => acc + v.sizes.length, 0);
      if (totalInputSizes > totalCleanSizes) {
        Toast(`${totalInputSizes - totalCleanSizes} incomplete size row(s) were skipped (size field was empty).`, "warning");
      }

      // ✅ Compute totalStock from clean variants so backend stores correct value.
      // Without this, products created via JSON body (not multipart) bypass the
      // backend's calculateTotalStock call and end up with totalStock: 0.
      const totalStock = cleanVariants.reduce(
        (acc, v) => acc + v.sizes.reduce((s, sz) => s + (Number(sz.stock) || 0), 0), 0
      );

      // ✅ label: empty string "" fails enum validation.
      // Only include label in the payload when the user actually picked one.
      const payload = {
        ...form,
        price: Number(form.price),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
        label: form.label && form.label !== "" ? form.label : undefined,
        variants: cleanVariants,
        totalStock,
      };

      if (editing) {
        await updateProductAPI(editing._id, payload);
        if (imageFiles.length > 0) {
          const fd = new FormData();
          imageFiles.forEach(f => fd.append("images", f));
          await uploadImagesAPI(editing._id, fd);
        }
        Toast("Product updated", "success");
      } else {
        const res = await createProductAPI(payload);
        if (res.success && imageFiles.length > 0) {
          const fd = new FormData();
          imageFiles.forEach(f => fd.append("images", f));
          await uploadImagesAPI(res.product._id, fd);
        }
        Toast("Product created", "success");
      }
      setShowModal(false);
      fetchProducts();
    } catch (e) { Toast(e.message || "Failed to save product", "error"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    try { await deleteProductAPI(id); Toast("Deleted", "success"); fetchProducts(); }
    catch (e) { Toast(e.message, "error"); }
  };

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Btn onClick={openAdd}><Plus className="w-4 h-4" />Add Product</Btn>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or SKU…"
          className={`${inputCls} pl-9`} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {["Product","SKU","Price","Stock","Status","Actions"].map(h => (
                <th key={h} className={`px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${h==="Actions"?"text-right":"text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">No products found</td></tr>
            ) : filtered.map(p => (
              <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <img src={p.images?.[0]?.url || "https://placehold.co/40x40"} alt=""
                      className="w-10 h-10 object-cover rounded-lg border border-gray-100" />
                    <span className="font-medium text-gray-900 text-sm">{p.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-500">{p.sku}</td>
                <td className="px-5 py-3.5 text-sm font-medium text-gray-900">Rs. {p.price}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-sm font-medium ${p.totalStock < 5 ? "text-red-500" : "text-gray-700"}`}>
                    {p.totalStock}
                    {p.totalStock < 5 && <span className="ml-1 text-xs text-red-400">(low)</span>}
                  </span>
                </td>
                <td className="px-5 py-3.5"><StatusBadge active={p.isActive} /></td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(p._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 px-5 py-4 border-t border-gray-100">
            <Btn variant="secondary" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}>Prev</Btn>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <Btn variant="secondary" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}>Next</Btn>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title={editing ? "Edit Product" : "Add Product"} onClose={() => setShowModal(false)} wide>
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Product Name" required>
                <input required value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} className={inputCls} placeholder="e.g. Air Max 270" />
              </Field>
              <Field label="SKU">
                <div className="relative">
                  <input value={form.sku} onChange={e => setForm(f=>({...f,sku:e.target.value}))}
                    className={inputCls} placeholder="Auto-generated if empty" />
                  {skuSuggestion && !editing && !form.sku && (
                    <button type="button" onClick={() => setForm(f=>({...f,sku:skuSuggestion}))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-0.5 rounded transition">
                      Use: {skuSuggestion}
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">Click suggestion to use auto-generated SKU</p>
              </Field>
            </div>

            <Field label="Description">
              <textarea rows={3} value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} className={inputCls} />
            </Field>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Price (Rs. )" required>
                <input type="number" required min="0" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} className={inputCls} />
              </Field>
              <Field label="Compare At Price (Rs. )">
                <input type="number" min="0" value={form.compareAtPrice} onChange={e=>setForm(f=>({...f,compareAtPrice:e.target.value}))} className={inputCls} />
              </Field>
              <Field label="Label">
                <select value={form.label} onChange={e=>setForm(f=>({...f,label:e.target.value}))} className={inputCls}>
                  <option value="">None</option>
                  <option value="New">New</option>
                  <option value="Sale">Sale</option>
                  <option value="Best Seller">Best Seller</option>
                </select>
              </Field>
            </div>

            {/* Category & Collection */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Categories">
                <select multiple value={form.categories}
                  onChange={e => setForm(f=>({...f,categories:Array.from(e.target.selectedOptions,o=>o.value)}))}
                  className={`${inputCls} h-28`}>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                <p className="text-xs text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple</p>
              </Field>
              <Field label="Collections">
                <select multiple value={form.collections}
                  onChange={e => setForm(f=>({...f,collections:Array.from(e.target.selectedOptions,o=>o.value)}))}
                  className={`${inputCls} h-28`}>
                  {collections.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                <p className="text-xs text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple</p>
              </Field>
            </div>

            {/* Images */}
            <Field label="Images">
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50">
                <input type="file" multiple accept="image/*" onChange={handleImages} className="w-full text-sm" />
                {previews.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {previews.map((src, i) => (
                      <div key={i} className="relative group">
                        <img src={src} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                        <button type="button" onClick={() => removePreview(i)}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Field>

            {/* Variants */}
            <div>
              {/* Header row with live total stock counter */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Variants — Colors &amp; Sizes</label>
                  {form.variants.length > 0 && (() => {
                    const total = form.variants.reduce((acc, v) =>
                      acc + v.sizes.reduce((s, sz) => s + (Number(sz.stock) || 0), 0), 0);
                    return (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        total === 0
                          ? "bg-red-50 text-red-600 border-red-200"
                          : total < 5
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}>
                        Total stock: {total}
                      </span>
                    );
                  })()}
                </div>
                <Btn type="button" variant="secondary" onClick={addVariant} className="text-xs py-1 px-2">
                  <Plus className="w-3 h-3" />Add Variant
                </Btn>
              </div>

              {/* Zero-stock warning banner */}
              {form.variants.length > 0 && form.variants.reduce((acc, v) =>
                acc + v.sizes.reduce((s, sz) => s + (Number(sz.stock) || 0), 0), 0) === 0 && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-3">
                  <span className="text-red-500 text-lg leading-none mt-0.5">⚠</span>
                  <p className="text-xs text-red-700 font-medium">
                    All size stocks are 0. Products with 0 total stock cannot be added to cart.
                    Fill in the <strong>Stock</strong> field for each size below.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {form.variants.map((v, vi) => {
                  const variantTotal = v.sizes.reduce((s, sz) => s + (Number(sz.stock) || 0), 0);
                  return (
                    <div key={vi} className={`border rounded-xl p-4 ${variantTotal === 0 && v.sizes.length > 0 ? "border-red-200 bg-red-50/40" : "border-gray-200 bg-gray-50"}`}>
                      {/* Variant header: color + stock badge */}
                      <div className="flex items-center justify-between mb-3 gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <input value={v.color} onChange={e => updateVariant(vi,"color",e.target.value)}
                            className={`${inputCls} max-w-[180px]`} placeholder="Color name (e.g. Black)" />
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${
                            variantTotal === 0 ? "bg-red-50 text-red-500 border-red-200" : "bg-white text-gray-600 border-gray-200"
                          }`}>
                            {variantTotal === 0 ? "⚠ 0 stock" : `${variantTotal} in stock`}
                          </span>
                        </div>
                        <button type="button" onClick={() => removeVariant(vi)}
                          className="p-1.5 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 transition flex-shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Column headers */}
                      <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 mb-1 px-1">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Size <span className="text-red-500">*</span></span>
                        <span className="text-xs font-semibold text-red-500 uppercase tracking-wide">Stock ★ required</span>
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Variant SKU</span>
                        <span className="w-6" />
                      </div>

                      {/* Size rows */}
                      <div className="space-y-2">
                        {v.sizes.map((s, si) => (
                          <div key={si} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                            <input
                              value={s.size}
                              onChange={e => updateSize(vi,si,"size",e.target.value)}
                              className={`${inputCls} ${!s.size ? "border-amber-300 bg-amber-50/30" : ""}`}
                              placeholder="42, S, M, L…"
                            />
                            <input
                              type="number"
                              min="0"
                              value={s.stock === 0 ? "" : s.stock}
                              onChange={e => updateSize(vi,si,"stock",e.target.value === "" ? 0 : e.target.value)}
                              className={`${inputCls} font-semibold ${
                                !s.stock || Number(s.stock) === 0
                                  ? "border-red-300 bg-red-50/50 text-red-700 placeholder-red-400"
                                  : "border-emerald-300 bg-emerald-50/30 text-emerald-800"
                              }`}
                              placeholder="Enter stock ⚠"
                            />
                            <input
                              value={s.sku}
                              onChange={e => updateSize(vi,si,"sku",e.target.value)}
                              className={inputCls}
                              placeholder="Optional SKU"
                            />
                            <button type="button" onClick={() => removeSize(vi,si)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500 transition">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <button type="button" onClick={() => addSize(vi)}
                        className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium">
                        <Plus className="w-3 h-3" />Add Size
                      </button>
                    </div>
                  );
                })}

                {form.variants.length === 0 && (
                  <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                    <p className="text-sm text-gray-500 font-medium">No variants added yet</p>
                    <p className="text-xs text-gray-400 mt-1">Add at least one color with sizes and stock to make the product purchasable</p>
                    <button type="button" onClick={addVariant}
                      className="mt-3 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm hover:shadow transition flex items-center gap-1 mx-auto">
                      <Plus className="w-3 h-3" />Add First Variant
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Active toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div onClick={() => setForm(f=>({...f,isActive:!f.isActive}))}
                className={`relative w-10 h-5 rounded-full transition-colors ${form.isActive ? "bg-gray-900":"bg-gray-300"}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive?"translate-x-5":"translate-x-0.5"}`} />
              </div>
              <span className="text-sm text-gray-700">Active (visible to customers)</span>
            </label>

            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <Btn type="submit" disabled={submitting} className="flex-1 justify-center">
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                {editing ? "Update Product" : "Create Product"}
              </Btn>
              <Btn type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1 justify-center">Cancel</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// ─── Orders ────────────────────────────────────────────────────────────────────

const OrdersSection = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await getRecentOrdersAPI();
      // ✅ Backend returns {success, count, data} — extract data array
      setOrders(Array.isArray(res.data) ? res.data : (Array.isArray(res.orders) ? res.orders : []));
    } catch (e) { Toast(e.message, "error"); }
    finally { setLoading(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      await updateOrderStatusAPI(id, status);
      Toast("Status updated", "success");
      fetchOrders();
    } catch (e) { Toast(e.message, "error"); }
  };

  const statusColor = (s) => ({
    pending:"bg-yellow-50 text-yellow-700 border-yellow-200",
    confirmed:"bg-blue-50 text-blue-700 border-blue-200",
    shipped:"bg-violet-50 text-violet-700 border-violet-200",
    delivered:"bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled:"bg-red-50 text-red-600 border-red-200",
  }[s] || "bg-gray-50 text-gray-600 border-gray-200");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <Btn variant="secondary" onClick={fetchOrders}><RefreshCw className="w-4 h-4" />Refresh</Btn>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Order ID","Customer","Total","Status","Date","Actions"].map(h=>(
                <th key={h} className={`px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${h==="Actions"?"text-right":"text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">Loading…</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">No orders found</td></tr>
            ) : orders.map(o => (
              <tr key={o._id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5 text-sm font-mono text-gray-700">{o.orderId}</td>
                <td className="px-5 py-3.5 text-sm text-gray-700">{o.user?.name || o.guestEmail || "Guest"}</td>
                <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">Rs. {o.total}</td>
                <td className="px-5 py-3.5">
                  <select value={o.orderStatus} onChange={e => updateStatus(o._id, e.target.value)}
                    className={`text-xs font-medium px-2 py-1 rounded-lg border outline-none cursor-pointer ${statusColor(o.orderStatus)}`}>
                    {["pending","confirmed","shipped","delivered","cancelled"].map(s=>(
                      <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
                    ))}
                  </select>
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="px-5 py-3.5 text-right">
                  <button onClick={() => setSelected(o)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <Modal title={`Order #${selected.orderId}`} onClose={() => setSelected(null)} wide>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Customer:</span> <span className="font-medium ml-1">{selected.user?.name || selected.guestEmail || "Guest"}</span></div>
              <div><span className="text-gray-500">Status:</span> <span className="font-medium ml-1 capitalize">{selected.orderStatus}</span></div>
              <div><span className="text-gray-500">Total:</span> <span className="font-semibold ml-1">Rs. {selected.total}</span></div>
              <div><span className="text-gray-500">Payment:</span> <span className="font-medium ml-1 capitalize">{selected.paymentMethod}</span></div>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Items ({selected.items?.length || 0})</p>
              <div className="space-y-2">
                {selected.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-gray-700">{item.name} — {item.variant?.color} / {item.variant?.size} × {item.quantity}</span>
                    <span className="font-medium">Rs. {item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── Users ─────────────────────────────────────────────────────────────────────

const UsersSection = () => {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUsersAPI();
      // ✅ response.users
      setUsers(res.users || []);
    } catch (e) { Toast(e.message, "error"); }
    finally { setLoading(false); }
  };

  const toggleRole = async (id, role) => {
    const newRole = role === "admin" ? "user" : "admin";
    try { await updateUserAdminAPI(id, { role: newRole }); Toast(`Role → ${newRole}`, "success"); fetchUsers(); }
    catch (e) { Toast(e.message, "error"); }
  };

  const del = async (id) => {
    if (!confirm("Delete this user?")) return;
    try { await deleteUserAdminAPI(id); Toast("User deleted", "success"); fetchUsers(); }
    catch (e) { Toast(e.message, "error"); }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{users.length} total</span>
      </div>
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search users…" className={`${inputCls} pl-9`} />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["User","Email","Role","Verified","Joined","Actions"].map(h=>(
                <th key={h} className={`px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${h==="Actions"?"text-right":"text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">Loading…</td></tr>
            ) : filtered.map(u => (
              <tr key={u._id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {u.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <span className="font-medium text-sm text-gray-900">{u.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-500">{u.email}</td>
                <td className="px-5 py-3.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${u.role==="admin" ? "bg-violet-50 text-violet-700 border-violet-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {u.isEmailVerified
                    ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                    : <AlertCircle className="w-4 h-4 text-amber-400" />}
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => toggleRole(u._id, u.role)}
                      className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 transition">
                      {u.role === "admin" ? "→ User" : "→ Admin"}
                    </button>
                    <button onClick={() => del(u._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Coupons ───────────────────────────────────────────────────────────────────

const EMPTY_COUPON = {
  code:"", description:"", type:"percentage", value:"",
  minOrderValue:"", maxDiscount:"", usageLimit:"", perUserLimit:1,
  startDate:"", endDate:"", isActive:true,
};

const CouponsSection = () => {
  const [coupons, setCoupons]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY_COUPON);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await getCouponsAPI();
      // ✅ Backend returns array directly
      setCoupons(Array.isArray(res) ? res : (res.coupons || []));
    } catch (e) { Toast(e.message, "error"); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setEditing(null); setForm(EMPTY_COUPON); setShowModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({ ...c, startDate: c.startDate?.split("T")[0]||"", endDate: c.endDate?.split("T")[0]||"" }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      if (editing) await updateCouponAPI(editing._id, form);
      else await createCouponAPI(form);
      Toast(editing ? "Coupon updated" : "Coupon created", "success");
      setShowModal(false); fetchCoupons();
    } catch (e) { Toast(e.message, "error"); }
    finally { setSubmitting(false); }
  };

  const del = async (id) => {
    if (!confirm("Delete coupon?")) return;
    try { await deleteCouponAPI(id); Toast("Deleted","success"); fetchCoupons(); }
    catch (e) { Toast(e.message,"error"); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
        <Btn onClick={openAdd}><Plus className="w-4 h-4" />Add Coupon</Btn>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_,i)=><div key={i} className="bg-white rounded-2xl h-36 animate-pulse border border-gray-100" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map(c => (
            <div key={c._id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-lg font-bold font-mono tracking-widest text-gray-900">{c.code}</span>
                  <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => del(c._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-2xl font-bold text-gray-900">
                  {c.type === "percentage" ? `${c.value}% OFF` : `Rs. ${c.value} OFF`}
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <StatusBadge active={c.isActive} />
                  {c.minOrderValue > 0 && <span className="text-xs text-gray-500">Min Rs. {c.minOrderValue}</span>}
                  {c.usageLimit && <span className="text-xs text-gray-400">{c.usedCount||0}/{c.usageLimit} used</span>}
                </div>
              </div>
            </div>
          ))}
          {coupons.length === 0 && (
            <div className="col-span-3 text-center py-12 text-gray-400">No coupons yet. Create one!</div>
          )}
        </div>
      )}

      {showModal && (
        <Modal title={editing ? "Edit Coupon" : "Create Coupon"} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Field label="Coupon Code" required>
              <input required value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value.toUpperCase()}))} className={inputCls} placeholder="SUMMER20" />
            </Field>
            <Field label="Description">
              <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Type">
                <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} className={inputCls}>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                  <option value="free_shipping">Free Shipping</option>
                </select>
              </Field>
              <Field label="Value" required>
                <input type="number" required min="0" value={form.value} onChange={e=>setForm(f=>({...f,value:e.target.value}))} className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Min Order Value">
                <input type="number" min="0" value={form.minOrderValue} onChange={e=>setForm(f=>({...f,minOrderValue:e.target.value}))} className={inputCls} />
              </Field>
              <Field label="Max Discount">
                <input type="number" min="0" value={form.maxDiscount} onChange={e=>setForm(f=>({...f,maxDiscount:e.target.value}))} className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Usage Limit">
                <input type="number" min="0" value={form.usageLimit} onChange={e=>setForm(f=>({...f,usageLimit:e.target.value}))} className={inputCls} />
              </Field>
              <Field label="Per User Limit">
                <input type="number" min="1" value={form.perUserLimit} onChange={e=>setForm(f=>({...f,perUserLimit:e.target.value}))} className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Start Date"><input type="date" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))} className={inputCls} /></Field>
              <Field label="End Date"><input type="date" value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))} className={inputCls} /></Field>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div onClick={() => setForm(f=>({...f,isActive:!f.isActive}))}
                className={`relative w-10 h-5 rounded-full transition-colors ${form.isActive?"bg-gray-900":"bg-gray-300"}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive?"translate-x-5":"translate-x-0.5"}`} />
              </div>
              <span className="text-sm text-gray-700">Active</span>
            </label>
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <Btn type="submit" disabled={submitting} className="flex-1 justify-center">
                {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                {editing ? "Update" : "Create"}
              </Btn>
              <Btn type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1 justify-center">Cancel</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// ─── Banners ───────────────────────────────────────────────────────────────────

const EMPTY_BANNER = { title:"", description:"", link:"", ctaText:"Shop Now", order:0, isActive:true, startDate:"", endDate:"" };

const BannersSection = () => {
  const [banners, setBanners]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY_BANNER);
  const [imgFile, setImgFile]     = useState(null);
  const [preview, setPreview]     = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchBanners(); }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await getAllBannersAPI();
      setBanners(res.banners || []);
    } catch (e) { Toast(e.message,"error"); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setEditing(null); setForm(EMPTY_BANNER); setImgFile(null); setPreview(null); setShowModal(true); };
  const openEdit = (b) => {
    setEditing(b);
    setForm({ title:b.title||"", description:b.description||"", link:b.link||"", ctaText:b.ctaText||"Shop Now",
      order:b.order||0, isActive:b.isActive??true, startDate:b.startDate?.split("T")[0]||"", endDate:b.endDate?.split("T")[0]||"" });
    setImgFile(null); setPreview(b.image?.url||null); setShowModal(true);
  };

  const handleImg = (e) => {
    const f = e.target.files[0];
    if (f) { setImgFile(f); const r = new FileReader(); r.onloadend=()=>setPreview(r.result); r.readAsDataURL(f); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => { if (v !== "" && v !== null && v !== undefined) fd.append(k, v); });
      if (imgFile) fd.append("image", imgFile);
      if (editing) await updateBannerAPI(editing._id, fd);
      else await createBannerAPI(fd);
      Toast(editing ? "Banner updated" : "Banner created", "success");
      setShowModal(false); fetchBanners();
    } catch (e) { Toast(e.message,"error"); }
    finally { setSubmitting(false); }
  };

  const del = async (id) => {
    if (!confirm("Delete banner?")) return;
    try { await deleteBannerAPI(id); Toast("Deleted","success"); fetchBanners(); }
    catch (e) { Toast(e.message,"error"); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Banners</h1>
        <Btn onClick={openAdd}><Plus className="w-4 h-4" />Add Banner</Btn>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? [...Array(3)].map((_,i)=><div key={i} className="bg-white rounded-2xl h-52 animate-pulse border border-gray-100" />)
        : banners.map(b => (
          <div key={b._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative">
              <img src={b.image?.url} alt={b.title} className="w-full h-44 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="text-white font-semibold text-sm">{b.title}</h3>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusBadge active={b.isActive} />
                <span className="text-xs text-gray-400">Order: {b.order}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition"><Edit className="w-4 h-4" /></button>
                <button onClick={() => del(b._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
        {!loading && banners.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-400">No banners yet.</div>
        )}
      </div>

      {showModal && (
        <Modal title={editing ? "Edit Banner" : "Add Banner"} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Field label="Banner Image" required={!editing}>
              <input type="file" accept="image/*" onChange={handleImg} className="w-full text-sm" required={!editing} />
              {preview && <img src={preview} alt="" className="mt-2 w-full h-32 object-cover rounded-xl" />}
            </Field>
            <Field label="Title" required><input required value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className={inputCls} /></Field>
            <Field label="Description"><textarea rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className={inputCls} /></Field>
            <Field label="Link URL"><input value={form.link} onChange={e=>setForm(f=>({...f,link:e.target.value}))} className={inputCls} placeholder="/products?label=Sale" /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="CTA Text"><input value={form.ctaText} onChange={e=>setForm(f=>({...f,ctaText:e.target.value}))} className={inputCls} /></Field>
              <Field label="Display Order"><input type="number" value={form.order} onChange={e=>setForm(f=>({...f,order:e.target.value}))} className={inputCls} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Start Date"><input type="date" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))} className={inputCls} /></Field>
              <Field label="End Date"><input type="date" value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))} className={inputCls} /></Field>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div onClick={() => setForm(f=>({...f,isActive:!f.isActive}))}
                className={`relative w-10 h-5 rounded-full transition-colors ${form.isActive?"bg-gray-900":"bg-gray-300"}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive?"translate-x-5":"translate-x-0.5"}`} />
              </div>
              <span className="text-sm text-gray-700">Active</span>
            </label>
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <Btn type="submit" disabled={submitting} className="flex-1 justify-center">
                {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                {editing ? "Update" : "Create"}
              </Btn>
              <Btn type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1 justify-center">Cancel</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// ─── Categories ────────────────────────────────────────────────────────────────

const CategoriesSection = () => {
  const [cats, setCats]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState({ name:"", description:"", order:0, isActive:true });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchCats(); }, []);

  const fetchCats = async () => {
    setLoading(true);
    try {
      const res = await getCategoriesAPI();
      // ✅ backend returns {success, count, categories}
      setCats(res.categories || []);
    } catch (e) { Toast(e.message,"error"); }
    finally { setLoading(false); }
  };

  const openAdd  = () => { setEditing(null); setForm({name:"",description:"",order:0,isActive:true}); setShowModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({name:c.name,description:c.description||"",order:c.order||0,isActive:c.isActive??true}); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      if (editing) await updateCategoryAPI(editing._id, form);
      else await createCategoryAPI(form);
      Toast(editing ? "Category updated":"Category created","success");
      setShowModal(false); fetchCats();
    } catch (e) { Toast(e.message,"error"); }
    finally { setSubmitting(false); }
  };

  const del = async (id) => {
    if (!confirm("Delete category?")) return;
    try { await deleteCategoryAPI(id); Toast("Deleted","success"); fetchCats(); }
    catch (e) { Toast(e.message,"error"); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <Btn onClick={openAdd}><Plus className="w-4 h-4" />Add Category</Btn>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading…</div>
        ) : cats.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No categories yet.</div>
        ) : cats.map((c, i) => (
          <div key={c._id} className={`flex items-center justify-between px-5 py-4 ${i < cats.length-1 ? "border-b border-gray-50":""} hover:bg-gray-50/50 transition-colors`}>
            <div>
              <p className="font-medium text-gray-900">{c.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">/{c.slug} · Order: {c.order || 0}</p>
              {c.description && <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>}
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge active={c.isActive} />
              <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition"><Edit className="w-4 h-4" /></button>
              <button onClick={() => del(c._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal title={editing ? "Edit Category":"Add Category"} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Field label="Name" required><input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className={inputCls} placeholder="e.g. Running Shoes" /></Field>
            <Field label="Description"><textarea rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className={inputCls} /></Field>
            <Field label="Display Order"><input type="number" value={form.order} onChange={e=>setForm(f=>({...f,order:Number(e.target.value)}))} className={inputCls} /></Field>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div onClick={() => setForm(f=>({...f,isActive:!f.isActive}))}
                className={`relative w-10 h-5 rounded-full transition-colors ${form.isActive?"bg-gray-900":"bg-gray-300"}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive?"translate-x-5":"translate-x-0.5"}`} />
              </div>
              <span className="text-sm text-gray-700">Active</span>
            </label>
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <Btn type="submit" disabled={submitting} className="flex-1 justify-center">
                {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                {editing ? "Update" : "Create"}
              </Btn>
              <Btn type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1 justify-center">Cancel</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// ─── Collections ───────────────────────────────────────────────────────────────

const CollectionsSection = () => {
  const [cols, setCols]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState({ name:"", description:"", order:0, isActive:true, startDate:"", endDate:"" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchCols(); }, []);

  const fetchCols = async () => {
    setLoading(true);
    try {
      const res = await getCollectionsAPI();
      // ✅ backend returns {success, count, data}
      setCols(Array.isArray(res) ? res : (res.data || []));
    } catch (e) { Toast(e.message,"error"); }
    finally { setLoading(false); }
  };

  const openAdd  = () => { setEditing(null); setForm({name:"",description:"",order:0,isActive:true,startDate:"",endDate:""}); setShowModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({name:c.name,description:c.description||"",order:c.order||0,isActive:c.isActive??true, startDate:c.startDate?.split("T")[0]||"", endDate:c.endDate?.split("T")[0]||""}); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      if (editing) await updateCollectionAPI(editing._id, form);
      else await createCollectionAPI(form);
      Toast(editing ? "Collection updated":"Collection created","success");
      setShowModal(false); fetchCols();
    } catch (e) { Toast(e.message,"error"); }
    finally { setSubmitting(false); }
  };

  const del = async (id) => {
    if (!confirm("Delete collection?")) return;
    try { await deleteCollectionAPI(id); Toast("Deleted","success"); fetchCols(); }
    catch (e) { Toast(e.message,"error"); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
        <Btn onClick={openAdd}><Plus className="w-4 h-4" />Add Collection</Btn>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading…</div>
        ) : cols.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No collections yet.</div>
        ) : cols.map((c, i) => (
          <div key={c._id} className={`flex items-center justify-between px-5 py-4 ${i < cols.length-1 ? "border-b border-gray-50":""} hover:bg-gray-50/50 transition-colors`}>
            <div>
              <p className="font-medium text-gray-900">{c.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">/{c.slug}</p>
              {c.description && <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>}
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge active={c.isActive} />
              <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition"><Edit className="w-4 h-4" /></button>
              <button onClick={() => del(c._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal title={editing ? "Edit Collection":"Add Collection"} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Field label="Name" required><input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className={inputCls} placeholder="e.g. Summer 2025" /></Field>
            <Field label="Description"><textarea rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className={inputCls} /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Start Date"><input type="date" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))} className={inputCls} /></Field>
              <Field label="End Date"><input type="date" value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))} className={inputCls} /></Field>
            </div>
            <Field label="Display Order"><input type="number" value={form.order} onChange={e=>setForm(f=>({...f,order:Number(e.target.value)}))} className={inputCls} /></Field>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div onClick={() => setForm(f=>({...f,isActive:!f.isActive}))}
                className={`relative w-10 h-5 rounded-full transition-colors ${form.isActive?"bg-gray-900":"bg-gray-300"}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive?"translate-x-5":"translate-x-0.5"}`} />
              </div>
              <span className="text-sm text-gray-700">Active</span>
            </label>
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <Btn type="submit" disabled={submitting} className="flex-1 justify-center">
                {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                {editing ? "Update" : "Create"}
              </Btn>
              <Btn type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1 justify-center">Cancel</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// ─── Newsletter ────────────────────────────────────────────────────────────────

const NewsletterSection = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [campaigns, setCampaigns]     = useState([]);
  const [loading, setLoading]         = useState(false);
  const [showModal, setShowModal]     = useState(false);
  const [form, setForm]               = useState({ subject:"", content:"", segment:"all" });
  const [submitting, setSubmitting]   = useState(false);
  const [sending, setSending]         = useState(null);
  const [activeTab, setActiveTab]     = useState("subscribers");

  useEffect(() => {
    fetchSubscribers();
    fetchCampaigns();
  }, []);

  const fetchSubscribers = async () => {
    try {
      const res = await getSubscribersAPI();
      // ✅ backend returns array directly
      setSubscribers(Array.isArray(res) ? res : (res.subscribers || []));
    } catch (e) { Toast(e.message,"error"); }
  };

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await getCampaignsAPI();
      // ✅ backend returns {success, count, data}
      setCampaigns(Array.isArray(res) ? res : (res.data || []));
    } catch (e) { Toast(e.message,"error"); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await createCampaignAPI(form);
      Toast("Campaign created as draft","success");
      setShowModal(false); setForm({subject:"",content:"",segment:"all"});
      fetchCampaigns();
    } catch (e) { Toast(e.message,"error"); }
    finally { setSubmitting(false); }
  };

  const handleSend = async (id) => {
    if (!confirm("Send this campaign to all subscribers?")) return;
    setSending(id);
    try {
      await sendCampaignAPI(id);
      Toast("Campaign queued for sending!","success");
      fetchCampaigns();
    } catch (e) { Toast(e.message,"error"); }
    finally { setSending(null); }
  };

  const delSub = async (id) => {
    if (!confirm("Remove subscriber?")) return;
    try { await deleteSubscriberAPI(id); Toast("Removed","success"); fetchSubscribers(); }
    catch (e) { Toast(e.message,"error"); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Newsletter</h1>
          <p className="text-sm text-gray-500 mt-0.5">{subscribers.length} subscribers · {campaigns.length} campaigns</p>
        </div>
        <Btn onClick={() => setShowModal(true)}><Plus className="w-4 h-4" />Create Campaign</Btn>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-5">
        {["subscribers","campaigns"].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${activeTab===t ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === "subscribers" && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {subscribers.length === 0 ? (
            <div className="p-10 text-center text-gray-400">No subscribers yet.</div>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Subscribed</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {subscribers.map(s => (
                  <tr key={s._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-gray-900">{s.email}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{s.name || "—"}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-400">{s.subscribedAt ? new Date(s.subscribedAt).toLocaleDateString() : "—"}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => delSub(s._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "campaigns" && (
        <div className="space-y-3">
          {loading ? [...Array(2)].map((_,i)=><div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-gray-100" />)
          : campaigns.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
              No campaigns yet. Create one!
            </div>
          ) : campaigns.map(c => (
            <div key={c._id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{c.subject}</p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                      c.status==="sent" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      c.status==="sending" ? "bg-blue-50 text-blue-700 border-blue-200" :
                      "bg-gray-50 text-gray-600 border-gray-200"
                    }`}>{c.status}</span>
                    {c.sentCount > 0 && <span className="text-xs text-gray-400">Sent to {c.sentCount} subscribers</span>}
                    {c.sentAt && <span className="text-xs text-gray-400">{new Date(c.sentAt).toLocaleDateString()}</span>}
                    <span className="text-xs text-gray-400 capitalize">Segment: {c.segment || "all"}</span>
                  </div>
                </div>
                {c.status === "draft" && (
                  <Btn onClick={() => handleSend(c._id)} disabled={sending === c._id} className="ml-3 flex-shrink-0">
                    {sending === c._id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send Now
                  </Btn>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Create Campaign" onClose={() => setShowModal(false)} wide>
          <form onSubmit={handleCreate} className="p-6 space-y-4">
            <Field label="Subject" required>
              <input required value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))} className={inputCls} placeholder="Flash Sale — Up to 50% off!" />
            </Field>
            <Field label="Segment">
              <select value={form.segment} onChange={e=>setForm(f=>({...f,segment:e.target.value}))} className={inputCls}>
                <option value="all">All Subscribers</option>
                <option value="active">Active Only</option>
              </select>
            </Field>
            <Field label="Email Content (HTML)" required>
              <textarea required rows={10} value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))}
                className={`${inputCls} font-mono text-xs`}
                placeholder={"<h1>Hello!</h1>\n<p>Check out our latest deals...</p>"} />
              <p className="text-xs text-gray-400 mt-1">Write HTML email content. Will be saved as draft — review before sending.</p>
            </Field>
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <Btn type="submit" disabled={submitting} className="flex-1 justify-center">
                {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                Save as Draft
              </Btn>
              <Btn type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1 justify-center">Cancel</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// ─── Reviews ───────────────────────────────────────────────────────────────────

const StarDisplay = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1,2,3,4,5].map(s => (
      <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "fill-gray-100 text-gray-300"}`} />
    ))}
  </div>
);

const ReviewsSection = () => {
  const [reviews, setReviews]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch]         = useState("");
  const [selected, setSelected]     = useState(null);
  const [updating, setUpdating]     = useState(null);

  useEffect(() => { fetchReviews(); }, [activeFilter]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeFilter !== "all") params.status = activeFilter;
      const res = await getAllReviewsAPI(params);
      // backend returns { success, count, data }
      setReviews(Array.isArray(res) ? res : (res.data || []));
    } catch (e) { Toast(e.message || "Failed to load reviews", "error"); }
    finally { setLoading(false); }
  };

  const handleStatusChange = async (id, status) => {
    setUpdating(id);
    try {
      await updateReviewStatusAPI(id, status);
      Toast(
        status === "approved"
          ? "Review approved — now visible on product page"
          : status === "rejected"
          ? "Review rejected"
          : "Review set to pending",
        "success"
      );
      // Update local state instantly for snappy UX, then refetch
      setReviews(prev => prev.map(r => r._id === id ? { ...r, status } : r));
      if (selected?._id === id) setSelected(s => ({ ...s, status }));
    } catch (e) { Toast(e.message || "Failed to update status", "error"); }
    finally { setUpdating(null); }
  };

  const statusColor = (s) => ({
    pending:  "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-red-50 text-red-600 border-red-200",
  }[s] || "bg-gray-50 text-gray-600 border-gray-200");

  const filtered = reviews.filter(r =>
    r.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.comment?.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    all:      reviews.length,
    pending:  reviews.filter(r => r.status === "pending").length,
    approved: reviews.filter(r => r.status === "approved").length,
    rejected: reviews.filter(r => r.status === "rejected").length,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-sm text-gray-500 mt-0.5">Moderate customer product reviews</p>
        </div>
        <Btn variant="secondary" onClick={fetchReviews}>
          <RefreshCw className="w-4 h-4" />Refresh
        </Btn>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-5">
        {[
          { key: "all",      label: "All" },
          { key: "pending",  label: "Pending" },
          { key: "approved", label: "Approved" },
          { key: "rejected", label: "Rejected" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium capitalize transition-all flex items-center gap-1.5 ${
              activeFilter === tab.key ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              activeFilter === tab.key ? "bg-gray-100 text-gray-700" : "bg-gray-200 text-gray-500"
            }`}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by user, product, comment…"
          className={`${inputCls} pl-9`}
        />
      </div>

      {/* ── Pending banner ── */}
      {counts.pending > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 font-medium">
            {counts.pending} review{counts.pending > 1 ? "s" : ""} waiting for approval
          </p>
          <button
            onClick={() => setActiveFilter("pending")}
            className="ml-auto text-xs font-semibold text-amber-700 hover:text-amber-900 underline underline-offset-2 transition"
          >
            Review now
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Reviewer","Product","Rating","Comment","Status","Actions"].map(h => (
                <th key={h} className={`px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${h === "Actions" ? "text-right" : "text-left"}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-14 text-center">
                  <Star className="w-10 h-10 text-gray-200 fill-gray-100 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm font-medium">No reviews found</p>
                </td>
              </tr>
            ) : filtered.map(r => (
              <tr key={r._id} className="hover:bg-gray-50/50 transition-colors">
                {/* Reviewer */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {r.user?.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[110px]">
                        {r.user?.name || "Unknown"}
                      </p>
                      {r.isVerifiedPurchase && (
                        <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-medium">
                          <BadgeCheck className="w-3 h-3" />Verified
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Product */}
                <td className="px-5 py-4">
                  <p className="text-sm text-gray-700 font-medium truncate max-w-[130px]">
                    {r.product?.name || "—"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </td>

                {/* Rating */}
                <td className="px-5 py-4">
                  <StarDisplay rating={r.rating} />
                  <p className="text-xs text-gray-400 mt-0.5">{r.rating}/5</p>
                </td>

                {/* Comment */}
                <td className="px-5 py-4 max-w-[200px]">
                  {r.title && (
                    <p className="text-xs font-semibold text-gray-800 mb-0.5 truncate">{r.title}</p>
                  )}
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{r.comment}</p>
                  {r.helpfulVotes > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                      <ThumbsUp className="w-3 h-3" />{r.helpfulVotes} helpful
                    </span>
                  )}
                </td>

                {/* Status */}
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${statusColor(r.status)}`}>
                    {r.status}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end items-center gap-1">
                    {/* View detail */}
                    <button
                      onClick={() => setSelected(r)}
                      title="View full review"
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Approve */}
                    {r.status !== "approved" && (
                      <button
                        onClick={() => handleStatusChange(r._id, "approved")}
                        disabled={updating === r._id}
                        title="Approve"
                        className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition disabled:opacity-40"
                      >
                        {updating === r._id
                          ? <RefreshCw className="w-4 h-4 animate-spin" />
                          : <CheckCircle className="w-4 h-4" />}
                      </button>
                    )}

                    {/* Reject */}
                    {r.status !== "rejected" && (
                      <button
                        onClick={() => handleStatusChange(r._id, "rejected")}
                        disabled={updating === r._id}
                        title="Reject"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition disabled:opacity-40"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}

                    {/* Set pending */}
                    {r.status !== "pending" && (
                      <button
                        onClick={() => handleStatusChange(r._id, "pending")}
                        disabled={updating === r._id}
                        title="Set to pending"
                        className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 transition disabled:opacity-40 text-[10px] font-bold px-2"
                      >
                        ↩
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Review Detail Modal ── */}
      {selected && (
        <Modal title="Review Detail" onClose={() => setSelected(null)}>
          <div className="p-6 space-y-5">
            {/* Reviewer */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold">
                {selected.user?.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{selected.user?.name || "Unknown"}</p>
                <p className="text-xs text-gray-400">{selected.user?.email || "—"}</p>
              </div>
              {selected.isVerifiedPurchase && (
                <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <BadgeCheck className="w-3.5 h-3.5" />Verified Purchase
                </span>
              )}
            </div>

            {/* Product + date */}
            <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 rounded-xl p-4">
              <div>
                <p className="text-xs text-gray-400 font-medium mb-0.5">Product</p>
                <p className="font-semibold text-gray-800">{selected.product?.name || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-0.5">Date</p>
                <p className="font-semibold text-gray-800">
                  {new Date(selected.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-0.5">Rating</p>
                <div className="flex items-center gap-2">
                  <StarDisplay rating={selected.rating} />
                  <span className="text-sm font-semibold text-gray-800">{selected.rating}/5</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-0.5">Status</p>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${statusColor(selected.status)}`}>
                  {selected.status}
                </span>
              </div>
            </div>

            {/* Content */}
            {selected.title && (
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1">Title</p>
                <p className="font-semibold text-gray-900">"{selected.title}"</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1">Comment</p>
              <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 rounded-xl px-4 py-3">
                {selected.comment}
              </p>
            </div>

            {selected.helpfulVotes > 0 && (
              <p className="flex items-center gap-1.5 text-sm text-gray-500">
                <ThumbsUp className="w-4 h-4" />
                {selected.helpfulVotes} {selected.helpfulVotes === 1 ? "person" : "people"} found this helpful
              </p>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              {selected.status !== "approved" && (
                <Btn
                  onClick={() => handleStatusChange(selected._id, "approved")}
                  disabled={updating === selected._id}
                  className="flex-1 justify-center bg-emerald-600 hover:bg-emerald-700"
                >
                  {updating === selected._id
                    ? <RefreshCw className="w-4 h-4 animate-spin" />
                    : <CheckCircle className="w-4 h-4" />}
                  Approve
                </Btn>
              )}
              {selected.status !== "rejected" && (
                <Btn
                  variant="danger"
                  onClick={() => handleStatusChange(selected._id, "rejected")}
                  disabled={updating === selected._id}
                  className="flex-1 justify-center"
                >
                  <X className="w-4 h-4" />
                  Reject
                </Btn>
              )}
              {selected.status !== "pending" && (
                <Btn
                  variant="secondary"
                  onClick={() => handleStatusChange(selected._id, "pending")}
                  disabled={updating === selected._id}
                  className="flex-1 justify-center"
                >
                  ↩ Set Pending
                </Btn>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminDashboard;