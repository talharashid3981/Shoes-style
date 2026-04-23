import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useCart from '../hooks/useCart';
import { checkoutAPI } from '../services/orderService';
import Toast from '../utils/Toast';
import { MapPin, Phone, Mail, Package, CreditCard, Truck } from 'lucide-react';

const Checkout = () => {
  const { user, isAuthenticated } = useAuth();
  const { items, totalPrice, totalItems, discount, fetchCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  
  const [shippingAddress, setShippingAddress] = useState({
    name: user?.name || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Pakistan',
    phone: user?.addresses?.[0]?.phone || '',
  });

  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [billingAddress, setBillingAddress] = useState({ ...shippingAddress });
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchCart();
    if (user) {
      const defaultAddress = user.addresses?.find(addr => addr.isDefault);
      if (defaultAddress) {
        setShippingAddress({
          name: defaultAddress.name,
          addressLine1: defaultAddress.addressLine1,
          addressLine2: defaultAddress.addressLine2 || '',
          city: defaultAddress.city,
          state: defaultAddress.state,
          postalCode: defaultAddress.postalCode,
          country: defaultAddress.country,
          phone: defaultAddress.phone,
        });
      }
    }
  }, [user]);

  const subtotal = totalPrice;
  const shipping = subtotal > 500 ? 0 : 50;
  const tax = (subtotal - discount) * 0.18;
  const finalTotal = subtotal + shipping + tax - discount;

  const handleShippingChange = (e) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
    if (sameAsShipping) {
      setBillingAddress({ ...billingAddress, [e.target.name]: e.target.value });
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated && !guestEmail) {
      Toast('Please enter your email address', 'error');
      return;
    }

    if (!shippingAddress.name || !shippingAddress.addressLine1 || !shippingAddress.city || 
        !shippingAddress.state || !shippingAddress.postalCode || !shippingAddress.phone) {
      Toast('Please fill all required shipping address fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        shippingAddress,
        billingAddress: sameAsShipping ? shippingAddress : billingAddress,
        notes,
        ...(!isAuthenticated && { guestEmail }),
      };

      const response = await checkoutAPI(orderData);
      
      if (response.success) {
        Toast('Order placed successfully!', 'success');
        navigate(`/orders/${response.order._id}`);
      }
    } catch (error) {
      Toast(error.message || 'Failed to place order', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && !loading) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Guest/User Info */}
            {!isAuthenticated && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Contact Information
                </h2>
                <input
                  type="email"
                  required
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="Your email address"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900"
                />
                <p className="text-xs text-gray-500 mt-2">
                  We'll send order confirmation and updates to this email
                </p>
              </div>
            )}

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Shipping Address
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={shippingAddress.name}
                    onChange={handleShippingChange}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={shippingAddress.phone}
                    onChange={handleShippingChange}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={shippingAddress.addressLine1}
                    onChange={handleShippingChange}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={shippingAddress.addressLine2}
                    onChange={handleShippingChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={shippingAddress.city}
                    onChange={handleShippingChange}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <input
                    type="text"
                    name="state"
                    value={shippingAddress.state}
                    onChange={handleShippingChange}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code *</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={shippingAddress.postalCode}
                    onChange={handleShippingChange}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={shippingAddress.country}
                    onChange={handleShippingChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Billing Address */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="sameAsShipping"
                  checked={sameAsShipping}
                  onChange={(e) => setSameAsShipping(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="sameAsShipping" className="text-sm font-medium text-gray-700">
                  Billing address same as shipping
                </label>
              </div>

              {!sameAsShipping && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Billing Address</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Similar fields as shipping address */}
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        name="name"
                        value={billingAddress.name}
                        onChange={(e) => setBillingAddress({ ...billingAddress, name: e.target.value })}
                        placeholder="Full Name"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                      />
                    </div>
                    {/* Add other billing fields similarly */}
                  </div>
                </div>
              )}
            </div>

            {/* Order Notes */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Order Notes (Optional)</h2>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any special instructions for delivery..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                {items.map((item) => (
                  <div key={item._id} className="flex gap-3">
                    <img
                      src={item.product?.images?.[0]?.url || 'https://via.placeholder.com/60'}
                      alt={item.product?.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.product?.name}</p>
                      <p className="text-xs text-gray-500">{item.variant?.color} / {item.variant?.size}</p>
                      <p className="text-xs">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium">Rs. {item.price * item.quantity}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-gray-600"> 
                  <span>Subtotal ({totalItems} items)</span>
                  <span>Rs. {subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-Rs.{discount.toFixed(2)}</span>
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
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span>Rs. {finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <span className="text-sm">Cash on Delivery (COD)</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-2">
                  <Truck className="w-5 h-5 text-gray-600" />
                  <span className="text-sm">Free shipping on orders above Rs. 500</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full mt-6 btn-primary py-3 text-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                ) : (
                  'Place Order (COD)'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;