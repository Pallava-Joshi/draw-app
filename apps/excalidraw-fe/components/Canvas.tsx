import { useEffect, useRef } from "react";
import { drawinit } from "@/app/draw";
import CurrentShape from "@/currentShape";
import useWindowSize from "@/hooks/useWindowSize";

export default function Canvas({roomId, socket, currentShape}:{roomId: string, socket: WebSocket, currentShape: CurrentShape}){
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const {width, height} = useWindowSize();

    useEffect(() => {
        if(canvasRef.current){
            drawinit(roomId, canvasRef.current, socket, currentShape);
        } 
    },[canvasRef, currentShape])
    return <canvas ref={canvasRef} width={width} height={height}></canvas>

}