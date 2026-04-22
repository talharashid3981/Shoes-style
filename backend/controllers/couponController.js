import Coupon from '../models/Coupon.js';

// @desc    Get all coupons (admin)
// @route   GET /api/coupons
export const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort('-createdAt');
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single coupon (admin)
// @route   GET /api/coupons/:id
export const getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (coupon) {
      res.json(coupon);
    } else {
      res.status(404).json({ message: 'Coupon not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create coupon (admin)
// @route   POST /api/coupons
export const createCoupon = async (req, res) => {
  try {
    const coupon = new Coupon(req.body);
    const created = await coupon.save();
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update coupon (admin)
// @route   PUT /api/coupons/:id
export const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (coupon) {
      Object.assign(coupon, req.body);
      const updated = await coupon.save();
      res.json(updated);
    } else {
      res.status(404).json({ message: 'Coupon not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete coupon (admin)
// @route   DELETE /api/coupons/:id
export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (coupon) {
      await coupon.deleteOne();
      res.json({ message: 'Coupon removed' });
    } else {
      res.status(404).json({ message: 'Coupon not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Validate coupon (public, for frontend)
// @route   POST /api/coupons/validate
export const validateCoupon = async (req, res) => {
  try {
    const { code, cartTotal, userId } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) {
      return res.status(404).json({ valid: false, message: 'Invalid coupon' });
    }

    const now = new Date();
    if (coupon.startDate && coupon.startDate > now) {
      return res.status(400).json({ valid: false, message: 'Coupon not yet active' });
    }
    if (coupon.endDate && coupon.endDate < now) {
      return res.status(400).json({ valid: false, message: 'Coupon expired' });
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ valid: false, message: 'Coupon usage limit reached' });
    }
    if (coupon.minOrderValue && cartTotal < coupon.minOrderValue) {
      return res.status(400).json({ valid: false, message: `Minimum order value should be ${coupon.minOrderValue}` });
    }
    if (userId && coupon.perUserLimit) {
      const userUsed = coupon.usersUsed.filter(id => id.toString() === userId).length;
      if (userUsed >= coupon.perUserLimit) {
        return res.status(400).json({ valid: false, message: 'You have already used this coupon' });
      }
    }

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (cartTotal * coupon.value) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else if (coupon.type === 'fixed') {
      discount = coupon.value;
    }

    res.json({ valid: true, coupon, discount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};