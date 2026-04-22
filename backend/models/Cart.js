// import mongoose from 'mongoose';

// const cartSchema = new mongoose.Schema(
//   {
//     user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//     guestId: { type: String }, // for guests
//     items: [
//       {
//         product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
//         variant: {
//           color: String,
//           size: String,
//         },
//         quantity: { type: Number, required: true, min: 1 },
//         price: { type: Number, required: true }, // snapshot price at add time
//       },
//     ],
//     totalPrice: { type: Number, default: 0 },
//     totalItems: { type: Number, default: 0 },
//     coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
//     discount: { type: Number, default: 0 },
// expiresAt: {
//   type: Date,
//   default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
// }  },
//   { timestamps: true }
// );

// // Index for abandoned cart recovery
// cartSchema.index({ updatedAt: 1 });

// export default mongoose.model('Cart', cartSchema);
import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    guestId: { type: String },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        variant: {
          color: String,
          size: String,
        },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true }, // Snapshot price at time of add
      },
    ],
    totalPrice: { type: Number, default: 0 },
    totalItems: { type: Number, default: 0 },
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
    discount: { type: Number, default: 0 },

    // ✅ TTL: Cart auto-deletes 30 days after creation if not updated
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },

    // ✅ CRITICAL FIX: This field MUST be in the schema.
    // abandonedCartJob.js writes to this field to track when a reminder was last sent.
    // Without this field in the schema, Mongoose silently discards the value (strict mode),
    // causing the cron job to re-send reminder emails on EVERY run to the same carts.
    reminderSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Fast lookup by user or guest
cartSchema.index({ user: 1 });
cartSchema.index({ guestId: 1 });

// ✅ TTL index — MongoDB automatically deletes documents when expiresAt is reached
// This requires a background task in MongoDB; no application-level code needed
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// For abandoned cart job queries (find carts not updated in 30+ mins)
cartSchema.index({ updatedAt: 1 });

export default mongoose.model('Cart', cartSchema);