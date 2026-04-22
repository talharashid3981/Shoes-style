import express from 'express';
import {
  getBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  uploadBannerImage,
} from '../controllers/bannerController.js';
import protect from "../middleware/auth.js";
import admin from '../middleware/admin.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// =============================================
// PUBLIC ROUTES
// =============================================

/**
 * @route   GET /api/banners
 * @desc    Get active banners for frontend
 * @access  Public
 */
router.get('/', getBanners);


// =============================================
// ADMIN ROUTES
// =============================================

/**
 * @route   POST /api/banners
 * @desc    Create new banner with image
 * @access  Private/Admin
 */
router.post('/', protect, admin, upload.single('image'), createBanner);

/**
 * @route   GET /api/banners/all
 * @desc    Get all banners (admin)
 * @access  Private/Admin
 */
router.get('/all', protect, admin, getAllBanners);

/**
 * @route   PUT /api/banners/:id
 * @desc    Update banner (with optional image)
 * @access  Private/Admin
 */
router.put('/:id', protect, admin, upload.single('image'), updateBanner);

/**
 * @route   DELETE /api/banners/:id
 * @desc    Delete banner
 * @access  Private/Admin
 */
router.delete('/:id', protect, admin, deleteBanner);

/**
 * @route   POST /api/banners/:id/image
 * @desc    Upload/Update banner image only
 * @access  Private/Admin
 */
router.post('/:id/image', protect, admin, upload.single('image'), uploadBannerImage);

export default router;