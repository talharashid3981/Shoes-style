// =====================================================================
// categoryController.js — FIXED
// =====================================================================
import Category from '../models/Category.js';
import slugify from 'slugify';
import cloudinary from '../config/cloudinary.js';
import mongoose from 'mongoose';

const generateSlug = (name) => slugify(name, { lower: true, strict: true });

// ✅ FIX: Safe query — prevents CastError 500 when param is a slug string
const buildIdOrSlugQuery = (param) =>
  mongoose.Types.ObjectId.isValid(param)
    ? { $or: [{ _id: param }, { slug: param }] }
    : { slug: param };

// @route   GET /api/categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate('parent', 'name slug')
      .sort('order');
    res.json({ success: true, count: categories.length, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/categories/:id
export const getCategoryById = async (req, res) => {
  try {
    // ✅ FIX: Was crashing with CastError when param was a slug string
    const category = await Category.findOne(buildIdOrSlugQuery(req.params.id))
      .populate('parent', 'name slug');

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/categories
export const createCategory = async (req, res) => {
  try {
    const { name, parent, description, order, image } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

    const slug = generateSlug(name);
    const existing = await Category.findOne({ slug });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category with this name already exists' });
    }

    const category = new Category({ name, slug, parent, description, order, image });
    const created = await category.save();
    res.status(201).json({ success: true, category: created });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   PUT /api/categories/:id
export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    if (req.body.name && req.body.name !== category.name) {
      const newSlug = generateSlug(req.body.name);
      const existing = await Category.findOne({ slug: newSlug, _id: { $ne: category._id } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Category with this name already exists' });
      }
      category.name = req.body.name;
      category.slug = newSlug;
    }

    category.parent = req.body.parent ?? category.parent;
    category.description = req.body.description ?? category.description;
    category.isActive = req.body.isActive ?? category.isActive;
    category.order = req.body.order ?? category.order;
    if (req.body.image) category.image = req.body.image;

    const updated = await category.save();
    res.json({ success: true, category: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   DELETE /api/categories/:id
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    if (category.image?.publicId) {
      await cloudinary.uploader.destroy(category.image.publicId);
    }
    await category.deleteOne();
    res.json({ success: true, message: 'Category removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/categories/:id/image
export const uploadCategoryImage = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    if (category.image?.publicId) {
      await cloudinary.uploader.destroy(category.image.publicId);
    }
    category.image = { url: req.file.path, publicId: req.file.filename };
    await category.save();
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};