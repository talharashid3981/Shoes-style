import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  getRelatedProducts,
} from '../controllers/productController.js';
import protect from '../middleware/auth.js';
import admin from '../middleware/admin.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.route('/')
  .get(getProducts)
  // ✅ FIX #1: upload.array middleware added so createProduct receives req.files
  .post(protect, admin, upload.array('images', 10), createProduct);

router.get('/related/:id', getRelatedProducts);
// Backward-compatible alias used by some frontend builds
router.get('/:id/related', getRelatedProducts);

router.route('/:id')
  .get(getProductById)
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);

router.post('/:id/images', protect, admin, upload.array('images', 10), uploadProductImages);

export default router;
