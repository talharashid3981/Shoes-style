import express from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  addAddress,
  updateAddress,
  deleteAddress,
  updateNewsletterPref,
} from '../controllers/userController.js';
import  protect from "../middleware/auth.js"
import admin  from '../middleware/admin.js';

const router = express.Router();

router.route('/')
  .get(protect, admin, getUsers);

router.route('/address')
  .post(protect, addAddress);

router.route('/newsletter')
  .put(protect, updateNewsletterPref);

router.route('/address/:addressId')
  .put(protect, updateAddress)
  .delete(protect, deleteAddress);

router.route('/:id')
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);

export default router;