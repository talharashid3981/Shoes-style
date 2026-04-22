import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    compareAtPrice: { type: Number },
    sku: { type: String, required: true, unique: true },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    collections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Collection' }],
    tags: [String],
    label: { type: String, enum: ['New', 'Sale', 'Best Seller'] },
    images: [
      {
        url: { type: String, required: true },
        publicId: String,
        altText: String,
      },
    ],
    variants: [
      {
        color: { type: String, required: true },
        colorCode: String,
        images: [String],
        sizes: [
          {
            size: { type: String, required: true },
            stock: { type: Number, required: true, min: 0 },
            sku: String,
          },
        ],
      },
    ],
    lowStockThreshold: { type: Number, default: 5 },
    isActive: { type: Boolean, default: true },
    seo: {
      metaTitle: String,
      metaDescription: String,
    },
    totalStock: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);


// Index for search
productSchema.index({ name: 'text', description: 'text' });

export default mongoose.model('Product', productSchema);