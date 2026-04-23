import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import { calculateTax } from '../utils/calculateTax.js';
import { sendEmail } from '../utils/sendEmail.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateOrderId = async () => {
  const Counter = (await import('../models/Counter.js')).default;
  const counter = await Counter.findOneAndUpdate(
    { name: 'orderId' },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true } // ✅ fixed deprecated `new: true`
  );
  return `SOLE-${String(counter.seq).padStart(6, '0')}`;
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ─── Checkout ─────────────────────────────────────────────────────────────────
// @route   POST /api/checkout
export const checkout = async (req, res) => {
  try {
    const { shippingAddress, billingAddress, notes, guestEmail } = req.body;

    // ─── Validate guest email ─────────────────────────────────────────────
    if (!req.user) {
      if (!guestEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email address is required for guest checkout',
        });
      }
      if (!isValidEmail(guestEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address',
        });
      }
    }

    // ─── Validate shipping address ────────────────────────────────────────
    const requiredAddressFields = ['addressLine1', 'city', 'state', 'postalCode', 'country', 'phone'];
    for (const field of requiredAddressFields) {
      if (!shippingAddress?.[field]) {
        return res.status(400).json({
          success: false,
          message: `Shipping address is missing required field: ${field}`,
        });
      }
    }

    // ─── Load cart ────────────────────────────────────────────────────────
    let cart;
    if (req.user) {
      cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    } else {
      const guestId = req.cookies.guestId;
      if (!guestId) {
        return res.status(400).json({ success: false, message: 'Cart not found' });
      }
      cart = await Cart.findOne({ guestId }).populate('items.product');
    }

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    // ─── Validate stock ───────────────────────────────────────────────────
    for (const item of cart.items) {
      const product = item.product;
      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product "${item.product?.name || 'unknown'}" is no longer available`,
        });
      }

      const variant = product.variants.find((v) => v.color === item.variant.color);
      const size = variant?.sizes.find((s) => s.size === item.variant.size);

      if (!size || size.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name} (${item.variant.color} / ${item.variant.size}). Available: ${size?.stock ?? 0}`,
        });
      }
    }

    // ─── Atomic stock decrement ───────────────────────────────────────────
    for (const item of cart.items) {
      const result = await Product.findOneAndUpdate(
        {
          _id: item.product._id,
          'variants.color': item.variant.color,
          'variants.sizes': {
            $elemMatch: {
              size: item.variant.size,
              stock: { $gte: item.quantity },
            },
          },
        },
        {
          $inc: {
            'variants.$[v].sizes.$[s].stock': -item.quantity,
            soldCount: item.quantity,
          },
        },
        {
          arrayFilters: [
            { 'v.color': item.variant.color },
            { 's.size': item.variant.size },
          ],
          returnDocument: 'after', // ✅ fixed deprecated `new: true`
        }
      );

      if (!result) {
        return res.status(409).json({
          success: false,
          message: `Stock for ${item.product.name} (${item.variant.color} / ${item.variant.size}) was just depleted. Please update your cart.`,
        });
      }

      // ✅ FIX: Pass { updatePipeline: true } when using an aggregation pipeline array
      await Product.findByIdAndUpdate(
        item.product._id,
        [
          {
            $set: {
              totalStock: {
                $sum: {
                  $map: {
                    input: '$variants',
                    as: 'v',
                    in: { $sum: '$$v.sizes.stock' },
                  },
                },
              },
            },
          },
        ],
        { updatePipeline: true } // ✅ THIS was the missing option causing the 500 error
      );
    }

    // ─── Calculate totals ─────────────────────────────────────────────────
    const subtotal = cart.totalPrice;
    const tax = calculateTax(subtotal, shippingAddress.state);

    let shippingCost = subtotal > 500 ? 0 : 50;
    const discount = cart.discount || 0;

    let appliedCoupon = null;
    if (cart.coupon) {
      appliedCoupon = await Coupon.findById(cart.coupon);
      if (appliedCoupon?.type === 'free_shipping') {
        shippingCost = 0;
      }
    }

    const total = Math.max(0, subtotal + tax + shippingCost - discount);

    // ─── Create Order ─────────────────────────────────────────────────────
    const orderId = await generateOrderId();

    const normalizedShipping = {
      name: shippingAddress.name || req.user?.name || 'Guest',
      addressLine1: shippingAddress.addressLine1 || shippingAddress.street,
      addressLine2: shippingAddress.addressLine2 || '',
      city: shippingAddress.city,
      state: shippingAddress.state,
      postalCode: shippingAddress.postalCode || shippingAddress.zipCode,
      country: shippingAddress.country,
      phone: shippingAddress.phone,
    };

    const orderData = {
      orderId,
      items: cart.items.map((item) => ({
        product: item.product._id,
        name: item.product.name,
        image: item.product.images?.[0]?.url || '',
        variant: item.variant,
        quantity: item.quantity,
        price: item.price,
      })),
      shippingAddress: normalizedShipping,
      billingAddress: billingAddress
        ? {
            name: billingAddress.name || normalizedShipping.name,
            addressLine1: billingAddress.addressLine1 || billingAddress.street,
            addressLine2: billingAddress.addressLine2 || '',
            city: billingAddress.city,
            state: billingAddress.state,
            postalCode: billingAddress.postalCode || billingAddress.zipCode,
            country: billingAddress.country,
            phone: billingAddress.phone,
          }
        : normalizedShipping,
      paymentMethod: 'COD',
      subtotal,
      tax,
      shippingCost,
      discount,
      total,
      notes: notes || '',
      coupon: cart.coupon || undefined,
    };

    if (req.user) {
      orderData.user = req.user._id;
    } else {
      orderData.guestEmail = guestEmail.toLowerCase();
    }

    const order = new Order(orderData);
    await order.save();

    // ─── Update coupon usage ──────────────────────────────────────────────
    if (appliedCoupon) {
      appliedCoupon.usedCount += 1;
      if (req.user) appliedCoupon.usersUsed.push(req.user._id);
      await appliedCoupon.save();
    }

    // ─── Clear cart ───────────────────────────────────────────────────────
    await Cart.findByIdAndDelete(cart._id);
    if (!req.user) {
      res.clearCookie('guestId');
    }

    // ─── Send confirmation email ──────────────────────────────────────────
    const emailTo = req.user ? req.user.email : guestEmail;
    if (emailTo) {
      try {
        await sendEmail({
          to: emailTo,
          subject: `Order Confirmed — #${order.orderId}`,
          html: `
            <h2>Thank you for your order!</h2>
            <p>Your order <strong>#${order.orderId}</strong> has been placed successfully.</p>
            <table style="width:100%; border-collapse:collapse;">
              <tr style="background:#f5f5f5;">
                <th style="padding:8px; text-align:left;">Item</th>
                <th style="padding:8px; text-align:right;">Qty</th>
                <th style="padding:8px; text-align:right;">Price</th>
              </tr>
              ${order.items
                .map(
                  (item) => `
                <tr>
                  <td style="padding:8px;">${item.name} (${item.variant.color} / ${item.variant.size})</td>
                  <td style="padding:8px; text-align:right;">${item.quantity}</td>
                  <td style="padding:8px; text-align:right;">₹${item.price * item.quantity}</td>
                </tr>
              `
                )
                .join('')}
            </table>
            <hr />
            <p>Subtotal: ₹${subtotal} | Tax: ₹${tax.toFixed(2)} | Shipping: ₹${shippingCost} | Discount: ₹${discount}</p>
            <p><strong>Total: ₹${total.toFixed(2)}</strong></p>
            <p>Shipping to: ${normalizedShipping.addressLine1}, ${normalizedShipping.city}, ${normalizedShipping.state}</p>
            <p>Payment Method: Cash on Delivery</p>
          `,
        });
      } catch (emailErr) {
        console.error('Order confirmation email failed:', emailErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: {
        _id: order._id,
        orderId: order.orderId,
        items: order.items,
        subtotal: order.subtotal,
        tax: order.tax,
        shippingCost: order.shippingCost,
        discount: order.discount,
        total: order.total,
        orderStatus: order.orderStatus,
        paymentMethod: order.paymentMethod,
        shippingAddress: order.shippingAddress,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};






