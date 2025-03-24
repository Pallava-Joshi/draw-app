"use client"
import { useEffect, useState } from "react"
import { WS_BACKEND } from "@/config";
import Canvas from "./Canvas";

export default function RoomCanvas({roomId}: {roomId: string}){
    const [socket, setSocket] = useState<WebSocket | null>(null);

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
            <Canvas roomId={roomId} socket={socket} />      
        </div>
}