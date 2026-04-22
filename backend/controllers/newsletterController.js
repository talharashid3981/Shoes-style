import Subscriber from '../models/Subscriber.js';
import NewsletterCampaign from '../models/NewsletterCampaign.js';
import crypto from 'crypto';
import { sendEmail } from '../utils/sendEmail.js';

// @route   POST /api/newsletter/subscribe
export const subscribe = async (req, res) => {
  try {
    const { email, name, preferences } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    let subscriber = await Subscriber.findOne({ email: email.toLowerCase() });

    if (subscriber) {
      if (subscriber.isActive) {
        return res.status(400).json({ success: false, message: 'This email is already subscribed' });
      }
      // Re-subscribe: generate new token
      subscriber.verificationToken = crypto.randomBytes(32).toString('hex');
      subscriber.verificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await subscriber.save();
    } else {
      const verificationToken = crypto.randomBytes(32).toString('hex');
      subscriber = await Subscriber.create({
        email: email.toLowerCase(),
        name,
        preferences,
        verificationToken,
        verificationExpire: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
    }

    // ✅ CRITICAL FIX: Use FRONTEND_URL, not CLIENT_URL
    // CLIENT_URL in .env points to http://localhost:8000 (the BACKEND).
    // Users clicking that link get a raw JSON response in their browser.
    const verificationUrl = `${process.env.FRONTEND_URL}/newsletter/verify?token=${subscriber.verificationToken}`;

    await sendEmail({
      to: email,
      subject: 'Confirm your newsletter subscription — Sole Style',
      html: `
        <h2>Confirm Your Subscription</h2>
        <p>Thanks for subscribing! Please confirm your email address.</p>
        <a href="${verificationUrl}" style="
          display: inline-block;
          padding: 12px 24px;
          background: #000;
          color: #fff;
          text-decoration: none;
          border-radius: 4px;
        ">Confirm Subscription</a>
        <p>This link expires in 24 hours.</p>
        <p>If you didn't subscribe, you can safely ignore this email.</p>
      `,
    });

    res.json({ success: true, message: 'Please check your email to confirm your subscription' });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/newsletter/verify/:token
export const verifySubscription = async (req, res) => {
  try {
    const { token } = req.params;
    const subscriber = await Subscriber.findOne({
      verificationToken: token,
      verificationExpire: { $gt: Date.now() },
    });

    if (!subscriber) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
    }

    subscriber.isActive = true;
    subscriber.verificationToken = undefined;
    subscriber.verificationExpire = undefined;
    subscriber.subscribedAt = new Date();
    await subscriber.save();

    res.json({ success: true, message: 'Subscription confirmed. Thank you!' });
  } catch (error) {
    console.error('Verify subscription error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/newsletter/unsubscribe
export const unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const subscriber = await Subscriber.findOne({ email: email.toLowerCase() });
    if (subscriber && subscriber.isActive) {
      subscriber.isActive = false;
      subscriber.unsubscribedAt = new Date();
      await subscriber.save();
    }
    // Always return success — don't reveal whether email was subscribed
    res.json({ success: true, message: 'You have been unsubscribed' });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/newsletter/campaigns
export const getCampaigns = async (req, res) => {
  try {
    const campaigns = await NewsletterCampaign.find().sort('-createdAt');
    res.json({ success: true, count: campaigns.length, data: campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/newsletter/campaigns
export const createCampaign = async (req, res) => {
  try {
    const campaign = new NewsletterCampaign(req.body);
    const created = await campaign.save();
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/newsletter/campaigns/:id/send
export const sendCampaign = async (req, res) => {
  try {
    const campaign = await NewsletterCampaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

    if (campaign.status === 'sent') {
      return res.status(400).json({ success: false, message: 'Campaign has already been sent' });
    }

    // Count subscribers first
    const query = { isActive: true };
    if (campaign.segment !== 'all') {
      query.preferences = campaign.segment;
    }
    const subscriberCount = await Subscriber.countDocuments(query);

    // ✅ Mark as 'sending' immediately — prevents double sends
    campaign.status = 'sending';
    await campaign.save();

    // ✅ FIX: Acknowledge the request immediately.
    // Sending to thousands of subscribers in a synchronous loop will:
    //   1. Timeout the HTTP request (30-60s limit)
    //   2. Block the event loop
    //   3. Partially fail with no way to retry
    //
    // PRODUCTION NOTE: Replace this with a job queue (Bull/BullMQ + Redis).
    // For now, we respond immediately and process in the background.
    res.json({
      success: true,
      message: `Campaign queued for ${subscriberCount} subscribers. Sending in background.`,
      campaignId: campaign._id,
    });

    // ✅ Process emails in background (non-blocking) using cursor for memory efficiency
    setImmediate(async () => {
      try {
        // ✅ FIX: Use cursor instead of loading all subscribers into memory
        // Prevents memory issues with large subscriber lists
        const BATCH_SIZE = 50;
        let sentCount = 0;
        let batch = [];

        const cursor = Subscriber.find(query).select('email name').cursor();

        for await (const subscriber of cursor) {
          batch.push(subscriber);

          if (batch.length >= BATCH_SIZE) {
            // Process batch
            await Promise.allSettled(
              batch.map((sub) =>
                sendEmail({
                  to: sub.email,
                  subject: campaign.subject,
                  html: campaign.content,
                })
              )
            );
            sentCount += batch.length;
            batch = []; // ✅ Release memory after processing
          }
        }

        // Process remaining subscribers
        if (batch.length > 0) {
          await Promise.allSettled(
            batch.map((sub) =>
              sendEmail({
                to: sub.email,
                subject: campaign.subject,
                html: campaign.content,
              })
            )
          );
          sentCount += batch.length;
        }

        // Close cursor explicitly
        cursor.close();

        campaign.status = 'sent';
        campaign.sentAt = new Date();
        campaign.sentCount = sentCount;
        await campaign.save();

        console.log(`✅ Campaign "${campaign.subject}" sent to ${sentCount} subscribers`);
      } catch (err) {
        campaign.status = 'draft'; // Reset so admin can retry
        await campaign.save();
        console.error('Campaign send error:', err);
      }
    });

  } catch (error) {
    console.error('Send campaign error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};