import cron from 'node-cron';
import Cart from '../models/Cart.js';
import User from '../models/User.js';
import Wishlist from '../models/Wishlist.js';
import RecentlyViewed from '../models/RecentlyViewed.js';
import { sendEmail } from './sendEmail.js';

/**
 * Abandoned Cart Reminder Job
 *
 * Runs every hour. Finds carts that:
 * 1. Have at least one item
 * 2. Haven't been updated in 30+ minutes
 * 3. Have NOT already received a reminder in the last 24 hours
 *
 * ✅ FIX: reminderSentAt is now properly defined in Cart schema.
 * Previously, Mongoose silently discarded this field (strict mode),
 * causing every cron run to re-send emails to the same users.
 */

// ✅ Store cron task reference for cleanup
let abandonedCartTask = null;

/**
 * Start the abandoned cart reminder job
 * @returns {Object} Cron task instance
 */
export const startAbandonedCartJob = () => {
  if (abandonedCartTask) {
    console.log('⚠️ Abandoned cart job already running');
    return abandonedCartTask;
  }

  abandonedCartTask = cron.schedule('0 * * * *', async () => {
  console.log('🕐 Running abandoned cart reminder job...');

  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // ✅ Only target carts that:
    // - Have items
    // - Have not been updated in 30+ minutes (user walked away)
    // - Have not had a reminder sent in the last 24 hours
    const abandonedCarts = await Cart.find({
      'items.0': { $exists: true },
      updatedAt: { $lte: thirtyMinutesAgo },
      $or: [
        { reminderSentAt: { $exists: false } },
        { reminderSentAt: null },
        { reminderSentAt: { $lte: oneDayAgo } },
      ],
    })
      .populate('user', 'name email')
      .populate('items.product', 'name price images');

    console.log(`📦 Found ${abandonedCarts.length} abandoned cart(s) to process`);

    for (const cart of abandonedCarts) {
      try {
        // ✅ Only process carts belonging to registered users (guests have no reliable email)
        if (!cart.user?.email) continue;

        const itemSummary = cart.items
          .filter((item) => item.product)
          .slice(0, 3) // Show max 3 items in email
          .map(
            (item) =>
              `<li>${item.product.name} (${item.variant?.color} / ${item.variant?.size}) × ${item.quantity} — ₹${item.price * item.quantity}</li>`
          )
          .join('');

        const cartUrl = `${process.env.FRONTEND_URL}/cart`;

        await sendEmail({
          to: cart.user.email,
          subject: 'You left something behind 👟',
          html: `
            <h2>Hi ${cart.user.name || 'there'},</h2>
            <p>You left some items in your cart. Don't let them get away!</p>
            <ul>${itemSummary}</ul>
            ${cart.items.length > 3 ? `<p>...and ${cart.items.length - 3} more item(s)</p>` : ''}
            <p><strong>Cart Total: ₹${cart.totalPrice.toFixed(2)}</strong></p>
            <a href="${cartUrl}" style="
              display: inline-block;
              padding: 12px 24px;
              background: #000;
              color: #fff;
              text-decoration: none;
              border-radius: 4px;
              margin-top: 16px;
            ">Complete My Order</a>
            <p style="margin-top:24px; color:#999; font-size:12px;">
              You're receiving this because you have an account with Sole Style.
            </p>
          `,
        });

        // ✅ Mark as reminded so we don't re-send next hour
        // This now works correctly because reminderSentAt is in the Cart schema
        cart.reminderSentAt = new Date();
        await cart.save();

        console.log(`✅ Reminder sent to ${cart.user.email}`);
      } catch (cartError) {
        // Don't let one failure abort the rest of the batch
        console.error(`❌ Failed to process cart ${cart._id}:`, cartError.message);
      }
    }

    console.log('✅ Abandoned cart job complete');
  } catch (error) {
    console.error('❌ Abandoned cart cron job failed:', error);
  }
  });

  console.log('🕐 Abandoned cart job scheduled');
  return abandonedCartTask;
};

/**
 * Stop the abandoned cart reminder job
 */
export const stopAbandonedCartJob = () => {
  if (abandonedCartTask) {
    abandonedCartTask.stop();
    abandonedCartTask = null;
    console.log('🛑 Abandoned cart job stopped');
  }
};

// ✅ Guest data cleanup job - runs daily at midnight
let cleanupTask = null;

export const startCleanupJob = () => {
  if (cleanupTask) {
    console.log('⚠️ Cleanup job already running');
    return cleanupTask;
  }

  cleanupTask = cron.schedule('0 0 * * *', async () => {
    console.log('🧹 Running guest data cleanup...');

    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Cleanup orphaned carts
      const cartResult = await Cart.deleteMany({
        user: { $exists: false },
        updatedAt: { $lt: thirtyDaysAgo }
      });

      // Cleanup orphaned wishlists
      const wishlistResult = await Wishlist.deleteMany({
        user: { $exists: false },
        updatedAt: { $lt: thirtyDaysAgo }
      });

      // Cleanup orphaned recently viewed
      const rvResult = await RecentlyViewed.deleteMany({
        user: { $exists: false },
        updatedAt: { $lt: thirtyDaysAgo }
      });

      const totalCleaned = cartResult.deletedCount + wishlistResult.deletedCount + rvResult.deletedCount;
      console.log(`✅ Cleanup complete: ${totalCleaned} orphaned documents removed`);
    } catch (error) {
      console.error('❌ Guest data cleanup failed:', error);
    }
  });

  console.log('🧹 Guest data cleanup job scheduled (daily at midnight)');
  return cleanupTask;
};

export const stopCleanupJob = () => {
  if (cleanupTask) {
    cleanupTask.stop();
    cleanupTask = null;
    console.log('🛑 Cleanup job stopped');
  }
};

// ✅ Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('SIGTERM received, stopping cron jobs...');
  stopAbandonedCartJob();
  stopCleanupJob();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, stopping cron jobs...');
  stopAbandonedCartJob();
  stopCleanupJob();
  process.exit(0);
});

// Jobs are started from index.js to avoid duplicate auto-start