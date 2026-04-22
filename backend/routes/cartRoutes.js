import express from 'express';
import {
  getCartItems,
  addToCart,
  updateCartItem,
  removeCartItem,
  applyCoupon,
  removeCoupon,
} from '../controllers/cartController.js';
import optionalAuth from '../middleware/optionalAuth.js';

const router = express.Router();

// ✅ FIX #9: Specific routes MUST come before param routes to avoid conflicts
router.post('/apply-coupon', optionalAuth, applyCoupon);  // ✅ Must be before /:itemId
router.delete('/coupon', optionalAuth, removeCoupon);      // ✅ Must be before /:itemId

router.route('/')
  .get(optionalAuth, getCartItems)
  .post(optionalAuth, addToCart);

router.route('/:itemId')
  .put(optionalAuth, updateCartItem)
  .delete(optionalAuth, removeCartItem);

export default router;