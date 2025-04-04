"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FaUsers } from "react-icons/fa";
import { useState } from "react";

interface RoomCardProps {
  roomId: number; // Add roomId prop
  slug: string;
  adminName: string;
}

export function RoomCard({ roomId, slug, adminName }: RoomCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleJoin = () => {
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/signin");
      return;
    }

    // Redirect directly to /canvas/[roomId]
    router.push(`/canvas/${roomId}`);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="bg-gray-800 p-4 rounded-lg shadow-lg cursor-pointer"
      onClick={handleJoin}
    >
      <div className="flex items-center gap-3">
        <FaUsers className="text-blue-500" size={24} />
        <div>
          <h3 className="text-lg font-semibold text-white">{slug}</h3>
          <p className="text-gray-400 text-sm">Created by: {adminName}</p>
          {loading && <p className="text-gray-400 text-sm">Loading...</p>}
        </div>
      </div>
    </motion.div>
  );
}