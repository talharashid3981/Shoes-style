import Subscriber from '../models/Subscriber.js';

// @desc    Get all subscribers (admin)
// @route   GET /api/subscribers
export const getSubscribers = async (req, res) => {
  try {
    const subscribers = await Subscriber.find({}).sort('-createdAt');
    res.json(subscribers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Export subscribers (admin) - streams large datasets
// @route GET /api/subscribers/export
export const exportSubscribers = async (req, res) => {
  try {
    // ✅ FIX: Stream CSV generation to prevent memory issues with large datasets
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=subscribers.csv');

    // Write CSV header
    res.write('Email,Name,SubscribedAt\n');

    // Use cursor for memory-efficient iteration
    const cursor = Subscriber.find({ isActive: true }).cursor();

    for await (const subscriber of cursor) {
      // Escape quotes in names to prevent CSV injection
      const name = (subscriber.name || '').replace(/"/g, '""');
      const subscribedAt = subscriber.subscribedAt ? subscriber.subscribedAt.toISOString() : '';
      const row = `"${subscriber.email}","${name}","${subscribedAt}"\n`;
      res.write(row);
    }

    res.end();
  } catch (error) {
    // If headers already sent, we can't send JSON error
    if (res.headersSent) {
      console.error('Export error:', error);
      res.end();
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Delete subscriber (admin)
// @route   DELETE /api/subscribers/:id
export const deleteSubscriber = async (req, res) => {
  try {
    const sub = await Subscriber.findById(req.params.id);
    if (sub) {
      await sub.deleteOne();
      res.json({ message: 'Subscriber removed' });
    } else {
      res.status(404).json({ message: 'Subscriber not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};