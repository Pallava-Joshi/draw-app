import { useEffect, useRef, useState } from "react";
import { Game } from "@/app/draw/Game";
import { Tool, ShapeWithId } from "@/app/draw/type";
import useWindowSize from "@/hooks/useWindowSize";
import {
  RectangleHorizontal,
  Circle,
  Minus,
  PenIcon,
  Hand,
  Eraser,
  MousePointer,
  Triangle,
  Type,
} from "lucide-react";

interface CanvasProps {
  roomId: string;
  socket: WebSocket;
}

export default function Canvas({ roomId, socket }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width, height } = useWindowSize();
  const [game, setGame] = useState<Game | undefined>(undefined);
  const [selectedTool, setSelectedTool] = useState<Tool>("select");
  const [selectedShape, setSelectedShape] = useState<ShapeWithId | null>(null);

  useEffect(() => {
    if (game) {
      game.setTool(selectedTool);
      game.setSelectedShapeCallback((shape: ShapeWithId | null) => {
        setSelectedShape(shape);
      });
    }
  }, [selectedTool, game]);

  useEffect(() => {
    if (canvasRef.current) {
      const g = new Game(canvasRef.current, roomId, socket);
      setGame(g);
      return () => {
        g.destroy();
      };
    }
  }, [canvasRef, roomId, socket]);

  const getCursorStyle = (): string => {
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
      case "text":
        return "cursor-crosshair";
      default:
        return "cursor-default";
    }
  };

  const handleColorChange = (color: string): void => {
    if (selectedShape) {
      selectedShape.shape.color = color;
      game?.updateShape(selectedShape);
    }
  };

  const handleFontSizeChange = (fontSize: number): void => {
    if (selectedShape && selectedShape.shape.type === "text") {
      selectedShape.shape.fontSize = fontSize;
      game?.updateShape(selectedShape);
    }
  };

  const handleEditText = (): void => {
    if (selectedShape && selectedShape.shape.type === "text") {
      game?.editText(selectedShape);
    }
  };

  return (
    <div className="relative">
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
              ? "bg-zinc-600 text-red-400 p-2 rounded-xl cursor-pointer"
              : "hover:bg-zinc-600 p-2 rounded-xl cursor-pointer"
          }
        >
          <Hand />
        </button>
        <button
          onClick={() => setSelectedTool("select")}
          className={
            selectedTool === "select"
              ? "bg-zinc-600 text-red-400 p-2 rounded-xl cursor-pointer"
              : "hover:bg-zinc-600 p-2 rounded-xl cursor-pointer"
          }
        >
          <MousePointer />
        </button>
        <button
          onClick={() => setSelectedTool("eraser")}
          className={
            selectedTool === "eraser"
              ? "bg-zinc-600 text-red-400 p-2 rounded-xl cursor-pointer"
              : "hover:bg-zinc-600 p-2 rounded-xl cursor-pointer"
          }
        >
          <Eraser />
        </button>
        <button
          onClick={() => setSelectedTool("rectangle")}
          className={
            selectedTool === "rectangle"
              ? "bg-zinc-600 text-red-400 p-2 rounded-xl cursor-pointer"
              : "hover:bg-zinc-600 p-2 rounded-xl cursor-pointer"
          }
        >
          <RectangleHorizontal />
        </button>
        <button
          onClick={() => setSelectedTool("circle")}
          className={
            selectedTool === "circle"
              ? "bg-zinc-600 text-red-400 p-2 rounded-xl cursor-pointer"
              : "hover:bg-zinc-600 p-2 rounded-xl cursor-pointer"
          }
        >
          <Circle />
        </button>
        <button
          onClick={() => setSelectedTool("line")}
          className={
            selectedTool === "line"
              ? "bg-zinc-600 text-red-400 p-2 rounded-xl cursor-pointer"
              : "hover:bg-zinc-600 p-2 rounded-xl cursor-pointer"
          }
        >
          <Minus />
        </button>
        <button
          onClick={() => setSelectedTool("pencil")}
          className={
            selectedTool === "pencil"
              ? "bg-zinc-600 text-red-400 p-2 rounded-xl cursor-pointer"
              : "hover:bg-zinc-600 p-2 rounded-xl cursor-pointer"
          }
        >
          <PenIcon />
        </button>
        <button
          onClick={() => setSelectedTool("triangle")}
          className={
            selectedTool === "triangle"
              ? "bg-zinc-600 text-red-400 p-2 rounded-xl cursor-pointer"
              : "hover:bg-zinc-600 p-2 rounded-xl cursor-pointer"
          }
        >
          <Triangle />
        </button>
        <button
          onClick={() => setSelectedTool("text")}
          className={
            selectedTool === "text"
              ? "bg-zinc-600 text-red-400 p-2 rounded-xl cursor-pointer"
              : "hover:bg-zinc-600 p-2 rounded-xl cursor-pointer"
          }
        >
          <Type />
        </button>
        {/* <button
          onClick={() => game?.resetView()}
          className="hover:bg-zinc-600 p-2 rounded-xl cursor-pointer"
        >
          Reset View
        </button> */}
        <button
          onClick={() => game?.centerView()}
          className="hover:bg-zinc-600 p-2 rounded-xl cursor-pointer"
        >
          Center View
        </button>
      </div>
      {selectedShape && (
        <div className="absolute top-0 left-0 w-64 bg-white p-4 shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Properties</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Stroke Color
            </label>
            <div className="flex gap-2 mt-1">
              {[
                "#000000",
                "#FF0000",
                "#00FF00",
                "#0000FF",
                "#FFFF00",
                "#FF00FF",
                "#00FFFF",
                "#FFFFFF",
              ].map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded-full border border-gray-300"
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                />
              ))}
            </div>
          </div>
          {selectedShape.shape.type === "text" && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Font Size
                </label>
                <input
                  type="number"
                  min="12"
                  value={selectedShape.shape.fontSize}
                  onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-1"
                />
              </div>
              <button
                onClick={handleEditText}
                className="bg-blue-500 text-white px-4 py-2 rounded-md"
              >
                Edit Text
              </button>
            </>
          )}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">
              Opacity
            </label>
            <input type="range" min="0" max="100" className="w-full" disabled />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">
              Layers
            </label>
            <div className="flex gap-2">
              <button className="p-2 bg-gray-200 rounded-md" disabled>
                ↑
              </button>
              <button className="p-2 bg-gray-200 rounded-md" disabled>
                ↓
              </button>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">
              Actions
            </label>
            <div className="flex gap-2">
              <button className="p-2 bg-gray-200 rounded-md" disabled>
                Copy
              </button>
              <button className="p-2 bg-gray-200 rounded-md" disabled>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
