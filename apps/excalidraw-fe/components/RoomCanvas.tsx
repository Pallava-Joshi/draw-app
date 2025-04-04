"use client";

import { useEffect, useState } from "react";
import { WS_BACKEND } from "@/config";
import Canvas from "./Canvas";
import { useRouter } from "next/navigation";

export default function RoomCanvas({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/signin");
      return;
    }

    const ws = new WebSocket(`${WS_BACKEND}?token=${token}`);
    ws.onopen = () => {
      setSocket(ws);
      ws.send(
        JSON.stringify({
          type: "join_room",
          roomId,
        })
      );
    };

    // Clean up WebSocket connection on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [roomId, router]);

  const handleLeaveRoom = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
    setSocket(null);
    router.push("/lobby");
  };

  if (!socket) return <div>Loading...</div>;

  return (
    <div className="relative">
      <Canvas roomId={roomId} socket={socket} />
      <button
        onClick={handleLeaveRoom}
        className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
      >
        Leave Room
      </button>
    </div>
  );
}