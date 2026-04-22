import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { RiArrowLeftLine, RiHome4Line } from "react-icons/ri";



const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white">
      
      <div className="text-center max-w-md w-full">

        {/* 404 */}
        <div className="mb-6 select-none">
          <span className="text-[120px] sm:text-[160px] font-black leading-none tracking-tighter text-gray-900/50">
            404
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3 text-black">
          Page not found
        </h1>

        <p className="text-sm sm:text-base text-gray-500 leading-relaxed mb-8">
          The page you're looking for doesn't exist or has been moved.
          Let’s get you back on track.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">

          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-black transition"
          >
            <RiArrowLeftLine size={16} />
            Go Back
          </button>

          <Link
            to="/"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-black hover:bg-gray-800 transition"
          >
            <RiHome4Line size={16} />
            Back to Home
          </Link>

        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;