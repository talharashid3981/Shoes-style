import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, Star } from 'lucide-react';
import useWishlist from '../hooks/useWishlist';
import useCart from '../hooks/useCart';
import Toast from '../utils/Toast';

const Wishlist = () => {
  const { items, count, isLoading, fetchWishlist, removeFromWishlist, clearAllWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [addingToCart, setAddingToCart] = useState(null);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const resolveCartVariant = (item) => {
    if (item.variant?.color && item.variant?.size) {
      return item.variant;
    }
    const fallbackColor = item.product?.variants?.[0];
    const fallbackSize = fallbackColor?.sizes?.find((s) => s.stock > 0) || fallbackColor?.sizes?.[0];
    if (!fallbackColor?.color || !fallbackSize?.size) {
      return null;
    }
    return { color: fallbackColor.color, size: fallbackSize.size };
  };

  const handleMoveToCart = async (item) => {
    setAddingToCart(item._id);
    try {
      const variant = resolveCartVariant(item);
      if (!variant) {
        Toast('This product variant is unavailable for cart', 'warning');
        return;
      }
      await addToCart(item.product._id, variant, 1);
      await removeFromWishlist(item._id);
      Toast('Moved to cart successfully!', 'success');
    } catch (error) {
      Toast(error.message || 'Failed to move to cart', 'error');
    } finally {
      setAddingToCart(null);
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await removeFromWishlist(itemId);
      Toast('Removed from wishlist', 'success');
    } catch (error) {
      Toast(error.message || 'Failed to remove', 'error');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear your entire wishlist?')) return;
    try {
      await clearAllWishlist();
      Toast('Wishlist cleared', 'success');
    } catch (error) {
      Toast(error.message || 'Failed to clear wishlist', 'error');
    }
  };

  if (isLoading && items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <Heart className="mx-auto h-16 w-16 text-gray-400" />
            <h2 className="mt-4 text-2xl font-semibold text-gray-900">Your wishlist is empty</h2>
            <p className="mt-2 text-gray-500">Save your favorite items here.</p>
            <Link to="/products" className="btn-primary mt-6 inline-flex">
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Wishlist ({count || items.length} items)</h1>
          <button
            onClick={handleClearAll}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => {
            const product = item.product;
            if (!product) return null;
            
            const image = product.images?.[0]?.url || 'https://via.placeholder.com/400';
            const variantText = item.variant ? `${item.variant.color} / ${item.variant.size}` : 'Default';

            return (
              <div key={item._id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition group">
                <Link to={`/products/${product.slug || product._id}`} className="block">
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    {product.label && (
                      <span className={`absolute top-2 left-2 px-2 py-1 text-xs font-medium rounded ${
                        product.label === 'Sale' ? 'bg-red-500 text-white' :
                        product.label === 'New' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
                      }`}>
                        {product.label}
                      </span>
                    )}
                  </div>
                </Link>

                <div className="p-4">
                  <Link to={`/products/${product.slug || product._id}`}>
                    <h3 className="font-medium text-gray-900 truncate hover:underline">{product.name}</h3>
                  </Link>
                  <p className="text-xs text-gray-500 mt-1">{variantText}</p>
                  
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-lg font-semibold text-gray-900">Rs. {product.price}</span>
                    {product.compareAtPrice && (
                      <span className="text-sm text-gray-500 line-through">Rs. {product.compareAtPrice}</span>
                    )}
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
                    <span className="ml-1 text-xs text-gray-500">({product.numReviews || 0})</span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleMoveToCart(item)}
                      disabled={addingToCart === item._id}
                      className="flex-1 btn-primary py-2 text-sm text-center disabled:opacity-50"
                    >
                      {addingToCart === item._id ? 'Moving...' : 'Move to Cart'}
                    </button>
                    <button
                      onClick={() => handleRemove(item._id)}
                      className="p-2 border border-gray-300 rounded-lg hover:border-red-300 hover:text-red-500 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
