import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, Eye, Calendar, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';
import useOrders from "../hooks/useOrders";
import Toast from "../utils/Toast.jsx";

const Orders = () => {
  const { orders, total, page, pages, isLoading, fetchMyOrders, cancelOrder } =
    useOrders();
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchMyOrders({ page: 1, limit: 10 });
  }, []);

  const handleCancelOrder = async (orderId) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    setCancellingId(orderId);
    try {
      await cancelOrder(orderId);
      Toast("Order cancelled successfully", "success");
      fetchMyOrders({ page: 1, limit: 10 });
    } catch (error) {
      Toast(error.message || "Failed to cancel order", "error");
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      confirmed: { color: "bg-blue-100 text-blue-800", icon: CheckCircle },
      shipped: { color: "bg-purple-100 text-purple-800", icon: Truck },
      delivered: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      cancelled: { color: "bg-red-100 text-red-800", icon: XCircle },
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}
      >
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (isLoading && orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <Package className="mx-auto h-16 w-16 text-gray-400" />
            <h2 className="mt-4 text-2xl font-semibold text-gray-900">
              No orders yet
            </h2>
            <p className="mt-2 text-gray-500">
              You haven't placed any orders yet.
            </p>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-lg shadow-sm p-6">
              {/* Order Header */}
              <div className="flex flex-wrap justify-between items-start mb-4 pb-4 border-b border-gray-200">
                <div>
                  <p className="text-sm text-gray-500">
                    Order #{order.orderId}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(order.status || order.orderStatus)}
                  <Link
                    to={`/orders/${order._id}`}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </Link>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-3 mb-4">
                {order.items.slice(0, 2).map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <img
                      src={
                        item.image ||
                        item.product?.images?.[0]?.url ||
                        "https://via.placeholder.com/60"
                      }
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {item.variant?.color} / {item.variant?.size} ×{" "}
                        {item.quantity}
                      </p>
                      <p className="text-sm font-medium">
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {order.items.length > 2 && (
                  <p className="text-sm text-gray-500">
                    +{order.items.length - 2} more items
                  </p>
                )}
              </div>

              {/* Order Footer */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-xl font-bold text-gray-900">
                    Rs. {order.total}
                  </p>
                </div>
                {order.orderStatus === "pending" && (
                  <button
                    onClick={() => handleCancelOrder(order._id)}
                    disabled={cancellingId === order._id}
                    className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                  >
                    {cancellingId === order._id
                      ? "Cancelling..."
                      : "Cancel Order"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => fetchMyOrders({ page: page - 1, limit: 10 })}
              disabled={page === 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {page} of {pages}
            </span>
            <button
              onClick={() => fetchMyOrders({ page: page + 1, limit: 10 })}
              disabled={page === pages}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
