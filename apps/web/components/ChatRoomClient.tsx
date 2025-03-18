"use client"
import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";
export default function ChatRoomClient({
    messages,
    id
}:{
    messages: {message:string}[];
    id: string;
}) {
    const [chats, setChats] = useState(messages);
    const {socket, loading} = useSocket();
    const [currentMessage, setCurrentMessage] = useState("");
    useEffect(()=>{
        if( socket && !loading){
            //use seperate hook (useEffect) for this
            alert("Joined room");
            socket.send(JSON.stringify({
                type: "join_room",
                roomId: id
            }));

            socket.onmessage = (event)=>{
                const parsedData = JSON.parse(event.data);
                if(parsedData.type === "chat"){
                    setChats(prev => [...prev, parsedData]);
                }
            }
        }
    },[socket, loading, id])
    return (
        <div>
            <h1>Chat Room Client</h1>
            {chats.map((chat, index) => (
                <div key={index}>
                    {chat.message}
                </div>
            ))}
            <input type="text" placeholder="Message" value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} />
            <button onClick={() => {
                if (socket && !loading) {
                    socket.send(JSON.stringify({
                        type: "chat",
                        message: currentMessage,
                        roomId: id
                    }));
                    setCurrentMessage("");
                }
            }}>Send</button>
        </div>
    )
}
