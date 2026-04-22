# Sole Style Frontend

A modern, production-ready React frontend for the Sole Style e-commerce application.

## Features

- **Authentication**: JWT-based auth with httpOnly cookies, Google OAuth, email verification
- **Cart System**: Guest cart with automatic merge on login, coupon support
- **Checkout**: Multi-step checkout with COD payment
- **Orders**: Order tracking for both guests and logged-in users
- **Wishlist**: Save favorite products
- **Admin Dashboard**: Manage products, orders, users, categories, collections, banners, coupons, newsletters
- **Responsive Design**: Mobile-first design with Tailwind CSS

## Tech Stack

- **Framework**: React 18 with Vite
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast

## Project Structure

```
solestyle-frontend/
├── public/
├── src/
│   ├── components/
│   │   └── Layout/          # Layout components (Navbar, Footer, ProtectedRoute)
│   ├── hooks/               # Custom React hooks
│   ├── pages/               # Page components
│   │   ├── Admin/           # Admin dashboard
│   │   ├── Auth/            # Auth-related pages (optional)
│   │   └── ...              # Other pages
│   ├── services/            # API service files
│   ├── store/               # Redux store and slices
│   ├── utils/               # Utility components (Toast, Loader)
│   ├── App.jsx              # Main app component with routing
│   ├── main.jsx             # Entry point
│   └── index.css            # Tailwind CSS imports
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Create a `.env` file in the root:

```env
VITE_API_URL=http://localhost:8000/api
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Routes

### Public Routes
- `/` - Home
- `/products` - Product listing
- `/products/:id` - Product details
- `/collections` - Collections
- `/track-order` - Guest order tracking

### Auth Routes
- `/login` - Login
- `/register` - Register
- `/verify-email` - Email verification
- `/forgot-password` - Forgot password
- `/reset-password` - Reset password
- `/auth/success` - OAuth success callback

### Protected Routes
- `/cart` - Shopping cart
- `/checkout` - Checkout
- `/orders` - My orders
- `/orders/:id` - Order details
- `/profile` - User profile (3 tabs: Profile, Addresses, Security)
- `/wishlist` - Wishlist

### Admin Routes
- `/admin/*` - Admin dashboard with 12 sections

## Authentication Flow

1. User registers → Email verification sent → Click link to verify
2. User logs in → JWT stored in httpOnly cookie
3. Protected routes check auth status via API
4. Google OAuth redirects to backend → Returns to `/auth/success`

## Cart Flow

1. Guest users: Cart stored with guestId cookie
2. On login: Guest cart merges with user cart automatically
3. Cart persists across sessions via backend

## Checkout Flow

1. Shipping address form
2. Payment method selection (COD only currently)
3. Order placed → Clear cart → Show confirmation

## Backend Integration

The frontend connects to a Node.js/Express backend with:
- MongoDB for database
- JWT authentication with httpOnly cookies
- RESTful API endpoints
- Cloudinary for image uploads
- SendGrid for emails

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT
