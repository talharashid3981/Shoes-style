import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
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

// ─── Cart Resolution Helper ───────────────────────────────────────────────────
// Returns the correct cart for the current request (user or guest).
// Handles guest→user cart merge when a guest logs in.
const resolveCart = async (req, res) => {
  // ─── Logged-in user ───────────────────────────────────────────────────────
  if (req.user?._id) {
    const userId = req.user._id;

    // Try to find existing user cart
    let userCart = await Cart.findOne({ user: userId });

    // ✅ CRITICAL FIX: Check for a guest cart to merge
    const guestId = req.cookies.guestId;
    if (guestId) {
      const guestCart = await Cart.findOne({ guestId });

      if (guestCart && guestCart.items.length > 0) {
        if (!userCart) {
          // No existing user cart — promote the guest cart to a user cart
          // ✅ FIX: Set the user field! Original code created an orphaned cart.
          guestCart.user = userId;
          guestCart.guestId = undefined;
          guestCart.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          await guestCart.save();
          return guestCart;
        } else {
          // User already has a cart — merge guest items into it
          for (const guestItem of guestCart.items) {
            const existingIdx = userCart.items.findIndex(
              (item) =>
                item.product.toString() === guestItem.product.toString() &&
                item.variant.color === guestItem.variant.color &&
                item.variant.size === guestItem.variant.size
            );

            if (existingIdx > -1) {
              // Same variant exists — sum quantities
              userCart.items[existingIdx].quantity += guestItem.quantity;
            } else {
              // New item — add to user cart
              userCart.items.push(guestItem);
            }
          }

          // Recalculate totals after merge
          userCart.totalItems = userCart.items.reduce((acc, i) => acc + i.quantity, 0);
          userCart.totalPrice = userCart.items.reduce((acc, i) => acc + i.quantity * i.price, 0);

          await userCart.save();
          await guestCart.deleteOne(); // ✅ Clean up the guest cart after merge
        }
      } else if (guestCart) {
        // Empty guest cart — just clean it up
        await guestCart.deleteOne();
      }
    }

    return userCart || null;
  }

  // ─── Guest user ───────────────────────────────────────────────────────────
  const guestId = req.cookies.guestId;
  if (guestId) {
    return await Cart.findOne({ guestId });
  }

  return null;
};

