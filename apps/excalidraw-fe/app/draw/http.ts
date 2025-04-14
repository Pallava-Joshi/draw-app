import axios from "axios";
import { HTTP_BACKEND } from "@/config";
import { ShapeWithId } from "./type";

export async function getExistingShapes(
  roomId: string
): Promise<ShapeWithId[]> {
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

    const messages = res.data;
    const shapes: ShapeWithId[] = messages
      .map((x: { id: number; message: string }) => {
        try {
          const messageData = JSON.parse(x.message);
          const shape = messageData.shape;
          if (!shape) return null;
          return {
            id: x.id,
            clientId: shape.clientId ?? `${x.id}-${Date.now()}`, // Provide a fallback clientId
            shape,
          };
        } catch (error) {
          console.error("Error parsing message:", x.message, error);
          return null;
        }
      })
      .filter((shape: ShapeWithId | null) => shape !== null);

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
        movements.forEach(
          (movement: { shapeId: number; shapeData: string }) => {
            const shapeIndex = shapes.findIndex(
              (s: ShapeWithId) => s.id === movement.shapeId
            );
            if (shapeIndex !== -1) {
              shapes[shapeIndex].shape = JSON.parse(movement.shapeData);
            }
          }
        );
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
