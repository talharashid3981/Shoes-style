import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    banner: { url: String, publicId: String },
    description: String,
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    isActive: { type: Boolean, default: true },
    startDate: Date,
    endDate: Date,
    order: Number,
  },
  { timestamps: true }
);

export default mongoose.model('Collection', collectionSchema);