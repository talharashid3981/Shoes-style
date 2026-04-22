import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    description: String,
    type: { type: String, enum: ['percentage', 'fixed', 'free_shipping'], required: true },
    value: { type: Number }, // for percentage or fixed amount
    minOrderValue: Number,
    maxDiscount: Number, // for percentage caps
    appliesTo: {
      categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
      products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
      all: { type: Boolean, default: false },
    },
    isFirstPurchaseOnly: { type: Boolean, default: false },
    usageLimit: Number, // total uses
    perUserLimit: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
    usersUsed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    startDate: Date,
    endDate: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Coupon', couponSchema);