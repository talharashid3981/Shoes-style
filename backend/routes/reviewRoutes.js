import express from 'express';
import {
  createReview,
  getProductReviews,
  getMyProductReview,
  getAllReviews,
  updateReviewStatus,
  toggleFeatured,
  voteReview,
  uploadReviewImages,
} from '../controllers/reviewController.js';
import  protect from "../middleware/auth.js"
import admin  from '../middleware/admin.js';
import upload from '../middleware/upload.js';
import optionalAuth from '../middleware/optionalAuth.js';

const router = express.Router();

router.route('/')
  .get(protect, admin, getAllReviews)
  .post(protect, createReview);

router.get('/product/:productId/my-review', optionalAuth, getMyProductReview);
router.get('/product/:productId', getProductReviews);

router.post('/upload-images', protect, upload.array('images', 2), uploadReviewImages);

router.put('/:id/status', protect, admin, updateReviewStatus);
router.put('/:id/feature', protect, admin, toggleFeatured);
router.post('/:id/vote', protect, voteReview);

export default router;
