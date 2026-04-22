import express from 'express';
import {
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} from '../controllers/couponController.js';
import  protect from "../middleware/auth.js"
import admin  from '../middleware/admin.js';

const router = express.Router();

router.route('/')
  .get(protect, admin, getCoupons)
  .post(protect, admin, createCoupon);

router.post('/validate', validateCoupon); // public validation

router.route('/:id')
  .get(protect, admin, getCouponById)
  .put(protect, admin, updateCoupon)
  .delete(protect, admin, deleteCoupon);

export default router;