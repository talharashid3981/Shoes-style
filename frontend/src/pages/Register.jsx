import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { FcGoogle } from "react-icons/fc";
import { RiEyeLine, RiEyeOffLine, RiLockLine, RiMailLine, RiUserLine } from "react-icons/ri";
import Toast from "../utils/Toast.jsx";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const res = await signUp({ name, email, password });

    Toast(
      res.message || "Check your email for verification",
      "success"
    );

    navigate("/login");
  } catch (error) {
    Toast(error || "Registration failed", "error");
  } finally {
    setLoading(false);
  }
};

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8000/api/auth/google";
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-white pt-24">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 shadow-lg p-8">
        <div className="mb-7">
          <h1 className="text-2xl font-semibold text-black">Create account</h1>
          <p className="mt-1 text-sm text-gray-500">Join Sole Style today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">Full Name</label>
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus-within:border-black transition">
              <RiUserLine size={16} className="text-gray-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="flex-1 bg-transparent outline-none text-sm text-black placeholder-gray-400"
              />
            </div>
          </div>

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

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">Password</label>
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
            <p className="text-xs text-gray-400">Must be at least 8 characters</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 rounded-xl text-sm font-semibold text-white bg-black hover:bg-gray-800 transition disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Creating account...
              </span>
            ) : "Sign Up"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or continue with</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-sm font-medium"
        >
          <FcGoogle size={18} />
          Google
        </button>

        <p className="text-center text-sm mt-6 text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="text-black font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;