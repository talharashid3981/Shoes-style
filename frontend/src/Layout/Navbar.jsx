import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  Search,
  LogOut
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import useCart from '../hooks/useCart';
import logo from '../assets/Logo.png';

const Navbar = () => {
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  const { isAuthenticated, user, logOut } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
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
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-lg shadow-md py-1'
          : 'bg-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center">

          {/* LOGO */}
          <Link
            to="/"
            className="text-2xl font-bold tracking-tight text-gray-900 hover:scale-105 transition"
          >
            <img src={logo} alt="Logo" className="h-12 w-15" />
          </Link>

          {/* DESKTOP */}
          <div className="hidden md:flex items-center gap-8">

            {/* LINKS */}
            <Link to="/products" className="nav-link">Shop</Link>
            <Link to="/products?label=New" className="nav-link">New</Link>
            <Link to="/products?label=Sale" className="nav-link">Sale</Link>

            {/* SEARCH */}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="pl-10 pr-4 py-2 w-48 focus:w-64 transition-all duration-300 border rounded-full bg-gray-100 focus:bg-white focus:ring-2 focus:ring-black outline-none"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            </form>

            {/* ICONS */}
            <Link to="/wishlist" className="icon-btn">
              <Heart />
            </Link>

            <Link to="/cart" className="icon-btn relative">
              <ShoppingBag />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* USER */}
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-gradient-to-r from-gray-800 to-gray-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium">
                    {user?.name?.split(' ')[0]}
                  </span>
                </button>

                {/* DROPDOWN */}
                <div className="absolute right-0 mt-3 w-52 bg-white rounded-xl shadow-xl opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-all duration-200 overflow-hidden">

                  <Link className="dropdown-item" to="/profile">
                    Profile
                  </Link>

                  <Link className="dropdown-item" to="/orders">
                    Orders
                  </Link>

                  {user?.role === 'admin' && (
                    <Link className="dropdown-item" to="/admin">
                      Admin Panel
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-red-500 flex items-center gap-2"
                  >
                    <LogOut size={16} /> <span> Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <Link className="btn-primary" to="/login">
                Sign In
              </Link>
            )}
          </div>

          {/* MOBILE BUTTON */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden"
          >
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* MOBILE MENU */}
        {isOpen && (
          <div className="md:hidden mt-4 p-4 bg-white rounded-xl shadow-lg space-y-4 animate-fadeIn">

            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            </form>

            <Link onClick={() => setIsOpen(false)} to="/products">Shop</Link>
            <Link onClick={() => setIsOpen(false)} to="/products?label=New">New</Link>
            <Link onClick={() => setIsOpen(false)} to="/products?label=Sale">Sale</Link>

            <Link onClick={() => setIsOpen(false)} to="/wishlist">Wishlist</Link>
            <Link onClick={() => setIsOpen(false)} to="/cart">Cart ({totalItems})</Link>

            {isAuthenticated ? (
              <>
                <Link to="/profile" onClick={() => setIsOpen(false)}>Profile</Link>
                <Link to="/orders" onClick={() => setIsOpen(false)}>Orders</Link>

                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="text-red-500"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setIsOpen(false)}>
                Sign In
              </Link>
            )}
          </div>
        )}
      </div>

      {/* STYLES */}
      <style jsx>{`
        .nav-link {
          font-size: 14px;
          font-weight: 500;
          color: #555;
          transition: all 0.2s;
        }
        .nav-link:hover {
          color: black;
          transform: scale(1.05);
        }

        .icon-btn svg {
          width: 20px;
          height: 20px;
          color: #555;
          transition: 0.2s;
        }
        .icon-btn:hover svg {
          color: black;
          transform: scale(1.2);
        }

        .dropdown-item {
          display: block;
          padding: 10px 16px;
          font-size: 14px;
          color: #444;
          transition: 0.2s;
        }
        .dropdown-item:hover {
          background: #f5f5f5;
        }

        .btn-primary {
          background: black;
          color: white;
          padding: 8px 16px;
          border-radius: 999px;
          font-size: 14px;
          transition: 0.2s;
        }
        .btn-primary:hover {
          background: #333;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;