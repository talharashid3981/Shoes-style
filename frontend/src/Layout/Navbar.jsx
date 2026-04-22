import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ShoppingBag, Heart, User, Menu, X, Search, LogOut } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import useCart from '../hooks/useCart';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, user, logOut } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?keyword=${searchQuery}`);
      setSearchQuery('');
      setIsOpen(false);
    }
  };

  const handleLogout = async () => {
    await logOut();
    navigate('/');
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-white shadow-md py-2' : 'bg-white/95 backdrop-blur-md py-4'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-gray-900">
            SOLE STYLE
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/products" className="text-gray-700 hover:text-gray-900">Shop</Link>
            <Link to="/products?label=New" className="text-gray-700 hover:text-gray-900">New</Link>
            <Link to="/products?label=Sale" className="text-gray-700 hover:text-gray-900">Sale</Link>
            
            {/* Search */}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            </form>

            {/* Icons */}
            <Link to="/wishlist" className="relative">
              <Heart className="w-5 h-5 text-gray-700 hover:text-gray-900" />
            </Link>
            
            <Link to="/cart" className="relative">
              <ShoppingBag className="w-5 h-5 text-gray-700 hover:text-gray-900" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="text-sm text-gray-700">{user?.name?.split(' ')[0]}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</Link>
                  <Link to="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Orders</Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Admin Dashboard</Link>
                  )}
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden">
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-3">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            </form>
            <Link to="/products" className="block py-2 text-gray-700" onClick={() => setIsOpen(false)}>Shop</Link>
            <Link to="/products?label=New" className="block py-2 text-gray-700" onClick={() => setIsOpen(false)}>New</Link>
            <Link to="/products?label=Sale" className="block py-2 text-gray-700" onClick={() => setIsOpen(false)}>Sale</Link>
            <Link to="/wishlist" className="block py-2 text-gray-700" onClick={() => setIsOpen(false)}>Wishlist</Link>
            <Link to="/cart" className="block py-2 text-gray-700" onClick={() => setIsOpen(false)}>Cart ({totalItems})</Link>
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="block py-2 text-gray-700" onClick={() => setIsOpen(false)}>Profile</Link>
                <Link to="/orders" className="block py-2 text-gray-700" onClick={() => setIsOpen(false)}>Orders</Link>
                <button onClick={() => { handleLogout(); setIsOpen(false); }} className="block w-full text-left py-2 text-red-600">
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="block py-2 text-gray-900 font-medium" onClick={() => setIsOpen(false)}>Sign In</Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;