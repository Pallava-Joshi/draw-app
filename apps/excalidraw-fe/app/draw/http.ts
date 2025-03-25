import axios from "axios";
import { HTTP_BACKEND } from "@/config";

async function getExistingShapes(roomId: string) {
    const response = await axios.get(`${HTTP_BACKEND}/chats/${roomId}`);
    const messages = response.data;

    const shapesWithId = messages.map((x: { id: number; message: string }) => {
        const messageData = JSON.parse(x.message);
        return {
            id: x.id, // The database ID of the chat message
            shape: messageData.shape
        };
    });
    return shapesWithId;
}
export default getExistingShapes;