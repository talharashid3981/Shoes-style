import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    guestEmail: String,
    orderId: { type: String, required: true, unique: true }, // Ab controller generate karega
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        image: String,
        variant: {
          color: String,
          size: String,
        },
        quantity: Number,
        price: Number,
      },
    ],
    shippingAddress: {
      name: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      phone: String,
    },
    billingAddress: {
      name: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      phone: String,
    },
    paymentMethod: { type: String, default: 'COD' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'return-requested', 'returned'],
      default: 'pending',
    },
    subtotal: Number,
    tax: Number,
    shippingCost: Number,
    discount: Number,
    total: Number,
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
    trackingNumber: String,
    notes: String,
    cancelledAt: Date,
    deliveredAt: Date,
    // invoiceUrl: String,
  },
  { timestamps: true }
);


export default mongoose.model('Order', orderSchema);