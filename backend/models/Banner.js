import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: true,
      trim: true 
    },
    description: String,
    image: { 
      url: { 
        type: String, 
        required: true 
      }, 
      publicId: String 
    },
    link: String,
    ctaText: String,
    isActive: { 
      type: Boolean, 
      default: true 
    },
    order: { 
      type: Number, 
      default: 0 
    },
    startDate: Date,
    endDate: Date,
  },
  { timestamps: true }
);

export default mongoose.model('Banner', bannerSchema);