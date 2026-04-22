import Order from "../models/Order.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import { sendEmail } from "../utils/sendEmail.js";
// ✅ FIX #2: Import invoice generator utility
import { generateInvoice } from "../utils/invoiceGenerator.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getOrderEmail = async (order) => {
  if (order.guestEmail) return order.guestEmail;
  if (order.user) {
    const user = await User.findById(order.user).select("email");
    return user?.email || null;
  }
  return null;
};

const restoreStock = async (items) => {
  for (const item of items) {
    if (!item.product) continue;

    // ✅ Atomic stock restore with $inc — same approach as checkout decrement
    await Product.findOneAndUpdate(
      { _id: item.product, "variants.color": item.variant.color },
      {
        $inc: {
          "variants.$[v].sizes.$[s].stock": item.quantity,
          soldCount: -item.quantity,
        },
      },
      {
        arrayFilters: [
          { "v.color": item.variant.color },
          { "s.size": item.variant.size },
        ],
      },
    );

    // Recalculate totalStock
    await Product.findByIdAndUpdate(item.product, [
      {
        $set: {
          totalStock: {
            $sum: {
              $map: {
                input: "$variants",
                as: "v",
                in: { $sum: "$$v.sizes.stock" },
              },
            },
          },
          // Prevent soldCount from going below 0
          soldCount: { $max: ["$soldCount", 0] },
        },
      },
    ]);
  }
};

