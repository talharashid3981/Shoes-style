import express from 'express';
import {
  addRecentlyViewed,
  getRecentlyViewed,
  clearRecentlyViewed,
  getRecentlyViewedIds, // New route
} from '../controllers/recentlyViewedController.js';
import optionalAuth from '../middleware/optionalAuth.js'; // ✅ Use optionalAuth

const router = express.Router();

// Main routes - all use optionalAuth for both logged in and guest users
router.route('/')
  .get(optionalAuth, getRecentlyViewed)
  .post(optionalAuth, addRecentlyViewed)
  .delete(optionalAuth, clearRecentlyViewed);

// Optional: Get only product IDs (lightweight)
router.get('/ids', optionalAuth, getRecentlyViewedIds);

export default router;