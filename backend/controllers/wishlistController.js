import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import { v4 as uuidv4 } from 'uuid';

// ─── Cookie helper ────────────────────────────────────────────────────────────
const setGuestCookie = (res, guestId) => {
  res.cookie('guestId', guestId, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
};

// ─── Wishlist Resolution Helper ───────────────────────────────────────────────
// ✅ FIX: createIfMissing parameter controls whether a new document is created.
// READ operations (GET, check) pass false → no unnecessary DB writes.
// WRITE operations (add, remove, clear) pass true → create if needed.
const resolveWishlist = async (req, res, createIfMissing = false) => {
  // ─── Logged-in user ───────────────────────────────────────────────────────
  if (req.user?._id) {
    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist && createIfMissing) {
      wishlist = await Wishlist.create({ user: req.user._id, items: [] });
    }
    return wishlist;
  }

  // ─── Guest user ───────────────────────────────────────────────────────────
  let guestId = req.cookies?.guestId;

  if (!guestId && createIfMissing) {
    guestId = uuidv4();
    setGuestCookie(res, guestId);
  }

  if (!guestId) return null;

  let wishlist = await Wishlist.findOne({ guestId });
  if (!wishlist && createIfMissing) {
    wishlist = await Wishlist.create({ guestId, items: [] });
  }
  return wishlist;
};

// ─── Get Wishlist ─────────────────────────────────────────────────────────────
// @route   GET /api/wishlist
export const getWishlistItems = async (req, res) => {
  try {
    // ✅ FIX: createIfMissing=false — no DB write for a simple GET
    const wishlist = await resolveWishlist(req, res, false);

    if (!wishlist) {
      return res.json({ success: true, items: [] });
    }

    await wishlist.populate('items.product', 'name price images slug totalStock');
    res.json({ success: true, count: wishlist.items.length, items: wishlist.items });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Add to Wishlist ──────────────────────────────────────────────────────────
// @route   POST /api/wishlist
export const addToWishlist = async (req, res) => {
  try {
    const { productId, variant } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // ✅ createIfMissing=true — OK to create on write
    let wishlist = await resolveWishlist(req, res, true);

    if (!wishlist) {
      return res.status(400).json({ success: false, message: 'Unable to identify session' });
    }

    const exists = wishlist.items.some(
      (item) =>
        item.product.toString() === productId &&
        item.variant?.color === variant?.color &&
        item.variant?.size === variant?.size
    );

    if (!exists) {
      wishlist.items.push({ product: productId, variant });
      await wishlist.save();
    }

    await wishlist.populate('items.product', 'name price images slug totalStock');
    res.json({ success: true, count: wishlist.items.length, items: wishlist.items });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Remove from Wishlist ─────────────────────────────────────────────────────
// @route   DELETE /api/wishlist/:itemId
export const removeFromWishlist = async (req, res) => {
  try {
    // ✅ createIfMissing=false — no point creating a wishlist to immediately remove from it
    const wishlist = await resolveWishlist(req, res, false);

    if (!wishlist) {
      return res.status(404).json({ success: false, message: 'Wishlist not found' });
    }

    const initialLength = wishlist.items.length;
    wishlist.items = wishlist.items.filter(
      (item) => item._id.toString() !== req.params.itemId
    );

    if (wishlist.items.length === initialLength) {
      return res.status(404).json({ success: false, message: 'Item not found in wishlist' });
    }

    await wishlist.save();
    await wishlist.populate('items.product', 'name price images slug totalStock');

    res.json({ success: true, count: wishlist.items.length, items: wishlist.items });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Clear Wishlist ───────────────────────────────────────────────────────────
// @route   DELETE /api/wishlist
export const clearWishlist = async (req, res) => {
  try {
    const wishlist = await resolveWishlist(req, res, false);

    if (wishlist) {
      wishlist.items = [];
      await wishlist.save();
    }

    res.json({ success: true, message: 'Wishlist cleared', items: [] });
  } catch (error) {
    console.error('Clear wishlist error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Check if Product in Wishlist ─────────────────────────────────────────────
// @route   GET /api/wishlist/check/:productId
export const checkWishlistItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { color, size } = req.query;

    // ✅ createIfMissing=false — READ operation, no DB write
    const wishlist = await resolveWishlist(req, res, false);

    if (!wishlist) {
      return res.json({ success: true, inWishlist: false });
    }

    const exists = wishlist.items.some(
      (item) =>
        item.product.toString() === productId &&
        item.variant?.color === color &&
        item.variant?.size === size
    );

    res.json({ success: true, inWishlist: exists });
  } catch (error) {
    console.error('Check wishlist error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};