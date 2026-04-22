import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, // to ensure verified purchase
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: String,
    comment: { type: String, required: true },
    images: [{ url: String, publicId: String }],
    isVerifiedPurchase: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    helpfulVotes: { type: Number, default: 0 },
    unhelpfulVotes: { type: Number, default: 0 },
    votedBy: [{ user: mongoose.Schema.Types.ObjectId, vote: String }],
  },
  { timestamps: true }
);

// Ensure one review per user per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);