// ─── Get My Orders ────────────────────────────────────────────────────────────
// @route   GET /api/orders/my-orders
export const getMyOrders = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 50);

    const [orders, total] = await Promise.all([
      Order.find({ user: req.user._id })
        .sort("-createdAt")
        .skip((page - 1) * limit)
        .limit(limit)
        .select(
          "orderId total subtotal tax discount shippingCost orderStatus createdAt items shippingAddress paymentMethod trackingNumber",
        ),
      Order.countDocuments({ user: req.user._id }),
    ]);

    const formatted = orders.map((order) => ({
      _id: order._id,
      orderId: order.orderId,
      total: order.total,
      status: order.orderStatus,
      createdAt: order.createdAt,
      itemCount: order.items.length,
      firstItemImage: order.items[0]?.image || null,
      items: order.items.map((item) => ({
        name: item.name,
        image: item.image,
        variant: item.variant,
        quantity: item.quantity,
        price: item.price,
      })),
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      trackingNumber: order.trackingNumber || null,
    }));

    res.json({
      success: true,
      count: formatted.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      orders: formatted,
    });
  } catch (error) {
    console.error("Get my orders error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Order by ID ──────────────────────────────────────────────────────────
// @route   GET /api/orders/:id
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("items.product", "name images slug");

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // ✅ Authorization: logged-in owner OR guest with matching email OR admin
    const isOwner =
      order.user &&
      req.user &&
      order.user._id.toString() === req.user._id.toString();
    const isGuestOwner =
      order.guestEmail &&
      req.query.email &&
      order.guestEmail.toLowerCase() === req.query.email.toLowerCase();
    const isAdmin = req.user?.role === "admin";

    if (!isOwner && !isGuestOwner && !isAdmin) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized to view this order" });
    }

    res.json({
      success: true,
      order: {
        _id: order._id,
        orderId: order.orderId,
        items: order.items.map((item) => ({
          productId: item.product?._id,
          name: item.name,
          image: item.image,
          variant: item.variant,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        })),
        subtotal: order.subtotal,
        tax: order.tax,
        shippingCost: order.shippingCost,
        discount: order.discount,
        total: order.total,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        trackingNumber: order.trackingNumber,
        notes: order.notes,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        deliveredAt: order.deliveredAt,
        cancelledAt: order.cancelledAt,
      },
    });
  } catch (error) {
    console.error("Get order by ID error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Update Order Status (Admin) ──────────────────────────────────────────────
// @route   PUT /api/orders/:id/status
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber } = req.body;

    const VALID_STATUSES = [
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
      "return-requested",
      "returned",
    ];
    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // ✅ Prevent re-cancelling an already cancelled order (would double-restore stock)
    if (order.orderStatus === "cancelled" && status === "cancelled") {
      return res
        .status(400)
        .json({ success: false, message: "Order is already cancelled" });
    }

    const previousStatus = order.orderStatus;
    order.orderStatus = status;

    if (trackingNumber) order.trackingNumber = trackingNumber;

    if (status === "delivered") {
      order.deliveredAt = new Date();
      order.paymentStatus = "paid";
    }

    if (status === "cancelled" && previousStatus !== "cancelled") {
      order.cancelledAt = new Date();
      order.paymentStatus = "failed";
      await restoreStock(order.items);
    }

    await order.save();

    // Send status update email
    try {
      const email = await getOrderEmail(order);
      if (email) {
        await sendEmail({
          to: email,
          subject: `Order Update — #${order.orderId}`,
          html: `
            <h2>Order Status Update</h2>
            <p>Your order <strong>#${order.orderId}</strong> status has been updated to: <strong>${status}</strong>.</p>
            ${trackingNumber ? `<p>Tracking Number: <strong>${trackingNumber}</strong></p>` : ""}
            <p>Thank you for shopping with Sole Style!</p>
          `,
        });
      }
    } catch (emailError) {
      console.error("Status update email failed:", emailError.message);
    }

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      order: {
        _id: order._id,
        orderId: order.orderId,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        trackingNumber: order.trackingNumber,
        deliveredAt: order.deliveredAt,
        cancelledAt: order.cancelledAt,
      },
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Guest Order Lookup ───────────────────────────────────────────────────────
// @route   POST /api/orders/lookup
export const guestOrderLookup = async (req, res) => {
  try {
    const { email, orderId } = req.body;

    if (!email || !orderId) {
      return res
        .status(400)
        .json({ success: false, message: "Email and Order ID are required" });
    }

    const order = await Order.findOne({
      guestEmail: email.toLowerCase(),
      orderId: orderId.trim(),
    }).populate("items.product", "name images");

    if (!order) {
      // ✅ Don't reveal whether order OR email doesn't exist
      return res
        .status(404)
        .json({ success: false, message: "No order found with these details" });
    }

    res.json({
      success: true,
      order: {
        _id: order._id,
        orderId: order.orderId,
        items: order.items.map((item) => ({
          name: item.name,
          image: item.image,
          variant: item.variant,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        })),
        subtotal: order.subtotal,
        tax: order.tax,
        shippingCost: order.shippingCost,
        discount: order.discount,
        total: order.total,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        shippingAddress: order.shippingAddress,
        trackingNumber: order.trackingNumber,
        createdAt: order.createdAt,
        deliveredAt: order.deliveredAt,
      },
    });
  } catch (error) {
    console.error("Guest order lookup error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Cancel Order (User) ──────────────────────────────────────────────────────
// @route   PUT /api/orders/:id/cancel
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // ✅ Authorization check
    if (!order.user || order.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to cancel this order",
        });
    }

    // ✅ Only pending orders can be cancelled by users
    if (order.orderStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled — it is currently "${order.orderStatus}". Please contact support.`,
      });
    }

    order.orderStatus = "cancelled";
    order.cancelledAt = new Date();
    order.paymentStatus = "failed";
    await order.save();

    await restoreStock(order.items);

    try {
      const email = await getOrderEmail(order);
      if (email) {
        await sendEmail({
          to: email,
          subject: `Order Cancelled — #${order.orderId}`,
          html: `
            <h2>Order Cancelled</h2>
            <p>Your order <strong>#${order.orderId}</strong> has been cancelled.</p>
            <p>If you didn't request this, please contact our support team immediately.</p>
          `,
        });
      }
    } catch (emailError) {
      console.error("Cancellation email failed:", emailError.message);
    }

    res.json({
      success: true,
      message: "Order cancelled successfully",
      order: {
        _id: order._id,
        orderId: order.orderId,
        orderStatus: order.orderStatus,
        cancelledAt: order.cancelledAt,
      },
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Order Invoice ────────────────────────────────────────────────────────
// @route   GET /api/orders/:id/invoice
// ✅ FIX #2: New invoice generation endpoint
export const getOrderInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("items.product", "name images slug");

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Authorization: logged-in owner OR guest with matching email OR admin
    const isOwner =
      order.user &&
      req.user &&
      order.user._id.toString() === req.user._id.toString();
    const isGuestOwner =
      order.guestEmail &&
      req.query.email &&
      order.guestEmail.toLowerCase() === req.query.email.toLowerCase();
    const isAdmin = req.user?.role === "admin";

    if (!isOwner && !isGuestOwner && !isAdmin) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const invoiceUrl = await generateInvoice(order);

    res.json({ success: true, invoiceUrl });
  } catch (error) {
    console.error("Invoice generation error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
