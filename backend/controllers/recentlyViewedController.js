import RecentlyViewed from '../models/RecentlyViewed.js';
import Product from '../models/Product.js';
import { v4 as uuidv4 } from 'uuid';

const MAX_ITEMS = 20;

// ✅ FIX #15: Separate read vs write — GET does NOT create documents unnecessarily
const getOrCreateDoc = async (req, res, createIfMissing = false) => {
  if (req.user?._id) {
    let doc = await RecentlyViewed.findOne({ user: req.user._id });
    if (!doc && createIfMissing) {
      doc = new RecentlyViewed({ user: req.user._id, items: [] });
      await doc.save();
    }
    return doc;
  }

  let guestId = req.cookies?.guestId;

  if (!guestId && createIfMissing) {
    guestId = uuidv4();
    if (res) {
      res.cookie('guestId', guestId, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    }
  }

  if (!guestId) return null;

  let doc = await RecentlyViewed.findOne({ guestId });
  if (!doc && createIfMissing) {
    doc = new RecentlyViewed({ guestId, items: [] });
    await doc.save();
  }
  return doc;
};

// @desc    Add product to recently viewed
// @route   POST /api/recently-viewed
export const addRecentlyViewed = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // ✅ createIfMissing = true only on write operations
    const doc = await getOrCreateDoc(req, res, true);
    if (!doc) {
      return res.status(400).json({ success: false, message: 'Unable to identify session' });
    }

    doc.items = doc.items.filter(item => item.product.toString() !== productId);
    doc.items.push({ product: productId, viewedAt: new Date() });

    // Keep max 20 items, newest first
    if (doc.items.length > MAX_ITEMS) {
      doc.items = doc.items
        .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt))
        .slice(0, MAX_ITEMS);
    }

    await doc.save();

    res.json({ success: true, message: 'Added to recently viewed' });
  } catch (error) {
    console.error('Add recently viewed error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get recently viewed products
// @route   GET /api/recently-viewed
export const getRecentlyViewed = async (req, res) => {
  try {
    // ✅ FIX #15: createIfMissing = false on GET — no unnecessary DB writes
    const doc = await getOrCreateDoc(req, res, false);

    if (!doc) {
      return res.json({ success: true, count: 0, items: [] });
    }

    await doc.populate({
      path: 'items.product',
      select: 'name price images slug categories',
    });

    const sortedItems = doc.items
      .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt))
      .map(item => ({
        _id: item.product?._id,
        name: item.product?.name,
        price: item.product?.price,
        images: item.product?.images,
        slug: item.product?.slug,
        categories: item.product?.categories,
        viewedAt: item.viewedAt,
      }))
      .filter(item => item._id);

    res.json({ success: true, count: sortedItems.length, items: sortedItems });
  } catch (error) {
    console.error('Get recently viewed error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clear recently viewed
// @route   DELETE /api/recently-viewed
export const clearRecentlyViewed = async (req, res) => {
  try {
    const doc = await getOrCreateDoc(req, res, false);

    if (doc) {
      doc.items = [];
      await doc.save();
    }

    res.json({ success: true, message: 'Recently viewed cleared successfully' });
  } catch (error) {
    console.error('Clear recently viewed error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get recently viewed product IDs only (lightweight)
// @route   GET /api/recently-viewed/ids
export const getRecentlyViewedIds = async (req, res) => {
  try {
    const doc = await getOrCreateDoc(req, res, false);

    if (!doc) {
      return res.json({ success: true, productIds: [] });
    }

    const productIds = doc.items
      .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt))
      .map(item => item.product.toString());

    res.json({ success: true, productIds });
  } catch (error) {
    console.error('Get recently viewed IDs error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};