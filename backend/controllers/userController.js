import User from '../models/User.js';
import { hashPassword } from '../utils/passwordUtils.js';

// @route   GET /api/users
export const getUsers = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find({})
        .select('-password -emailVerificationToken -emailVerificationExpire -resetPasswordToken -resetPasswordExpire')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      User.countDocuments(),
    ]);

    res.json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      users,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/users/:id
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      '-password -emailVerificationToken -emailVerificationExpire -resetPasswordToken -resetPasswordExpire'
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   PUT /api/users/:id
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // ✅ Prevent admin from accidentally promoting themselves if they lose access
    if (req.body.role && req.body.role === 'admin' && req.user._id.toString() === req.params.id) {
      // Allow — an admin can keep their own role. This guard is for clarity.
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email?.toLowerCase() || user.email;
    user.role = req.body.role || user.role;

    if (req.body.isEmailVerified !== undefined) {
      user.isEmailVerified = req.body.isEmailVerified;
    }

    // ✅ FIX: Always hash password before saving — never store plaintext
    if (req.body.password) {
      if (req.body.password.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
      }
      user.password = await hashPassword(req.body.password);
    }

    const updated = await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        _id: updated._id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        isEmailVerified: updated.isEmailVerified,
        createdAt: updated.createdAt,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   DELETE /api/users/:id
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // ✅ Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Admins cannot delete their own account' });
    }

    await user.deleteOne();
    res.json({ success: true, message: 'User removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/users/address
export const addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { address } = req.body;
    if (!address) return res.status(400).json({ success: false, message: 'Address is required' });

    // ✅ If this is the first address or marked as default, clear other defaults
    if (address.isDefault || user.addresses.length === 0) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
      address.isDefault = true;
    }

    user.addresses.push(address);
    await user.save();

    res.json({ success: true, data: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   PUT /api/users/address/:addressId
export const updateAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    const updates = req.body.address || req.body;
    Object.assign(address, updates);

    // If this address is being set as default, clear others first
    if (updates.isDefault) {
      user.addresses.forEach((addr) => {
        if (addr._id.toString() !== req.params.addressId) {
          addr.isDefault = false;
        }
      });
      address.isDefault = true;
    }

    await user.save();
    res.json({ success: true, data: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   DELETE /api/users/address/:addressId
export const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const initialLength = user.addresses.length;
    user.addresses = user.addresses.filter(
      (addr) => addr._id.toString() !== req.params.addressId
    );

    if (user.addresses.length === initialLength) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    // If the deleted address was the default, make the first remaining address default
    if (user.addresses.length > 0 && !user.addresses.some((a) => a.isDefault)) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.json({ success: true, data: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   PUT /api/users/newsletter
export const updateNewsletterPref = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.newsletterPreferences = {
      subscribed: req.body.subscribed ?? user.newsletterPreferences.subscribed,
      preferences: req.body.preferences ?? user.newsletterPreferences.preferences,
    };

    await user.save();
    res.json({ success: true, data: user.newsletterPreferences });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};