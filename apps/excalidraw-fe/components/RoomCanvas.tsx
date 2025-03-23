"use client"
import { useEffect, useState } from "react"
import { WS_BACKEND } from "@/config";
import Canvas from "./Canvas";
import CurrentShape from "@/currentShape";

export default function RoomCanvas({roomId}: {roomId: string}){
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [currentShape, setCurrentShape] = useState<CurrentShape>("rectangle");

    useEffect(()=>{
        const ws = new WebSocket(`${WS_BACKEND}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiOWNlMTU2ZC1jODM2LTQxYjctOWQzNS1hODA1YmJhYmJiMzAiLCJpYXQiOjE3NDIxNzU4OTN9.sg8BewVATN_L61YR3G0mvirZlPNbdMoW0KwnCxUFbIY`);
        ws.onopen = () => {
            setSocket(ws);
            ws.send(JSON.stringify({
                type: "join_room",
                roomId
            }))
        }
    }, [])

    if(!socket)
        return <div>Loading...</div>;
    
    return <div>
            <Canvas roomId={roomId} socket={socket} currentShape={currentShape}/>
            <div className="absolute bottom-0 right-0">
            <button 
                onClick={() => setCurrentShape("rectangle")} 
                className="bg-white text-black"
            >
                Rectangle
            </button>
            <button 
                onClick={() => setCurrentShape("circle")} 
                className="bg-white text-black"
            >
                Circle
            </button>
            <button 
                onClick={() => setCurrentShape("line")} 
                className="bg-white text-black"
            >
                Line
            </button>
            </div>
        </div>
}