import axios from "axios";
import { HTTP_BACKEND } from "@/config";

async function getExistingShapes(roomId:string) {
    const response = await axios.get(`${HTTP_BACKEND}/chats/${roomId}`)
    const messages = response.data;

    const shapes = messages.map((x :{message: string}) => {
        const messageData = JSON.parse(x.message);
        return messageData.shape;
    });
    return shapes;
}
export default getExistingShapes;