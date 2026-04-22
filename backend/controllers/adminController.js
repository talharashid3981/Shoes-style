// =====================================================================
// controllers/adminController.js — FIXED (no logic changes needed,
// code was already solid. Improvements: consistent response shape,
// proper year validation)
// =====================================================================
import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Subscriber from '../models/Subscriber.js';

// @route   GET /api/admin/stats
export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalOrders, todayOrders, weekOrders, monthOrders,
      totalRevenueResult, todayRevenueResult, weekRevenueResult, monthRevenueResult,
      totalUsers, newUsersToday, totalProducts, subscribersCount,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startOfToday } }),
      Order.countDocuments({ createdAt: { $gte: startOfWeek } }),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.aggregate([{ $match: { createdAt: { $gte: startOfToday } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.aggregate([{ $match: { createdAt: { $gte: startOfWeek } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.aggregate([{ $match: { createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: startOfToday } }),
      Product.countDocuments(),
      Subscriber.countDocuments({ isActive: true }),
    ]);

    const lowStockResult = await Product.aggregate([
      { $match: { $expr: { $lte: ['$totalStock', { $ifNull: ['$lowStockThreshold', 5] }] } } },
      { $count: 'count' },
    ]);
    const lowStockProducts = lowStockResult[0]?.count || 0;

    res.json({
      success: true,
      data: {
        orders: {
          total: totalOrders,
          today: todayOrders,
          week: weekOrders,
          month: monthOrders,
        },
        revenue: {
          total: totalRevenueResult[0]?.total || 0,
          today: todayRevenueResult[0]?.total || 0,
          week: weekRevenueResult[0]?.total || 0,
          month: monthRevenueResult[0]?.total || 0,
        },
        users: { total: totalUsers, newToday: newUsersToday },
        products: { total: totalProducts, lowStock: lowStockProducts },
        subscribers: subscribersCount,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/admin/recent-orders
export const getRecentOrders = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort('-createdAt')
      .limit(limit)
      .select('orderId total orderStatus createdAt user guestEmail paymentMethod');

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/admin/top-products
export const getTopProducts = async (req, res) => {
  try {
    const products = await Product.find({ soldCount: { $gt: 0 } })
      .sort('-soldCount')
      .limit(10)
      .select('name price images soldCount totalStock slug label');

    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/admin/low-stock
export const getLowStock = async (req, res) => {
  try {
    const lowStockProducts = await Product.aggregate([
      {
        $match: {
          $expr: { $lte: ['$totalStock', { $ifNull: ['$lowStockThreshold', 5] }] },
        },
      },
      {
        $project: {
          name: 1, sku: 1, totalStock: 1,
          lowStockThreshold: { $ifNull: ['$lowStockThreshold', 5] },
          price: 1,
          image: { $arrayElemAt: ['$images.url', 0] },
        },
      },
      { $sort: { totalStock: 1 } },
      { $limit: 50 },
    ]);

    res.json({ success: true, count: lowStockProducts.length, data: lowStockProducts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/admin/sales-overview
export const getSalesOverview = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const year = Number(req.query.year) || currentYear;

    // ✅ Validate year to prevent query injection
    if (year < 2000 || year > currentYear + 1) {
      return res.status(400).json({ success: false, message: 'Invalid year' });
    }

    const monthlySales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) },
          orderStatus: { $ne: 'cancelled' },
        },
      },
      { $group: { _id: { $month: '$createdAt' }, orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
      { $sort: { _id: 1 } },
    ]);

    const salesData = Array.from({ length: 12 }, (_, i) => {
      const data = monthlySales.find((d) => d._id === i + 1) || { orders: 0, revenue: 0 };
      return { month: i + 1, orders: data.orders, revenue: data.revenue };
    });

    res.json({ success: true, year, data: salesData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};