import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Mail, Hash, Search } from 'lucide-react';
import { guestOrderLookupAPI } from '../services/orderService';
import Toast from '../utils/Toast';

const GuestOrderLookup = () => {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!orderId || !email) {
      Toast('Please enter both Order ID and Email', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await guestOrderLookupAPI(orderId, email);
      if (response.success) {
        navigate(`/orders/${response.order._id}?email=${encodeURIComponent(email)}`);
      }
    } catch (error) {
      Toast(error.message || 'Order not found. Please check your details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-gray-50">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h1 className="text-2xl font-bold text-gray-900 mt-4">Track Your Order</h1>
            <p className="text-gray-500 mt-2">
              Enter your order ID and email to view order status
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order ID
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g., SOLE-000001"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Format: SOLE-XXXXXX (found in your order confirmation email)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                The email used when placing the order
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-center flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Track Order
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-gray-900 font-medium hover:underline"
              >
                Sign up
              </button>{' '}
              to track all your orders easily.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestOrderLookup;