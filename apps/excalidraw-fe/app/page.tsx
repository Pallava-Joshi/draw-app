// app/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FaPaintBrush, FaChalkboard, FaUsers } from "react-icons/fa";
import { motion } from "framer-motion";
import { LandingGame, Tool } from "./draw/LandingGame";
import {
  RectangleHorizontal,
  Circle,
  PenIcon,
  Hand,
  Eraser,
  MousePointer,
  Triangle,
} from "lucide-react";
import useWindowSize from "@/hooks/useWindowSize";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width, height } = useWindowSize();
  const [game, setGame] = useState<LandingGame>();
  const [selectedTool, setSelectedTool] = useState<Tool>("select");
  const [selectedColor, setSelectedColor] = useState("#FFFFFF");

  useEffect(() => {
    if (game) {
      game.setTool(selectedTool);
      game.setColor(selectedColor);
    }
  }, [selectedTool, selectedColor, game]);

  useEffect(() => {
    if (canvasRef.current) {
      const g = new LandingGame(canvasRef.current);
      setGame(g);
      return () => {
        g.destroy();
      };
    }
  }, []);

  const handleSignIn = () => {
    setLoading(true);
    router.push("/signin");
  };

  const handleSignUp = () => {
    setLoading(true);
    router.push("/signup");
  };

  const getCursorStyle = () => {
    switch (selectedTool) {
      case "hand":
        return "cursor-grab";
      case "select":
        return "cursor-move";
      case "eraser":
      case "rectangle":
      case "circle":
      case "line":
      case "pencil":
      case "triangle":
        return "cursor-crosshair";
      default:
        return "cursor-default";
    }
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

      <div className="w-full h-full absolute top-0 left-0">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className={getCursorStyle()}
        />
        <div className="absolute flex m-2 top-0 left-1/4 gap-1 border-1 border-gray-400 rounded-2xl p-2 text-white">
          <button
            onClick={() => setSelectedTool("hand")}
            className={
              selectedTool === "hand"
                ? "bg-zinc-600 text-red-400 p-2 rounded-xl"
                : "hover:bg-zinc-600 p-2 rounded-xl"
            }
          >
            <Hand />
          </button>
          <button
            onClick={() => setSelectedTool("select")}
            className={
              selectedTool === "select"
                ? "bg-zinc-600 text-red-400 p-2 rounded-xl"
                : "hover:bg-zinc-600 p-2 rounded-xl"
            }
          >
            <MousePointer />
          </button>
          <button
            onClick={() => setSelectedTool("eraser")}
            className={
              selectedTool === "eraser"
                ? "bg-zinc-600 text-red-400 p-2 rounded-xl"
                : "hover:bg-zinc-600 p-2 rounded-xl"
            }
          >
            <Eraser />
          </button>
          <button
            onClick={() => setSelectedTool("rectangle")}
            className={
              selectedTool === "rectangle"
                ? "bg-zinc-600 text-red-400 p-2 rounded-xl"
                : "hover:bg-zinc-600 p-2 rounded-xl"
            }
          >
            <RectangleHorizontal />
          </button>
          <button
            onClick={() => setSelectedTool("circle")}
            className={
              selectedTool === "circle"
                ? "bg-zinc-600 text-red-400 p-2 rounded-xl"
                : "hover:bg-zinc-600 p-2 rounded-xl"
            }
          >
            <Circle />
          </button>
          <button
            onClick={() => setSelectedTool("line")}
            className={
              selectedTool === "line"
                ? "bg-zinc-600 text-red-400 p-2 rounded-xl"
                : "hover:bg-zinc-600 p-2 rounded-xl"
            }
          >
            <PenIcon />
          </button>
          <button
            onClick={() => setSelectedTool("pencil")}
            className={
              selectedTool === "pencil"
                ? "bg-zinc-600 text-red-400 p-2 rounded-xl"
                : "hover:bg-zinc-600 p-2 rounded-xl"
            }
          >
            <PenIcon />
          </button>
          <button
            onClick={() => setSelectedTool("triangle")}
            className={
              selectedTool === "triangle"
                ? "bg-zinc-600 text-red-400 p-2 rounded-xl"
                : "hover:bg-zinc-600 p-2 rounded-xl"
            }
          >
            <Triangle />
          </button>
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            className="w-8 h-8"
          />
          <button
            onClick={() => game?.resetView()}
            className="hover:bg-zinc-600 p-2 rounded-xl"
          >
            Reset View
          </button>
          <button
            onClick={() => game?.centerView()}
            className="hover:bg-zinc-600 p-2 rounded-xl"
          >
            Center View
          </button>
        </div>
      </div>

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
          Unleash your creativity and connect with friends in real-time! Try
          drawing above.
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
