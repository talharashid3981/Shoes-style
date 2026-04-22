import express from 'express';
import {
  subscribe,
  verifySubscription,
  unsubscribe,
  getCampaigns,
  createCampaign,
  sendCampaign,
} from '../controllers/newsletterController.js';
import  protect from "../middleware/auth.js"
import admin  from '../middleware/admin.js';

const router = express.Router();

// Public
router.post('/subscribe', subscribe);
router.get('/verify/:token', verifySubscription);
router.post('/unsubscribe', unsubscribe);

// Admin campaigns
router.get('/campaigns', protect, admin, getCampaigns);
router.post('/campaigns', protect, admin, createCampaign);
router.post('/campaigns/:id/send', protect, admin, sendCampaign);

export default router;