// ─── Get Cart Items ───────────────────────────────────────────────────────────
// @route   GET /api/cart
export const getCartItems = async (req, res) => {
  try {
    let cart = await resolveCart(req, res);

    if (cart) {
      cart = await cart.populate('items.product', 'name price images slug isActive');
      // Filter out items whose products have been deleted or deactivated
      const validItems = cart.items.filter((item) => item.product && item.product.isActive !== false);
      if (validItems.length !== cart.items.length) {
        cart.items = validItems;
        cart.totalItems = cart.items.reduce((acc, i) => acc + i.quantity, 0);
        cart.totalPrice = cart.items.reduce((acc, i) => acc + i.quantity * i.price, 0);
        await cart.save();
      }
      return res.json({ success: true, cart });
    }

    res.json({ success: true, cart: { items: [], totalPrice: 0, totalItems: 0 } });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Add to Cart ──────────────────────────────────────────────────────────────
// @route   POST /api/cart
export const addToCart = async (req, res) => {
  try {
    const { productId, variant, quantity } = req.body;

    if (!productId || !variant?.color || !variant?.size || !quantity) {
      return res.status(400).json({ success: false, message: 'productId, variant (color+size), and quantity are required' });
    }
    if (quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found or unavailable' });
    }

    // Stock validation
    const variantData = product.variants.find((v) => v.color === variant.color);
    const sizeData = variantData?.sizes.find((s) => s.size === variant.size);
    if (!sizeData) {
      return res.status(400).json({ success: false, message: 'Selected variant not found' });
    }
    if (sizeData.stock < quantity) {
      return res.status(400).json({ success: false, message: `Only ${sizeData.stock} units available` });
    }

    let cart = await resolveCart(req, res);

    if (!cart) {
      // Create new cart
      const cartData = {};

      if (req.user?._id) {
        cartData.user = req.user._id;
      } else {
        // Ensure guest has a cookie
        let guestId = req.cookies.guestId;
        if (!guestId) {
          guestId = uuidv4();
          setGuestCookie(res, guestId);
        }
        cartData.guestId = guestId;
      }

      cart = new Cart(cartData);
    }

    // Check if same variant already in cart
    const existingIdx = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.variant.color === variant.color &&
        item.variant.size === variant.size
    );

    if (existingIdx > -1) {
      const newQty = cart.items[existingIdx].quantity + quantity;
      if (sizeData.stock < newQty) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more. Only ${sizeData.stock} units available and ${cart.items[existingIdx].quantity} already in cart.`,
        });
      }
      cart.items[existingIdx].quantity = newQty;
    } else {
      cart.items.push({
        product: productId,
        variant,
        quantity,
        price: product.price,
      });
    }

    cart.totalItems = cart.items.reduce((acc, i) => acc + i.quantity, 0);
    cart.totalPrice = cart.items.reduce((acc, i) => acc + i.quantity * i.price, 0);
    // Extend expiry on activity
    cart.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await cart.save();
    cart = await cart.populate('items.product', 'name price images slug');

    res.status(201).json({ success: true, cart });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Update Cart Item ─────────────────────────────────────────────────────────
// @route   PUT /api/cart/:itemId
export const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    }

    let cart = await resolveCart(req, res);
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    // Stock check
    const product = await Product.findById(item.product);
    const variantData = product?.variants.find((v) => v.color === item.variant.color);
    const sizeData = variantData?.sizes.find((s) => s.size === item.variant.size);

    if (!sizeData || sizeData.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${sizeData?.stock ?? 0} units available`,
      });
    }

    item.quantity = quantity;
    cart.totalItems = cart.items.reduce((acc, i) => acc + i.quantity, 0);
    cart.totalPrice = cart.items.reduce((acc, i) => acc + i.quantity * i.price, 0);

    await cart.save();
    cart = await cart.populate('items.product', 'name price images slug');

    res.json({ success: true, cart });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Remove Cart Item ─────────────────────────────────────────────────────────
// @route   DELETE /api/cart/:itemId
export const removeCartItem = async (req, res) => {
  try {
    let cart = await resolveCart(req, res);
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter((item) => item._id.toString() !== req.params.itemId);

    if (cart.items.length === initialLength) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    cart.totalItems = cart.items.reduce((acc, i) => acc + i.quantity, 0);
    cart.totalPrice = cart.items.reduce((acc, i) => acc + i.quantity * i.price, 0);

    await cart.save();
    cart = await cart.populate('items.product', 'name price images slug');

    res.json({ success: true, cart });
  } catch (error) {
    console.error('Remove cart error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Apply Coupon ─────────────────────────────────────────────────────────────
// @route   POST /api/cart/apply-coupon
export const applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    let cart = await resolveCart(req, res);
    if (!cart || cart.items.length === 0) {
      return res.status(404).json({ success: false, message: 'Cart not found or is empty' });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), isActive: true });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    }

    const now = new Date();
    if (coupon.startDate && coupon.startDate > now) {
      return res.status(400).json({ success: false, message: 'Coupon is not yet active' });
    }
    if (coupon.endDate && coupon.endDate < now) {
      return res.status(400).json({ success: false, message: 'Coupon has expired' });
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit has been reached' });
    }
    if (req.user && coupon.perUserLimit) {
      const userUsedCount = coupon.usersUsed.filter(
        (id) => id.toString() === req.user._id.toString()
      ).length;
      if (userUsedCount >= coupon.perUserLimit) {
        return res.status(400).json({ success: false, message: 'You have already used this coupon' });
      }
    }
    if (coupon.minOrderValue && cart.totalPrice < coupon.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value for this coupon is ₹${coupon.minOrderValue}`,
      });
    }

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (cart.totalPrice * coupon.value) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else if (coupon.type === 'fixed') {
      discount = Math.min(coupon.value, cart.totalPrice); // Discount cannot exceed cart total
    } else if (coupon.type === 'free_shipping') {
      discount = 0; // Handled at checkout
    }

    cart.coupon = coupon._id;
    cart.discount = Math.round(discount * 100) / 100; // Round to 2 decimal places
    await cart.save();

    cart = await cart.populate('items.product', 'name price images slug');

    res.json({
      success: true,
      message: 'Coupon applied successfully',
      discount: cart.discount,
      couponType: coupon.type,
      cart,
    });
  } catch (error) {
    console.error('Apply coupon error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Remove Coupon ────────────────────────────────────────────────────────────
// @route   DELETE /api/cart/coupon
export const removeCoupon = async (req, res) => {
  try {
    let cart = await resolveCart(req, res);
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.coupon = undefined;
    cart.discount = 0;
    await cart.save();

    cart = await cart.populate('items.product', 'name price images slug');
    res.json({ success: true, cart });
  } catch (error) {
    console.error('Remove coupon error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};