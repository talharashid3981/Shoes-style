import { useState, useEffect } from 'react';
import { 
  User, 
  MapPin, 
  Lock, 
  Camera,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Loader,
  ShieldCheck,
  Mail,
} from 'lucide-react';
import notificationToaster from "../utils/toast";
import useAuth from '../hooks/useAuth';

// ─── You need to import/expose these from your authService or useAuth ─────────
// Add resendVerificationAPI to authService.js (already exists as resendVerificationAPI)
// and expose a `resendVerification` helper in useAuth if you want, OR call it directly here.
import { resendVerificationAPI } from '../services/authService';

const Profile = () => {
  const { user, updateCurrentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatar: user?.avatar || '',
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    name: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Pakistan',
    phone: '',
    isDefault: false,
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        avatar: user.avatar || '',
      });
      setAddresses(user.addresses || []);
    }
  }, [user]);

  // ─── Profile Update ──────────────────────────────────────────────────────────
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateCurrentUser({ name: profileData.name });
      notificationToaster('Profile updated successfully', 'success');
    } catch (err) {
      notificationToaster(err || 'Failed to update profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Password Change ─────────────────────────────────────────────────────────
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      notificationToaster('Passwords do not match', 'error');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      notificationToaster('Password must be at least 8 characters', 'error');
      return;
    }
    setIsLoading(true);
    try {
      await updateCurrentUser({ password: passwordData.newPassword });
      notificationToaster('Password updated successfully!', 'success');
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (err) {
      notificationToaster(err || 'Failed to update password', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Resend Verification Email ───────────────────────────────────────────────
  const handleResendVerification = async () => {
    setIsLoading(true);
    try {
      const data = await resendVerificationAPI(user.email);
      if (data.success) {
        setVerificationSent(true);
        notificationToaster('Verification email sent! Check your inbox.', 'success');
      } else {
        notificationToaster(data.message || 'Failed to send verification email', 'error');
      }
    } catch (err) {
      notificationToaster('Failed to send verification email', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Address Handlers ────────────────────────────────────────────────────────
  const handleAddAddress = () => {
    setEditingAddress(null);
    setAddressForm({
      name: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Pakistan',
      phone: '',
      isDefault: false,
    });
    setShowAddressForm(true);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setAddressForm(address);
    setShowAddressForm(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const updatedAddresses = editingAddress
        ? addresses.map(a => a._id === editingAddress._id ? { ...addressForm, _id: editingAddress._id } : a)
        : [...addresses, { ...addressForm, _id: Date.now().toString() }];

      await updateCurrentUser({ addresses: updatedAddresses });
      setAddresses(updatedAddresses);
      setShowAddressForm(false);
      notificationToaster(editingAddress ? 'Address updated successfully' : 'Address added successfully', 'success');
    } catch (err) {
      notificationToaster(err || 'Failed to save address', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    setIsLoading(true);
    try {
      const updatedAddresses = addresses.filter(a => a._id !== addressId);
      await updateCurrentUser({ addresses: updatedAddresses });
      setAddresses(updatedAddresses);
      notificationToaster('Address deleted successfully', 'success');
    } catch (err) {
      notificationToaster(err || 'Failed to delete address', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Tabs ────────────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'security', label: 'Security', icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* ── Sidebar ── */}
          <div className="md:col-span-1">
            <div className="card overflow-hidden">
              <div className="p-6 bg-gray-900 text-white">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold">{user?.name}</p>
                    <p className="text-sm text-gray-300">{user?.email}</p>
                    {/* Email verification badge in sidebar */}
                    <div className="mt-1">
                      {user?.isEmailVerified ? (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-yellow-400">
                          <XCircle className="w-3 h-3" /> Not verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <nav className="p-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5 mr-3" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* ── Main Content ── */}
          <div className="md:col-span-3">

            {/* ── Profile Tab ── */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Email Verification Banner */}
                {!user?.isEmailVerified && (
                  <div className="flex items-start gap-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <Mail className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-yellow-800 text-sm">Email not verified</p>
                      <p className="text-yellow-700 text-sm mt-0.5">
                        Please verify your email address to access all features.
                      </p>
                    </div>
                    {verificationSent ? (
                      <span className="text-sm text-green-700 font-medium whitespace-nowrap">
                        ✓ Email sent
                      </span>
                    ) : (
                      <button
                        onClick={handleResendVerification}
                        disabled={isLoading}
                        className="btn-secondary text-sm whitespace-nowrap"
                      >
                        {isLoading ? (
                          <Loader size={14} className="animate-spin" />
                        ) : (
                          'Send Verification'
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Verified success banner */}
                {user?.isEmailVerified && (
                  <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                    <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-green-800 text-sm font-medium">
                      Your email address is verified.
                    </p>
                  </div>
                )}

                <div className="card p-6">
                  <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div>
                      <label className="label">Full Name</label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Email</label>
                      <div className="relative">
                        <input
                          type="email"
                          value={profileData.email}
                          disabled
                          className="input bg-gray-100 pr-32"
                        />
                        <span className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-medium ${
                          user?.isEmailVerified ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {user?.isEmailVerified ? (
                            <><CheckCircle className="w-3.5 h-3.5" /> Verified</>
                          ) : (
                            <><XCircle className="w-3.5 h-3.5" /> Unverified</>
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-primary flex items-center gap-2"
                    >
                      {isLoading && <Loader size={16} className="animate-spin" />}
                      Save Changes
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* ── Addresses Tab ── */}
            {activeTab === 'addresses' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">My Addresses</h2>
                  <button onClick={handleAddAddress} className="btn-secondary flex items-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Address
                  </button>
                </div>

                {showAddressForm && (
                  <div className="card p-6">
                    <h3 className="font-semibold mb-4">
                      {editingAddress ? 'Edit Address' : 'Add New Address'}
                    </h3>
                    <form onSubmit={handleSaveAddress} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="label">Full Name</label>
                          <input
                            type="text"
                            value={addressForm.name}
                            onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                            className="input"
                            required
                          />
                        </div>
                        <div>
                          <label className="label">Phone</label>
                          <input
                            type="tel"
                            value={addressForm.phone}
                            onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                            className="input"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="label">Address Line 1</label>
                        <input
                          type="text"
                          value={addressForm.addressLine1}
                          onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                          className="input"
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Address Line 2</label>
                        <input
                          type="text"
                          value={addressForm.addressLine2}
                          onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                          className="input"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="label">City</label>
                          <input
                            type="text"
                            value={addressForm.city}
                            onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                            className="input"
                            required
                          />
                        </div>
                        <div>
                          <label className="label">State</label>
                          <input
                            type="text"
                            value={addressForm.state}
                            onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                            className="input"
                            required
                          />
                        </div>
                        <div>
                          <label className="label">Postal Code</label>
                          <input
                            type="text"
                            value={addressForm.postalCode}
                            onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                            className="input"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isDefault"
                          checked={addressForm.isDefault}
                          onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                          className="mr-2"
                        />
                        <label htmlFor="isDefault">Set as default address</label>
                      </div>
                      <div className="flex space-x-4">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="btn-primary flex items-center gap-2"
                        >
                          {isLoading && <Loader size={14} className="animate-spin" />}
                          {editingAddress ? 'Update' : 'Save'} Address
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(false)}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="grid gap-4">
                  {addresses.map((address) => (
                    <div key={address._id} className="card p-6">
                      <div className="flex justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{address.name}</h3>
                            {address.isDefault && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 mt-1">
                            {address.addressLine1}<br />
                            {address.addressLine2 && <>{address.addressLine2}<br /></>}
                            {address.city}, {address.state} {address.postalCode}<br />
                            Phone: {address.phone}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditAddress(address)}
                            className="p-2 text-gray-600 hover:text-gray-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(address._id)}
                            className="p-2 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {addresses.length === 0 && !showAddressForm && (
                    <div className="text-center py-12">
                      <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-4 text-gray-600">No addresses saved yet</p>
                      <button onClick={handleAddAddress} className="btn-primary mt-4">
                        Add Your First Address
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Security Tab ── */}
            {activeTab === 'security' && (
              <div className="card p-6">
                <h2 className="text-xl font-semibold mb-6">Change Password</h2>
                <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
                  <div>
                    <label className="label">New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="input"
                      required
                      minLength={8}
                    />
                  </div>
                  <div>
                    <label className="label">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="input"
                      required
                      minLength={8}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary flex items-center gap-2"
                  >
                    {isLoading && <Loader size={16} className="animate-spin" />}
                    Update Password
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;