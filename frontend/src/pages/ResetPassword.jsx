import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { RiEyeLine, RiEyeOffLine, RiLockLine } from "react-icons/ri";
import Toast from "../utils/Toast.jsx";
import useAuth from "../hooks/useAuth";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get("token");
    if (!tokenParam) {
      Toast("Invalid reset link", "error");
      navigate("/login");
    } else {
      setToken(tokenParam);
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      Toast("Passwords do not match", "error");
      return;
    }
    
    if (password.length < 8) {
      Toast("Password must be at least 8 characters", "error");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      Toast("Password reset successful! You can now log in.", "success");
      navigate("/login");
    } catch (error) {
      Toast(error?.message || "Failed to reset password", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white pt-24">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 shadow-lg p-8">
        <div className="mb-7">
          <h1 className="text-2xl font-semibold text-black">Reset password</h1>
          <p className="mt-1 text-sm text-gray-500">Enter your new password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">New password</label>
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus-within:border-black transition">
              <RiLockLine size={16} className="text-gray-400" />
              <input
                type={showPass ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex-1 bg-transparent outline-none text-sm text-black placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="text-gray-400 hover:text-black transition"
              >
                {showPass ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">Confirm password</label>
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus-within:border-black transition">
              <RiLockLine size={16} className="text-gray-400" />
              <input
                type={showPass ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="flex-1 bg-transparent outline-none text-sm text-black placeholder-gray-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 rounded-xl text-sm font-semibold text-white bg-black hover:bg-gray-800 transition disabled:opacity-50"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;