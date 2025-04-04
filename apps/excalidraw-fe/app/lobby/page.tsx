"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RoomCard } from "@/components/RoomCard";
import { FaPlus, FaSignOutAlt } from "react-icons/fa";
import { HTTP_BACKEND } from "../../config";

interface Room {
  id: number;
  slug: string;
  admin: { name: string };
}

export default function Lobby() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/signin");
      return;
    }

    const fetchRooms = async () => {
      try {
        const response = await fetch(`${HTTP_BACKEND}/rooms`, {
          headers: {
            Authorization: token,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch rooms");
        }

        const data = await response.json();
        setRooms(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [router]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError("");

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${HTTP_BACKEND}/room`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token || "",
        },
        body: JSON.stringify({ name: newRoomName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create room");
      }

      const updatedRoomsResponse = await fetch(`${HTTP_BACKEND}/rooms`, {
        headers: {
          Authorization: token || "",
        },
      });
      const updatedRooms = await updatedRoomsResponse.json();
      setRooms(updatedRooms);

      setShowCreateModal(false);
      setNewRoomName("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Lobby</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition"
          >
            <FaPlus size={20} />
          </button>
          <button
            onClick={handleSignOut}
            className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition"
          >
            <FaSignOutAlt size={20} />
          </button>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-sm">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">
              Create a Room
            </h2>
            {createError && (
              <p className="text-red-500 mb-4 text-center">{createError}</p>
            )}
            <form onSubmit={handleCreateRoom}>
              <div className="mb-4">
                <label
                  className="block text-gray-400 mb-2"
                  htmlFor="roomName"
                >
                  Room Name
                </label>
                <input
                  type="text"
                  id="roomName"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                >
                  {createLoading ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      {rooms.length === 0 ? (
        <p className="text-center text-gray-400">
          No rooms available. Create one to get started!
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              roomId={room.id}
              slug={room.slug}
              adminName={room.admin.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}