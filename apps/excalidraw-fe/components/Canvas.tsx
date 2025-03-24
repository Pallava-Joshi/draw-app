import { useEffect, useRef, useState } from "react";
import { Game } from "@/app/draw/Game";
import { Tool } from "@/app/draw/type";
import useWindowSize from "@/hooks/useWindowSize";
import { RectangleHorizontal, Circle, PenIcon } from 'lucide-react';

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

    return <>
        <canvas ref={canvasRef} width={width} height={height}/>

        <div className="absolute flex m-2 top-0 left-2/4 gap-1 border-1 border-gray-400 rounded-2xl p-2 text-white">
        <button 
            onClick={() => setSelectedTool("rectangle")}
            className={selectedTool === "rectangle" ? "bg-zinc-600 text-red-400 p-2 rounded-xl" : "hover:bg-zinc-600 p-2 rounded-xl "}
        >
            <RectangleHorizontal />
        </button>
        <button 
            onClick={() => setSelectedTool("circle")}
            className={selectedTool === "circle" ? "bg-zinc-600 text-red-400 p-2 rounded-xl" : "hover:bg-zinc-600 p-2 rounded-xl"}
        >
            <Circle />
        </button>
        <button 
            onClick={() => setSelectedTool("line")}
            className={selectedTool === "line" ? "bg-zinc-600 text-red-400 p-2 rounded-xl" : "hover:bg-zinc-600 p-2 rounded-xl"}
        >
            <PenIcon />
        </button>
        </div>
    </>

}

