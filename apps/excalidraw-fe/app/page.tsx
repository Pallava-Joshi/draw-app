"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaPaintBrush, FaChalkboard, FaUsers } from "react-icons/fa";
import { motion } from "framer-motion";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignIn = () => {
    setLoading(true);
    router.push("/signin");
  };

  const handleSignUp = () => {
    setLoading(true);
    router.push("/signup");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white relative overflow-hidden">
      <motion.div
        className="absolute top-10 left-10 text-blue-500 opacity-30"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <FaChalkboard size={100} />
      </motion.div>
      <motion.div
        className="absolute bottom-20 right-20 text-blue-500 opacity-30"
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <FaPaintBrush size={80} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-center z-10"
      >
        <h1 className="text-5xl font-bold mb-4 flex items-center justify-center gap-3">
          <FaUsers className="text-blue-500" /> Draw & Chat
        </h1>
        <p className="text-gray-400 mb-8 text-lg">
          Unleash your creativity and connect with friends in real-time!
        </p>
        <div className="space-x-4">
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="px-6 py-3 bg-blue-500 text-white rounded-3xl hover:bg-blue-600 transition disabled:opacity-50"
          >
            {loading ? "Loading..." : "Sign In"}
          </button>
          <button
            onClick={handleSignUp}
            disabled={loading}
            className="px-6 py-3 bg-gray-700 text-white rounded-3xl hover:bg-gray-600 transition disabled:opacity-50"
          >
            {loading ? "Loading..." : "Sign Up"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}