import { useEffect, useRef, useState } from "react";
import { Game } from "@/app/draw/Game";
import { Tool } from "@/app/draw/type";
import useWindowSize from "@/hooks/useWindowSize";
import { RectangleHorizontal, Circle, PenIcon, Hand, Eraser, MousePointer } from 'lucide-react';

export default function Canvas({roomId, socket}:{roomId: string, socket: WebSocket}){
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const {width, height} = useWindowSize();
    const [game, setGame] = useState<Game>();
    const [selectedTool, setSelectedTool] = useState<Tool>("circle");

    useEffect(()=>{
        if(game)
            game?.setTool(selectedTool);
    },[selectedTool, game])

    useEffect(() => {
        if(canvasRef.current){
            const g = new Game(canvasRef.current, roomId, socket);
            setGame(g);
            return ()=>{
                g.destroy();
            }
        } 
    },[canvasRef])

    const getCursorStyle = () => {
        switch (selectedTool) {
          case 'hand':
            return 'cursor-';
          case 'select':
            return 'cursor-move'; 
          default:
            return 'cursor-crosshair'; 
        }
      };

    return <>
        <canvas ref={canvasRef} width={width} height={height} className={getCursorStyle()}/>

        <div className="absolute flex m-2 top-0 left-2/4 gap-1 border-1 border-gray-400 rounded-2xl p-2 text-white">
        <button 
            onClick={() => setSelectedTool("hand")}
            className={selectedTool === "hand" ? "bg-zinc-600 text-red-400 p-2 rounded-xl cursor-pointer" : "hover:bg-zinc-600 p-2 rounded-xl cursor-pointer"}
        >
            <Hand />
        </button>
        <button 
            onClick={() => setSelectedTool("select")}
            className={selectedTool === "select" ? "bg-zinc-600 text-red-400 p-2 rounded-xl cursor-pointer" : "hover:bg-zinc-600 p-2 rounded-xl cursor-pointer"}
        >
            <MousePointer/>
        </button>
        <button 
            onClick={() => setSelectedTool("eraser")}
            className={selectedTool === "eraser" ? "bg-zinc-600 text-red-400 p-2 rounded-xl cursor-pointer" : "hover:bg-zinc-600 p-2 rounded-xl cursor-pointer"}
        >
            <Eraser />
        </button>
        <button 
            onClick={() => setSelectedTool("rectangle")}
            className={selectedTool === "rectangle" ? "bg-zinc-600 text-red-400 p-2 rounded-xl cursor-pointer" : "hover:bg-zinc-600 p-2 rounded-xl cursor-pointer"}
        >
            <RectangleHorizontal />
        </button>
        <button 
            onClick={() => setSelectedTool("circle")}
            className={selectedTool === "circle" ? "bg-zinc-600 text-red-400 p-2 rounded-xl cursor-pointer" : "hover:bg-zinc-600 p-2 rounded-xl cursor-pointer"}
        >
            <Circle />
        </button>
        <button 
            onClick={() => setSelectedTool("line")}
            className={selectedTool === "line" ? "bg-zinc-600 text-red-400 p-2 rounded-xl cursor-pointer" : "hover:bg-zinc-600 p-2 rounded-xl cursor-pointer"}
        >
            <PenIcon />
        </button>
        </div>
    </>

}

