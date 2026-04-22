import { useState } from "react";
import { Link } from "react-router-dom";
import { RiMailLine, RiArrowLeftLine } from "react-icons/ri";
import Toast from "../utils/Toast";
import useAuth from "../hooks/useAuth";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSubmitted(true);
      Toast("If an account exists with this email, you'll receive a reset link.", "success");
    } catch (error) {
      Toast(error?.message || "Failed to send reset link", "error");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-white pt-24">
        <div className="w-full max-w-md text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-semibold mb-3">Check your email</h1>
          <p className="text-gray-500 mb-6">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <Link to="/login" className="text-black font-medium hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white pt-24">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 shadow-lg p-8">
        <div className="mb-7">
          <h1 className="text-2xl font-semibold text-black">Forgot password?</h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">Email address</label>
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus-within:border-black transition">
              <RiMailLine size={16} className="text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 bg-transparent outline-none text-sm text-black placeholder-gray-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 rounded-xl text-sm font-semibold text-white bg-black hover:bg-gray-800 transition disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <Link to="/login" className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-500 hover:text-black">
          <RiArrowLeftLine size={16} />
          Back to login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;