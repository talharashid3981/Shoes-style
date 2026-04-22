import express from 'express';
import {
  getWishlistItems,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  checkWishlistItem, // New route
} from '../controllers/wishlistController.js';
import optionalAuth from '../middleware/optionalAuth.js'; // ✅ Use optionalAuth

const router = express.Router();

// ✅ All routes use optionalAuth - works for both logged in and guest users
router.route('/')
  .get(optionalAuth, getWishlistItems)
  .post(optionalAuth, addToWishlist)
  .delete(optionalAuth, clearWishlist);

router.delete('/:itemId', optionalAuth, removeFromWishlist);

// Optional: Check if specific product variant is in wishlist
router.get('/check/:productId', optionalAuth, checkWishlistItem);

export default router;