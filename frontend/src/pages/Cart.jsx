import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, X } from 'lucide-react';
import useCart from '../hooks/useCart';
import Toast from '../utils/Toast';

const Cart = () => {
  const { items, totalPrice, totalItems, coupon, discount, isLoading, fetchCart, updateQuantity, removeItem, applyCoupon, removeCoupon } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const handleUpdateQuantity = async (itemId, currentQty, change) => {
    const newQty = currentQty + change;
    if (newQty < 1) return;
    try {
      await updateQuantity(itemId, newQty);
    } catch (error) {
      Toast(error.message, 'error');
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await removeItem(itemId);
      Toast('Item removed from cart', 'success');
    } catch (error) {
      Toast(error.message, 'error');
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      Toast('Please enter a coupon code', 'warning');
      return;
    }
    setApplyingCoupon(true);
    try {
      const response = await applyCoupon(couponCode);
      Toast(response.message || 'Coupon applied successfully!', 'success');
      setCouponCode('');
    } catch (error) {
      Toast(error.message, 'error');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await removeCoupon();
      Toast('Coupon removed', 'success');
    } catch (error) {
      Toast(error.message, 'error');
    }
  };

  const subtotal = totalPrice;
  const shipping = subtotal > 500 ? 0 : 50;
  const tax = (subtotal - discount) * 0.18;
  const finalTotal = subtotal + shipping + tax - discount;

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
            <ShoppingBag className="mx-auto h-16 w-16 text-gray-400" />
            <h2 className="mt-4 text-2xl font-semibold text-gray-900">Your cart is empty</h2>
            <p className="mt-2 text-gray-500">Looks like you haven't added any items yet.</p>
            <Link to="/products" className="btn-primary mt-6 inline-flex">
              Continue Shopping
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart ({totalItems} items)</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item._id} className="bg-white rounded-lg shadow-sm p-4 flex gap-4">
                {/* Product Image */}
                <Link to={`/products/${item.product?.slug || item.product?._id}`} className="w-24 h-24 flex-shrink-0">
                  <img
                    src={item.product?.images?.[0]?.url || 'https://via.placeholder.com/100'}
                    alt={item.product?.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </Link>

                {/* Product Details */}
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div>
                      <Link to={`/products/${item.product?.slug || item.product?._id}`}>
                        <h3 className="font-semibold text-gray-900 hover:text-gray-600">
                          {item.product?.name}
                        </h3>
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">
                        {item.variant?.color} / {item.variant?.size}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item._id)}
                      className="text-gray-400 hover:text-red-500 transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center border border-gray-200 rounded-lg">
                      <button
                        onClick={() => handleUpdateQuantity(item._id, item.quantity, -1)}
                        className="px-3 py-1 hover:bg-gray-100 transition"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-4 py-1 text-center min-w-[50px]">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item._id, item.quantity, 1)}
                        className="px-3 py-1 hover:bg-gray-100 transition"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                      <p className="text-sm text-gray-500">Rs. {item.price} each</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

              {/* Coupon Section */}
              <div className="mb-6">
                {coupon ? (
                  <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-green-800">Coupon Applied</span>
                      <p className="text-xs text-green-600">{coupon.code}</p>
                    </div>
                    <button onClick={handleRemoveCoupon} className="text-green-600 hover:text-green-800">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Coupon code"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={applyingCoupon}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                    >
                      {applyingCoupon ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-3 border-t border-gray-200 pt-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>Rs. {subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-Rs. {discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : `Rs. ${shipping}`}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (18% GST)</span>
                  <span>Rs. {tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span>Rs. {finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full mt-6 btn-primary py-3 text-center"
              >
                Proceed to Checkout
                <ArrowRight className="ml-2 w-5 h-5 inline" />
              </button>

              <Link to="/products" className="block text-center mt-4 text-sm text-gray-500 hover:text-gray-900">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
