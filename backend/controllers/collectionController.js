import Collection from '../models/Collection.js';
import slugify from 'slugify';
import cloudinary from '../config/cloudinary.js';
import mongoose from 'mongoose';

const generateSlug = (name) => slugify(name, { lower: true, strict: true });

// ✅ FIX: Safe query — prevents CastError when param is a slug string
const buildIdOrSlugQuery = (param) =>
  mongoose.Types.ObjectId.isValid(param)
    ? { $or: [{ _id: param }, { slug: param }] }
    : { slug: param };

// @route   GET /api/collections
export const getCollections = async (req, res) => {
  try {
    const now = new Date();
    // ✅ Only return active, in-date-range collections
    const collections = await Collection.find({
      isActive: true,
      $and: [
        { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
      ],
    }).sort('order');
    res.json({ success: true, count: collections.length, data: collections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/collections/:id
export const getCollectionById = async (req, res) => {
  try {
    // ✅ FIX: Safe slug/ID query
    const collection = await Collection.findOne(buildIdOrSlugQuery(req.params.id))
      .populate('products', 'name price images slug');

    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }
    res.json({ success: true, data: collection });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/collections
export const createCollection = async (req, res) => {
  try {
    const { name, description, banner, startDate, endDate, order } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

    const slug = generateSlug(name);
    const existing = await Collection.findOne({ slug });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Collection with this name already exists' });
    }

    const collection = new Collection({ name, slug, description, banner, startDate, endDate, order });
    const created = await collection.save();
    res.status(201).json({ success: true, message: 'Collection created', data: created });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   PUT /api/collections/:id
export const updateCollection = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) return res.status(404).json({ success: false, message: 'Collection not found' });

    if (req.body.name && req.body.name !== collection.name) {
      const newSlug = generateSlug(req.body.name);
      const existing = await Collection.findOne({ slug: newSlug, _id: { $ne: collection._id } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Collection with this name already exists' });
      }
      collection.name = req.body.name;
      collection.slug = newSlug;
    }

    collection.description = req.body.description ?? collection.description;
    collection.banner = req.body.banner ?? collection.banner;
    collection.startDate = req.body.startDate ?? collection.startDate;
    collection.endDate = req.body.endDate ?? collection.endDate;
    collection.isActive = req.body.isActive ?? collection.isActive;
    collection.order = req.body.order ?? collection.order;
    if (req.body.products) collection.products = req.body.products;

    const updated = await collection.save();
    res.json({ success: true, message: 'Collection updated', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   DELETE /api/collections/:id
export const deleteCollection = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) return res.status(404).json({ success: false, message: 'Collection not found' });

    if (collection.banner?.publicId) {
      await cloudinary.uploader.destroy(collection.banner.publicId);
    }
    await collection.deleteOne();
    res.json({ success: true, message: 'Collection removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/collections/:id/banner
export const uploadCollectionBanner = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) return res.status(404).json({ success: false, message: 'Collection not found' });
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    if (collection.banner?.publicId) {
      await cloudinary.uploader.destroy(collection.banner.publicId);
    }
    collection.banner = { url: req.file.path, publicId: req.file.filename };
    await collection.save();
    res.json({ success: true, message: 'Banner uploaded', data: collection });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};