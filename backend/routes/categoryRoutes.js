import express from 'express';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
} from '../controllers/categoryController.js';
import  protect from "../middleware/auth.js";
import admin  from '../middleware/admin.js';

import upload from '../middleware/upload.js';

const router = express.Router();

router.route('/')
  .get(getCategories)
  .post(protect, admin, createCategory);

router.route('/:id')
  .get(getCategoryById)
  .put(protect, admin, updateCategory)
  .delete(protect, admin, deleteCategory);

router.post('/:id/image', protect, admin, upload.single('image'), uploadCategoryImage);

export default router;