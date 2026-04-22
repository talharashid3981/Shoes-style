import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import passport from 'passport';
import helmet from 'helmet';
import connectDB from './config/db.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

// Import passport config
import './config/passport.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import collectionRoutes from './routes/collectionRoutes.js';
import bannerRoutes from './routes/bannerRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import checkoutRoutes from './routes/checkoutRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import recentlyViewedRoutes from './routes/recentlyViewedRoutes.js';
import newsletterRoutes from './routes/newsletterRoutes.js';
import subscriberRoutes from './routes/subscriberRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Import cron job controllers (don't auto-start here, we control in production check)
import { startAbandonedCartJob, startCleanupJob } from './utils/abandonedCartJob.js';

connectDB();

const app = express();

// Security headers
app.use(helmet());

// CORS
const allowedOrigins = process.env.FRONTEND_URL 
  ? [process.env.FRONTEND_URL] 
  : ['http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.log(`CORS blocked: ${origin} - allowing anyway for dev`);
      callback(null, true); // Allow for development
    },
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Passport
app.use(passport.initialize());

// Test endpoints
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Backend is working!' });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', env: process.env.NODE_ENV });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/recently-viewed', recentlyViewedRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/admin', adminRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);

  // ✅ Start cron jobs after server is ready
  if (process.env.NODE_ENV === 'production') {
    startAbandonedCartJob();
    startCleanupJob();
  } else {
    // In development, start but log that they can be disabled
    console.log('🕐 Cron jobs can be started manually with startAbandonedCartJob() and startCleanupJob()');
    startAbandonedCartJob();
    startCleanupJob();
  }
});