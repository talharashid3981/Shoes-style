import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    content: { type: String, required: true }, // HTML
    segment: { type: String, default: 'all' }, // 'all', 'subscribed', 'preferences'
    sentCount: { type: Number, default: 0 },
    openCount: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'scheduled', 'sending', 'sent'], default: 'draft' },
    scheduledAt: Date,
    sentAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model('NewsletterCampaign', campaignSchema);