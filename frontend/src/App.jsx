import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import useAuth from './hooks/useAuth';

import Navbar from './Layout/Navbar';
import Footer from './Layout/Footer';
import ProtectedRoute from './Layout/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Wishlist from './pages/Wishlist';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import AuthSuccess from './pages/AuthSuccess';
import GuestOrderLookup from './pages/GuestOrderLookup';
import NotFound from './pages/NotFound';
import AdminDashboard from './pages/Admin/AdminDashboard';

function App() {
  const { getCurrentUser } = useAuth();

  // ✅ Restore user session on app load from httpOnly cookie
  useEffect(() => {
    const restoreSession = async () => {
      try {
        await getCurrentUser();
      } catch (error) {
        // User not logged in or session expired — that's ok
        console.log('No active session');
      }
    };

    restoreSession();
  }, []);
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/wishlist" element={<Wishlist />} />

          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />

          <Route path="/orders/:id" element={<OrderDetails />} />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/auth/success" element={<AuthSuccess />} />
          <Route path="/guest-order" element={<GuestOrderLookup />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;