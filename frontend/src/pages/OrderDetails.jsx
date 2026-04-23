import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, Truck, MapPin, CreditCard, Calendar, Download, CheckCircle, XCircle } from 'lucide-react';
import useOrders from '../hooks/useOrders';
import Toast from '../utils/Toast';

const OrderDetails = () => {
  const { id } = useParams();
  const { currentOrder, isLoading, fetchOrderById, cancelOrder } = useOrders();
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOrderById(id);
    }
  }, [id]);

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    setCancelling(true);
    try {
      await cancelOrder(currentOrder._id);
      Toast('Order cancelled successfully', 'success');
      fetchOrderById(id);
    } catch (error) {
      Toast(error.message || 'Failed to cancel order', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return badges[status] || badges.pending;
  };

  const getStatusIcon = (status) => {
    if (status === 'delivered') return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (status === 'cancelled') return <XCircle className="w-5 h-5 text-red-600" />;
    return <Package className="w-5 h-5 text-blue-600" />;
  };

  if (isLoading || !currentOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/orders" className="text-gray-600 hover:text-gray-900 mb-4 inline-block">
            ← Back to Orders
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order #{currentOrder.orderId}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Placed on {new Date(currentOrder.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(currentOrder.orderStatus)}`}>
              {currentOrder.orderStatus.charAt(0).toUpperCase() + currentOrder.orderStatus.slice(1)}
            </div>
          </div>
        </div>

        {/* Order Timeline */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Order Status</h2>
          <div className="relative">
            <div className="flex justify-between">
              {['pending', 'confirmed', 'shipped', 'delivered'].map((status, idx) => {
                const statusIndex = ['pending', 'confirmed', 'shipped', 'delivered'].indexOf(currentOrder.orderStatus);
                const isCompleted = idx <= statusIndex;
                const isCurrent = currentOrder.orderStatus === status;
                
                return (
                  <div key={status} className="flex-1 text-center">
                    <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                      isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                    }`}>
                      {isCompleted ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                    </div>
                    <p className={`text-sm font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </p>
                    {isCurrent && (
                      <p className="text-xs text-gray-500 mt-1">Current</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Items</h2>
          <div className="space-y-4">
            {currentOrder.items.map((item, idx) => (
              <div key={idx} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0">
                <img
                  src={item.image || 'https://via.placeholder.com/80'}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded"
                />
                <div className="flex-1">
                  <Link to={`/products/${item.product}`} className="font-medium text-gray-900 hover:underline">
                    {item.name}
                  </Link>
                  <p className="text-sm text-gray-500 mt-1">
                    {item.variant?.color} / {item.variant?.size}
                  </p>
                  <div className="flex justify-between mt-2">
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    <p className="font-medium">Rs. {item.price * item.quantity}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold">Shipping Address</h2>
            </div>
            <div className="space-y-1 text-gray-600">
              <p className="font-medium">{currentOrder.shippingAddress?.name}</p>
              <p>{currentOrder.shippingAddress?.addressLine1}</p>
              {currentOrder.shippingAddress?.addressLine2 && <p>{currentOrder.shippingAddress.addressLine2}</p>}
              <p>{currentOrder.shippingAddress?.city}, {currentOrder.shippingAddress?.state}</p>
              <p>{currentOrder.shippingAddress?.postalCode}</p>
              <p>Phone: {currentOrder.shippingAddress?.phone}</p>
            </div>
          </div>

          {/* Payment & Totals */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold">Payment Summary</h2>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>Rs. {currentOrder.subtotal?.toFixed(2)}</span>
              </div>
              {currentOrder.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-Rs. {currentOrder.discount?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>{currentOrder.shippingCost === 0 ? 'Free' : `Rs. ${currentOrder.shippingCost}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (18% GST)</span>
                <span>Rs. {currentOrder.tax?.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between text-xl font-bold text-gray-900">
                  <span>Total</span>
                  <span>Rs. {currentOrder.total?.toFixed(2)}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">Payment Method: {currentOrder.paymentMethod}</p>
                <p className="text-sm text-gray-600">Payment Status: {currentOrder.paymentStatus}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tracking Info (if shipped) */}
        {currentOrder.trackingNumber && (
          <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold">Tracking Information</h2>
            </div>
            <p className="text-gray-600">Tracking Number: <span className="font-medium">{currentOrder.trackingNumber}</span></p>
          </div>
        )}

        {/* Cancel Button (if pending) */}
        {currentOrder.orderStatus === 'pending' && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="px-6 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;
