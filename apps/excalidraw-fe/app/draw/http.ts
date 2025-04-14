// app/draw/http.ts
import axios from "axios";
import { HTTP_BACKEND } from "@/config";

export async function getExistingShapes(roomId: string) {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No token found");
  }

  try {
    const res = await axios.get(`${HTTP_BACKEND}/chats/${roomId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const messages = res.data.messages;
    let shapes = messages.map((x: { message: string }) => {
      const messageData = JSON.parse(x.message);
      const shape = messageData.shape;
      return {
        id: messageData.id,
        clientId: shape.clientId,
        shape,
      };
    });

    try {
      const movementsRes = await axios.get(
        `${HTTP_BACKEND}/shapeMovements/${roomId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const movements = movementsRes.data.movements;
      if (movements && movements.length > 0) {
        movements.forEach((movement: any) => {
          const shapeIndex = movement.shapeIndex;
          if (shapes[shapeIndex]) {
            shapes[shapeIndex].shape = JSON.parse(movement.shapeData);
          }
        });
      }
    } catch (error) {
      console.error("Error fetching shape movements:", error);
    }

    return shapes;
  } catch (error) {
    console.error("Error fetching shapes:", error);
    return [];
  }
}
