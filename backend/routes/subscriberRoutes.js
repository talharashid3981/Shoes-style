import express from 'express';
import {
  getSubscribers,
  exportSubscribers,
  deleteSubscriber,
} from '../controllers/subscriberController.js';
import  protect from "../middleware/auth.js"
import admin  from '../middleware/admin.js';


const router = express.Router();

router.get('/', protect, admin, getSubscribers);
router.get('/export', protect, admin, exportSubscribers);
router.delete('/:id', protect, admin, deleteSubscriber);

export default router;