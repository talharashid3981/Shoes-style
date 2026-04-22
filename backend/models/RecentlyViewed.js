import mongoose from 'mongoose';

const recentlyViewedSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      sparse: true, 
      unique: true
    },
    guestId: { 
      type: String, 
      sparse: true, 
      unique: true
    },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        viewedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// ✅ EITHER use schema.index() (recommended for multiple indexes)
// recentlyViewedSchema.index({ user: 1 });
// recentlyViewedSchema.index({ guestId: 1 });

// ✅ OR use index in field definition - but don't use both!



export default mongoose.model('RecentlyViewed', recentlyViewedSchema);