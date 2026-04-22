import Banner from '../models/Banner.js';
import cloudinary from '../config/cloudinary.js';

// @desc    Get all active banners (public)
// @route   GET /api/banners
export const getBanners = async (req, res) => {
  try {
    const now = new Date();

    // ✅ FIX #2: Duplicate $or keys — merged into single $and with two $or conditions
    const banners = await Banner.find({
      isActive: true,
      $and: [
        {
          $or: [
            { startDate: { $exists: false } },
            { startDate: null },
            { startDate: { $lte: now } },
          ],
        },
        {
          $or: [
            { endDate: { $exists: false } },
            { endDate: null },
            { endDate: { $gte: now } },
          ],
        },
      ],
    }).sort('order');

    res.json({
      success: true,
      count: banners.length,
      banners,
    });
  } catch (error) {
    console.error('Get banners error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all banners (admin)
// @route   GET /api/banners/all
export const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort('-createdAt');
    res.json({
      success: true,
      count: banners.length,
      banners,
    });
  } catch (error) {
    console.error('Get all banners error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create banner (admin)
// @route   POST /api/banners
export const createBanner = async (req, res) => {
  try {
    const { title, description, link, ctaText, order, startDate, endDate } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Banner image is required' });
    }

    const banner = new Banner({
      title,
      description,
      link,
      ctaText,
      order,
      startDate,
      endDate,
      image: {
        url: req.file.path,
        publicId: req.file.filename,
      },
    });

    const created = await banner.save();

    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      banner: created,
    });
  } catch (error) {
    console.error('Create banner error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update banner (admin)
// @route   PUT /api/banners/:id
export const updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    if (req.body.title) banner.title = req.body.title;
    if (req.body.description !== undefined) banner.description = req.body.description;
    if (req.body.link !== undefined) banner.link = req.body.link;
    if (req.body.ctaText !== undefined) banner.ctaText = req.body.ctaText;
    if (req.body.order !== undefined) banner.order = req.body.order;
    if (req.body.isActive !== undefined) banner.isActive = req.body.isActive;
    if (req.body.startDate !== undefined) banner.startDate = req.body.startDate;
    if (req.body.endDate !== undefined) banner.endDate = req.body.endDate;

    if (req.file) {
      if (banner.image?.publicId) {
        await cloudinary.uploader.destroy(banner.image.publicId);
      }
      banner.image = {
        url: req.file.path,
        publicId: req.file.filename,
      };
    }

    const updated = await banner.save();

    res.json({
      success: true,
      message: 'Banner updated successfully',
      banner: updated,
    });
  } catch (error) {
    console.error('Update banner error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete banner (admin)
// @route   DELETE /api/banners/:id
export const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    if (banner.image?.publicId) {
      await cloudinary.uploader.destroy(banner.image.publicId);
    }

    await banner.deleteOne();

    res.json({
      success: true,
      message: 'Banner removed successfully',
    });
  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload banner image separately (admin)
// @route   POST /api/banners/:id/image
export const uploadBannerImage = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    if (banner.image?.publicId) {
      await cloudinary.uploader.destroy(banner.image.publicId);
    }

    banner.image = {
      url: req.file.path,
      publicId: req.file.filename,
    };

    await banner.save();

    res.json({
      success: true,
      message: 'Banner image uploaded successfully',
      image: banner.image,
      banner,
    });
  } catch (error) {
    console.error('Upload banner image error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};