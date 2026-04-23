import { useDispatch, useSelector } from "react-redux";
import {
  loginAPI,
  logoutAPI,
  registerAPI,
  getCurrentUserAPI,
  resetPasswordAPI,
  forgotPasswordAPI,
  updateProfileAPI,
} from "../services/authService";
import { logout, setProfile, setUser } from "../store/slices/authSlice";
import { useNavigate } from "react-router-dom";

const useAuth = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, profile, isAuthenticated } = useSelector((state) => state.auth);

  // ✅ Sign Up (FIXED)
  const signUp = async (formData) => {
    try {
      const  data  = await registerAPI(formData);

      if (data.success) {
        return data; // NO user dispatch here (backend doesn't send user)
      }

      throw new Error(data.message);
    } catch (error) {
      throw error?.response?.data?.message || error.message;
    }
  };

  // ✅ Log In (FIXED)
  const logIn = async ({ email, password }) => {
    try {
      const  data  = await loginAPI({ email, password });
      if (data.success) {
        dispatch(setUser(data.user));
        dispatch(setProfile(data.user));
        return data;
      }

      throw new Error(data.message);
    } catch (error) {
      throw error?.response?.data?.message || error.message;
    }
  };

  // ✅ Logout
  const logOut = async () => {
    try {
      await logoutAPI();
    } finally {
      dispatch(logout());
      navigate("/login");
    }
  };

  // ✅ Get Current User
  const getCurrentUser = async () => {
    try {
      const  data  = await getCurrentUserAPI();

      if (data.success) {
        dispatch(setUser(data.user));
        dispatch(setProfile(data.user));
        return data.user;
      }
    } catch {
      dispatch(logout());
      return null;
    }
  };

  // ✅ Update User
  const updateCurrentUser = async (userData) => {
    try {
      const  data  = await updateProfileAPI(userData);

      if (data.success) {
        dispatch(setUser(data.user));
        dispatch(setProfile(data.user));
        return data.user;
      }

      throw new Error(data.message);
    } catch (error) {
      throw error?.response?.data?.message || error.message;
    }
  };

  const forgotPassword = async (email) => {
    const  data  = await forgotPasswordAPI(email);
    return data;
  };

  const resetPassword = async (token, password) => {
    const  data  = await resetPasswordAPI(token, password);
    return data;
  };

  return {
    user,
    profile,
    isAuthenticated,
    signUp,
    logIn,
    logOut,
    getCurrentUser,
    updateCurrentUser,
    forgotPassword,
    resetPassword,
  };
};

export default useAuth; 
