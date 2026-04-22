import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true },
    guestId: { type: String, unique: true, sparse: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        variant: {
          color: String,
          size: String,
        },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);



export default mongoose.model('Wishlist', wishlistSchema);