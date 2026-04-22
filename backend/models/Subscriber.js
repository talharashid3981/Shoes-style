import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    name: String,
    preferences: [String], // categories user interested in
    isActive: { type: Boolean, default: false }, // after double opt-in
    verificationToken: String,
    verificationExpire: Date,
    subscribedAt: Date,
    unsubscribedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model('Subscriber', subscriberSchema);