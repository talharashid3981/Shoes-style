import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { FcGoogle } from "react-icons/fc";
import { RiEyeLine, RiEyeOffLine, RiLockLine, RiMailLine } from "react-icons/ri";
import notificationToaster from "../utils/Toast.jsx.jsx";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { logIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    console.log("login page try run")
    const res = await logIn({ email, password }); // ✅ correct now
    notificationToaster(res.message || "Login successful!", "success");
    navigate("/");
  } catch (error) {
    console.log("login page catch run")

    notificationToaster(error || "Login failed", "error");
  } finally {
    setLoading(false);
  }
};

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/api/oauth/google";
  };


  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-white">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 shadow-lg p-8">

        {/* Header */}
        <div className="mb-7">
          <h1 className="text-2xl font-semibold text-black">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Sign in to your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">
              Email address
            </label>
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus-within:border-black transition">
              <RiMailLine size={16} className="text-gray-400" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 bg-transparent outline-none text-sm text-black placeholder-gray-400"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-500">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-black hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus-within:border-black transition">
              <RiLockLine size={16} className="text-gray-400" />
              <input
                type={showPass ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex-1 bg-transparent outline-none text-sm text-black placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="text-gray-400 hover:text-black transition"
                tabIndex={-1}
              >
                {showPass ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 rounded-xl text-sm font-semibold text-white bg-black hover:bg-gray-800 transition disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Signing in…
              </span>
            ) : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or continue with</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* OAuth */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-sm font-medium"
          >
            <FcGoogle size={18} />
            Google
          </button>

         
        </div>

        {/* Signup */}
        <p className="text-center text-sm mt-6 text-gray-500">
          Don't have an account?{" "}
          <Link to="/register" className="text-black font-medium hover:underline">
            Create one
          </Link>
        </p>

      </div>
    </div>
  );
};

export default LoginPage;