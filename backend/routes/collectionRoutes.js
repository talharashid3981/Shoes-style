import express from 'express';
import {
  getCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
  uploadCollectionBanner,
} from '../controllers/collectionController.js';
import  protect from "../middleware/auth.js"
import admin  from '../middleware/admin.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.route('/')
  .get(getCollections)
  .post(protect, admin, createCollection);

router.route('/:id')
  .get(getCollectionById)
  .put(protect, admin, updateCollection)
  .delete(protect, admin, deleteCollection);

router.post('/:id/banner', protect, admin, upload.single('banner'), uploadCollectionBanner);

export default router;