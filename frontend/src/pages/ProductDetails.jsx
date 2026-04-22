import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Minus, Plus, Heart, Share2, Truck, Shield, RotateCcw, Check } from 'lucide-react';
import useProducts from '../hooks/useProducts';
import useCart from '../hooks/useCart';
import useWishlist from '../hooks/useWishlist';
import { getProductReviewsAPI } from '../services/reviewService';
import Toast from '../utils/Toast';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentProduct, relatedProducts, isLoading, fetchProductById, fetchRelatedProducts } = useProducts();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist, fetchWishlist } = useWishlist();
  
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [addingToCart, setAddingToCart] = useState(false);
  const [wishlistStatus, setWishlistStatus] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProductById(id);
      fetchRelatedProducts(id);
      fetchProductReviews(id);
      fetchWishlist();
    }
  }, [id]);

  useEffect(() => {
    if (currentProduct && currentProduct.variants?.length > 0) {
      setSelectedColor(currentProduct.variants[0].color);
      if (currentProduct.variants[0].sizes?.length > 0) {
        setSelectedSize(currentProduct.variants[0].sizes[0].size);
      }
    }
    if (currentProduct && currentProduct._id) {
      setWishlistStatus(isInWishlist(currentProduct._id));
    }
  }, [currentProduct]);

  const fetchProductReviews = async (productId) => {
    setReviewLoading(true);
    try {
      const response = await getProductReviewsAPI(productId);
      if (response.success) {
        setReviews(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedColor || !selectedSize) {
      Toast('Please select color and size', 'warning');
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(currentProduct._id, { color: selectedColor, size: selectedSize }, quantity);
      Toast('Added to cart successfully!', 'success');
    } catch (error) {
      Toast(error.message || 'Failed to add to cart', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlistToggle = async () => {
    try {
      if (wishlistStatus) {
        await removeFromWishlist(currentProduct._id);
        Toast('Removed from wishlist', 'info');
      } else {
        await addToWishlist(currentProduct._id);
        Toast('Added to wishlist', 'success');
      }
      setWishlistStatus(!wishlistStatus);
    } catch (error) {
      Toast(error.message || 'Failed to update wishlist', 'error');
    }
  };

  const getSelectedVariantStock = () => {
    const variant = currentProduct?.variants?.find(v => v.color === selectedColor);
    const size = variant?.sizes?.find(s => s.size === selectedSize);
    return size?.stock || 0;
  };

  const stock = getSelectedVariantStock();

  if (isLoading || !currentProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Product Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images Gallery */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-xl bg-gray-100">
              <img
                src={currentProduct.images?.[selectedImage]?.url || 'https://via.placeholder.com/600'}
                alt={currentProduct.name}
                className="w-full h-full object-cover"
              />
            </div>
            {currentProduct.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {currentProduct.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      selectedImage === idx ? 'border-gray-900' : 'border-transparent'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            {currentProduct.label && (
              <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full mb-4 ${
                currentProduct.label === 'Sale' ? 'bg-red-500 text-white' :
                currentProduct.label === 'New' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
              }`}>
                {currentProduct.label}
              </span>
            )}
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{currentProduct.name}</h1>
            
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.round(currentProduct.rating || 0)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-gray-600">({currentProduct.numReviews || 0} reviews)</span>
            </div>

            <div className="mb-6">
              <span className="text-3xl font-bold text-gray-900">₹{currentProduct.price}</span>
              {currentProduct.compareAtPrice && (
                <span className="ml-2 text-lg text-gray-500 line-through">₹{currentProduct.compareAtPrice}</span>
              )}
            </div>

            <p className="text-gray-600 mb-6">{currentProduct.description}</p>

            {/* Color Selection */}
            {currentProduct.variants?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-2">Color: {selectedColor}</h3>
                <div className="flex gap-2">
                  {currentProduct.variants.map((variant) => (
                    <button
                      key={variant.color}
                      onClick={() => {
                        setSelectedColor(variant.color);
                        if (variant.sizes?.length > 0) {
                          setSelectedSize(variant.sizes[0].size);
                        }
                      }}
                      className={`px-4 py-2 border rounded-lg transition ${
                        selectedColor === variant.color
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {variant.color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {currentProduct.variants && (
              <div className="mb-6">
                <h3 className="font-medium mb-2">Size: {selectedSize}</h3>
                <div className="flex flex-wrap gap-2">
                  {currentProduct.variants
                    .find(v => v.color === selectedColor)
                    ?.sizes.map((size) => (
                      <button
                        key={size.size}
                        onClick={() => setSelectedSize(size.size)}
                        disabled={size.stock === 0}
                        className={`px-4 py-2 border rounded-lg transition ${
                          selectedSize === size.size
                            ? 'border-gray-900 bg-gray-900 text-white'
                            : size.stock === 0
                            ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {size.size}
                        {size.stock === 0 && ' (Sold Out)'}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">Quantity</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-medium w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                  disabled={quantity >= stock}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-500">{stock} available</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || stock === 0}
                className="flex-1 btn-primary py-3 text-center disabled:opacity-50"
              >
                {addingToCart ? 'Adding...' : stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                onClick={handleWishlistToggle}
                className="p-3 border border-gray-300 rounded-lg hover:border-gray-400 transition"
              >
                <Heart className={`w-5 h-5 ${wishlistStatus ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
              <button className="p-3 border border-gray-300 rounded-lg hover:border-gray-400 transition">
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Features */}
            <div className="border-t border-gray-200 pt-6 grid grid-cols-3 gap-4">
              <div className="text-center">
                <Truck className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                <p className="text-sm">Free Shipping<br />on ₹500+</p>
              </div>
              <div className="text-center">
                <Shield className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                <p className="text-sm">Secure<br />Payment</p>
              </div>
              <div className="text-center">
                <RotateCcw className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                <p className="text-sm">30-Day<br />Returns</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-12">
          <div className="border-b border-gray-200">
            <div className="flex gap-8">
              {['description', 'reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 text-lg font-medium capitalize transition ${
                    activeTab === tab
                      ? 'border-b-2 border-gray-900 text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="py-8">
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                <p>{currentProduct.description}</p>
                {currentProduct.tags?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Tags:</h4>
                    <div className="flex gap-2">
                      {currentProduct.tags.map((tag) => (
                        <span key={tag} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                {reviewLoading ? (
                  <div className="text-center py-8">Loading reviews...</div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No reviews yet. Be the first to review!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <ReviewCard key={review._id} review={review} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((product) => (
                <RelatedProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ReviewCard = ({ review }) => {
  return (
    <div className="border-b border-gray-200 pb-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
          <span className="text-lg font-semibold">
            {review.user?.name?.charAt(0) || 'U'}
          </span>
        </div>
        <div>
          <p className="font-medium">{review.user?.name}</p>
          <div className="flex items-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">
              {new Date(review.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
      {review.title && <h4 className="font-medium mb-1">{review.title}</h4>}
      <p className="text-gray-600">{review.comment}</p>
      {review.isVerifiedPurchase && (
        <div className="mt-2 flex items-center gap-1 text-green-600 text-sm">
          <Check className="w-4 h-4" />
          <span>Verified Purchase</span>
        </div>
      )}
    </div>
  );
};

const RelatedProductCard = ({ product }) => {
  const navigate = useNavigate();
  const image = product.images?.[0]?.url || 'https://via.placeholder.com/300';

  return (
    <div
      onClick={() => navigate(`/products/${product.slug || product._id}`)}
      className="cursor-pointer group"
    >
      <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition">
        <div className="aspect-square overflow-hidden">
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        </div>
        <div className="p-4">
          <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
          <div className="mt-2">
            <span className="text-lg font-semibold text-gray-900">₹{product.price}</span>
          </div>
          <div className="mt-2 flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.round(product.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;