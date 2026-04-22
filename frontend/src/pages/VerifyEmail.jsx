import { useState, useEffect } from "react";
import { useNavigate, useLocation,Link } from "react-router-dom";
import Toast from "../utils/Toast";
import { verifyEmailAPI, resendVerificationAPI } from "../services/authService";

const VerifyEmailPage = () => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const emailParam = params.get("email");

    if (emailParam) {
      setEmail(emailParam);
    }

    if (token) {
      verifyEmail(token);
    } else if (emailParam) {
      setStatus("needs_resend");
      setLoading(false);
    } else {
      Toast("Invalid verification link", "error");
      navigate("/login");
    }
  }, [location, navigate]);

  const verifyEmail = async (token) => {
    try {
      const response = await verifyEmailAPI(token);
      if (response.success) {
        setStatus("success");
        Toast(response.message, "success");
        setTimeout(() => navigate("/"), 2000);
      }
    } catch (error) {
      setStatus("error");
      Toast(error?.message || "Verification failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const response = await resendVerificationAPI(email);
      Toast(response.message || "Verification email sent", "success");
    } catch (error) {
      Toast(error?.message || "Failed to send verification email", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (status === "success") {
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
          <h1 className="text-2xl font-semibold mb-3">Email Verified!</h1>
          <p className="text-gray-500">Your email has been verified. Redirecting to home...</p>
        </div>
      </div>
    );
  }

  if (status === "needs_resend") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-white pt-24">
        <div className="w-full max-w-md text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-semibold mb-3">Verify your email</h1>
          <p className="text-gray-500 mb-6">
            We sent a verification link to <strong>{email}</strong>. Please check your inbox.
          </p>
          <button
            onClick={handleResend}
            disabled={loading}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            {loading ? "Sending..." : "Resend verification email"}
          </button>
          <Link to="/login" className="block mt-4 text-sm text-gray-500 hover:text-black">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white pt-24">
      <div className="w-full max-w-md text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-semibold mb-3">Verification failed</h1>
        <p className="text-gray-500 mb-6">The verification link is invalid or has expired.</p>
        <Link to="/login" className="text-black font-medium hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmailPage;