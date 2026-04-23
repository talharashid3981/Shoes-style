import Product from '../models/Product.js';
import cloudinary from '../config/cloudinary.js';
import slugify from 'slugify';
import mongoose from 'mongoose';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const generateSlug = (name) => slugify(name, { lower: true, strict: true });

const calculateTotalStock = (variants) =>
  variants.reduce(
    (acc, variant) => acc + variant.sizes.reduce((sum, size) => sum + size.stock, 0),
    0
  );

const generateSKU = (name) => {
  const base = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
  return `${base}-${Date.now().toString().slice(-6)}`;
};

// ✅ FIX: Safe ID/slug lookup — avoids CastError 500 when param is a slug string
const buildIdOrSlugQuery = (param) => {
  if (mongoose.Types.ObjectId.isValid(param)) {
    return { $or: [{ _id: param }, { slug: param }] };
  }
  return { slug: param };
};

// ✅ FIX #1: Helper to map multer files to image objects (used in create & upload routes)
const uploadImagesToCloudinary = async (files) => {
  if (!files || files.length === 0) return [];
  return files.map((file) => ({
    url: file.path,
    publicId: file.filename,
  }));
};

// ─── Get All Products ─────────────────────────────────────────────────────────
// @route   GET /api/products
export const getProducts = async (req, res) => {
  try {
    const pageSize = Math.min(Number(req.query.limit) || 10, 50); // Cap at 50
    const page = Math.max(Number(req.query.page) || 1, 1);

    const filter = { isActive: true };

    // Text search
    if (req.query.keyword) {
      filter.$text = { $search: req.query.keyword };
    }

    // Category filter
    if (req.query.category) {
      filter.categories = req.query.category;
    }

    // Collection filter
    if (req.query.collection) {
      filter.collections = req.query.collection;
    }

    // ✅ CRITICAL FIX: Build price filter correctly.
    // Old code: spread { price: {$gte} } then { price: {$lte} } — second key overwrites first.
    // New code: build a single price object so both conditions coexist.
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
    }

    // Label filter (New, Sale, Best Seller)
    if (req.query.label) {
      filter.label = req.query.label;
    }
    

    // Allowed sort fields to prevent arbitrary sort injection
    const ALLOWED_SORTS = ['-createdAt', 'createdAt', 'price', '-price', '-soldCount', '-rating'];
    const sort = ALLOWED_SORTS.includes(req.query.sort) ? req.query.sort : '-createdAt';

    const [count, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .populate('categories', 'name slug')
        .populate('collections', 'name slug')
        .select('-variants.sizes.sku') // Reduce payload size for list view
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort(sort),
    ]);

    res.json({
      success: true,
      products,
      page,
      pages: Math.ceil(count / pageSize),
      total: count,
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Product by ID or Slug ────────────────────────────────────────────────
// @route   GET /api/products/:id
export const getProductById = async (req, res) => {
  try {
    // ✅ FIX: Safe query — prevents CastError when param is a slug string
    const product = await Product.findOne(buildIdOrSlugQuery(req.params.id))
      .populate('categories', 'name slug')
      .populate('collections', 'name slug');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Create Product ───────────────────────────────────────────────────────────
// @route   POST /api/products
export const createProduct = async (req, res) => {
  try {
    // ✅ FIX #1: Parse form data — multer provides files separately; text fields may contain JSON strings
    const productData = { ...req.body };

    // Handle variants if sent as JSON string (multipart form)
    if (productData.variants && typeof productData.variants === 'string') {
      productData.variants = JSON.parse(productData.variants);
    }

    // Handle categories if sent as JSON string
    if (productData.categories && typeof productData.categories === 'string') {
      productData.categories = JSON.parse(productData.categories);
    }

    // Handle collections if sent as JSON string
    if (productData.collections && typeof productData.collections === 'string') {
      productData.collections = JSON.parse(productData.collections);
    }

    if (!productData.name) {
      return res.status(400).json({ success: false, message: 'Product name is required' });
    }

    // ✅ FIX #1: Upload images if files were attached to the request
    if (req.files && req.files.length > 0) {
      productData.images = await uploadImagesToCloudinary(req.files);
    }

    // Slug
    productData.slug = generateSlug(productData.name);
    const existingSlug = await Product.findOne({ slug: productData.slug });
    if (existingSlug) {
      return res.status(400).json({ success: false, message: 'A product with this name already exists' });
    }

    // SKU — auto-generate if not provided
    if (!productData.sku) {
      productData.sku = generateSKU(productData.name);
    }

    // Total stock
    if (productData.variants?.length > 0) {
      productData.totalStock = calculateTotalStock(productData.variants);
    }

    const product = new Product(productData);
    const created = await product.save();

    res.status(201).json({ success: true, product: created });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ success: false, message: `A product with this ${field} already exists` });
    }
    // ✅ FIX #1: Handle malformed JSON strings in multipart fields
    if (error instanceof SyntaxError) {
      return res.status(400).json({ success: false, message: 'Invalid JSON in request body' });
    }
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Update Product ───────────────────────────────────────────────────────────
// @route   PUT /api/products/:id
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Slug update
    if (req.body.name && req.body.name !== product.name) {
      const newSlug = generateSlug(req.body.name);
      const existing = await Product.findOne({ slug: newSlug, _id: { $ne: product._id } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'A product with this name already exists' });
      }
      product.slug = newSlug;
    }

    // SKU update — check for duplicates
    if (req.body.sku && req.body.sku !== product.sku) {
      const existingSku = await Product.findOne({ sku: req.body.sku, _id: { $ne: product._id } });
      if (existingSku) {
        return res.status(400).json({ success: false, message: 'SKU already exists' });
      }
    }

    Object.assign(product, req.body);

    // Recalculate stock if variants were changed
    if (req.body.variants) {
      product.totalStock = calculateTotalStock(product.variants);
    }

    const updated = await product.save();
    res.json({ success: true, product: updated });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ success: false, message: `A product with this ${field} already exists` });
    }
    console.error('Update product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Delete Product ───────────────────────────────────────────────────────────
// @route   DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Delete images from Cloudinary
    if (product.images?.length) {
      await Promise.all(
        product.images
          .filter((img) => img.publicId)
          .map((img) => cloudinary.uploader.destroy(img.publicId))
      );
    }

    await product.deleteOne();
    res.json({ success: true, message: 'Product removed' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Upload Product Images ────────────────────────────────────────────────────
// @route   POST /api/products/:id/images
export const uploadProductImages = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (!req.files?.length) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const images = req.files.map((file) => ({
      url: file.path,
      publicId: file.filename,
    }));

    product.images.push(...images);
    await product.save();

    res.json({ success: true, product });
  } catch (error) {
    console.error('Upload product images error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Related Products ─────────────────────────────────────────────────────
// @route   GET /api/products/:id/related
export const getRelatedProducts = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select('categories');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const related = await Product.find({
      categories: { $in: product.categories },
      _id: { $ne: product._id },
      isActive: true,
    })
      .limit(8)
      .select('name price images slug rating numReviews label')
      .populate('categories', 'name');

    res.json({ success: true, count: related.length, products: related });
  } catch (error) {
    console.error('Get related products error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};