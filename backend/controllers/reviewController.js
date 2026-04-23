import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

const recalculateProductRating = async (productId) => {
  const product = await Product.findById(productId);
  if (!product) return;

  const approvedReviews = await Review.find({ product: productId, status: 'approved' });
  const numReviews = approvedReviews.length;
  const avgRating =
    numReviews > 0
      ? approvedReviews.reduce((acc, r) => acc + r.rating, 0) / numReviews
      : 0;

  product.rating = Math.round(avgRating * 10) / 10;
  product.numReviews = numReviews;
  await product.save();
};

const resolveProductId = async (productParam) => {
  if (!productParam) return null;

  if (mongoose.Types.ObjectId.isValid(productParam)) {
    const byId = await Product.findById(productParam).select('_id');
    if (byId) return byId._id;
  }

  const bySlug = await Product.findOne({ slug: productParam }).select('_id');
  return bySlug?._id || null;
};

// @desc    Create product review
// @route   POST /api/reviews
export const createReview = async (req, res) => {
  try {
    const { product, rating, title, comment, images } = req.body;

    const productId = await resolveProductId(product);
    if (!productId) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const existing = await Review.findOne({ user: req.user._id, product: productId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
    }

    const order = await Order.findOne({
      user: req.user._id,
      'items.product': productId,
      orderStatus: 'delivered',
    });

    const review = new Review({
      user: req.user._id,
      product: productId,
      rating,
      title,
      comment,
      images,
      isVerifiedPurchase: !!order,
    });

    const created = await review.save();
    await recalculateProductRating(productId);

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get reviews for a product (public)
// @route   GET /api/reviews/product/:productId
export const getProductReviews = async (req, res) => {
  try {
    const productId = await resolveProductId(req.params.productId);
    if (!productId) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const reviews = await Review.find({
      product: productId,
      status: 'approved',
    })
      .populate('user', 'name avatar')
      .sort('-createdAt');

    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user's review for product
// @route   GET /api/reviews/product/:productId/my-review
export const getMyProductReview = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.json({ success: true, data: null });
    }

    const productId = await resolveProductId(req.params.productId);
    if (!productId) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const review = await Review.findOne({
      user: req.user._id,
      product: productId,
    }).sort('-createdAt');

    res.json({ success: true, data: review || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all reviews (admin)
// @route   GET /api/reviews
export const getAllReviews = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const reviews = await Review.find(filter)
      .populate('user', 'name email')
      .populate('product', 'name')
      .sort('-createdAt');

    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update review status (admin)
// @route   PUT /api/reviews/:id/status
export const updateReviewStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    review.status = status;
    await review.save();

    if (status === 'approved' || status === 'rejected' || status === 'pending') {
      await recalculateProductRating(review.product);
    }

    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle featured review (admin)
// @route   PUT /api/reviews/:id/feature
export const toggleFeatured = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    review.isFeatured = !review.isFeatured;
    await review.save();

    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Vote helpful/unhelpful
// @route   POST /api/reviews/:id/vote
export const voteReview = async (req, res) => {
  try {
    const { vote } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const existingVote = review.votedBy.find(
      (v) => v.user.toString() === req.user._id.toString()
    );

    if (existingVote) {
      if (existingVote.vote === 'helpful') review.helpfulVotes -= 1;
      else review.unhelpfulVotes -= 1;
      review.votedBy = review.votedBy.filter(
        (v) => v.user.toString() !== req.user._id.toString()
      );
    }

    if (vote === 'helpful') review.helpfulVotes += 1;
    else if (vote === 'unhelpful') review.unhelpfulVotes += 1;

    review.votedBy.push({ user: req.user._id, vote });
    await review.save();

    res.json({
      success: true,
      data: { helpful: review.helpfulVotes, unhelpful: review.unhelpfulVotes },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload review images (user)
// @route   POST /api/reviews/upload-images
export const uploadReviewImages = async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const images = files.map((file) => ({
      url: file.path,
      publicId: file.filename,
    }));

    res.json({ success: true, data: images });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
