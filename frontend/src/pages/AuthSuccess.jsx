import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import Toast from "../utils/Toast.jsx";

const AuthSuccess = () => {
  const { getCurrentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthSuccess = async () => {
      try {
        await getCurrentUser();
        Toast("Successfully logged in with Google!", "success");
        navigate("/");
      } catch (error) {
        Toast("Failed to complete Google login", "error");
        navigate("/login");
      }
    };

    handleAuthSuccess();
  }, [getCurrentUser, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  );
};

export default AuthSuccess;