import express from 'express';
import {
  getDashboardStats,
  getRecentOrders,
  getTopProducts,
  getLowStock,
  getSalesOverview, // ✅ FIX #8: Import missing function
} from '../controllers/adminController.js';
import protect from '../middleware/auth.js';
import admin from '../middleware/admin.js';

const router = express.Router();

router.get('/stats', protect, admin, getDashboardStats);
router.get('/recent-orders', protect, admin, getRecentOrders);
router.get('/top-products', protect, admin, getTopProducts);
router.get('/low-stock', protect, admin, getLowStock);
router.get('/sales-overview', protect, admin, getSalesOverview); // ✅ FIX #8: Register missing route

export default router;