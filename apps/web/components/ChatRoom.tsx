import axios from "axios";
import { BACKEND_URL } from "../app/config";
import ChatRoomClient from "./ChatRoomClient";

async function getChats(roomId: string) {
    const response = await axios.get(`${BACKEND_URL}/chats/${roomId}`);
    return response.data;
}

export default async function ChatRoom({id}: {id: string}) {
    const messages = await getChats(id);
    return (
        <div>
            <ChatRoomClient messages={messages} id={id} />
            <h1>Chat Room</h1>
        </div>
    )
}