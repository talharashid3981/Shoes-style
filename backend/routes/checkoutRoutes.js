import express from 'express';
import { checkout } from '../controllers/checkoutController.js';
import optionalAuth from '../middleware/optionalAuth.js'; // ✅ Import optionalAuth for guest users

const router = express.Router();

// POST /api/checkout - Works for both logged in and guest users
router.post('/', optionalAuth, checkout);

export default router;