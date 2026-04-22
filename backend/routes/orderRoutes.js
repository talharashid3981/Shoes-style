import express from 'express';
import {
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  guestOrderLookup,
  cancelOrder,
  // ✅ FIX #2: Import new invoice controller
  getOrderInvoice,
} from '../controllers/orderController.js';
import protect from '../middleware/auth.js';
import admin from '../middleware/admin.js';
import optionalAuth from '../middleware/optionalAuth.js';

const router = express.Router();

// =============================================
// USER ROUTES (Protected)
// =============================================

/**
 * @route   GET /api/orders/my-orders
 * @desc    Get logged-in user's orders
 * @access  Private
 */
router.get('/my-orders', protect, getMyOrders);

/**
 * @route   PUT /api/orders/:id/cancel
 * @desc    Cancel order (user)
 * @access  Private
 */
router.put('/:id/cancel', protect, cancelOrder);


// =============================================
// PUBLIC/GUEST ROUTES
// =============================================

/**
 * @route   POST /api/orders/lookup
 * @desc    Guest order lookup by email + orderId
 * @access  Public
 */
router.post('/lookup', guestOrderLookup);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID (accessible by owner or guest with email)
 * @access  Public (with email query param for guests)
 */
router.get('/:id', optionalAuth, getOrderById);

/**
 * @route   GET /api/orders/:id/invoice
 * @desc    Download/generate invoice for an order
 * @access  Public (owner or guest with ?email= param)
 * ✅ FIX #2: New invoice route — must come BEFORE /:id to avoid route conflict
 */
router.get('/:id/invoice', optionalAuth, getOrderInvoice);


// =============================================
// ADMIN ROUTES
// =============================================

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Update order status (admin)
 * @access  Private/Admin
 */
router.put('/:id/status', protect, admin, updateOrderStatus);

export default router;