import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { parse } from "url";
import { prismaClient } from "@repo/db/client";

interface User {
  userId: string;
  rooms: string[];
  ws: WebSocket;
}

const wss = new WebSocketServer({ port: Number(process.env.PORT) || 8080 });
let users: User[] = [];

function checkUser(token: string): string | null {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log(decoded);

  if (typeof decoded == "string") return null;

  if (!decoded || !decoded.userId) return null;
  return decoded.userId;
}

wss.on("connection", function connection(ws: WebSocket, request) {
  // Check the Origin header
  //   const origin = request.headers.origin;
  //   const allowedOrigin = "http://localhost:3000";

  //   if (origin !== allowedOrigin) {
  //     console.log(`Connection rejected: Origin ${origin} not allowed`);
  //     ws.close(1008, "Origin not allowed");
  //     return;
  //   }

  const url = request.url || "";
  if (!url) {
    ws.close();
    return;
  }

  const parsedToken = parse(url, true).query.token;
  const token = typeof parsedToken === "string" ? parsedToken : "";
  console.log(token);

  const userId = checkUser(token);
  if (userId == null) {
    ws.close();
    return;
  }

  users.push({ userId, rooms: [], ws });
  console.log(users);

  ws.on("message", async function message(data) {
    try {
      const parsedData =
        typeof data === "string"
          ? JSON.parse(data)
          : JSON.parse(data.toString());

      if (parsedData.type === "join_room") {
        const user = users.find((x) => x.ws === ws);
        user?.rooms.push(parsedData.roomId);
      }

      if (parsedData.type === "leave_room") {
        const user = users.find((x) => x.ws === ws);
        if (!user) return;
        user.rooms = user.rooms.filter((x) => x !== parsedData.roomId);
      }

      if (parsedData.type === "chat") {
        const roomId = parsedData.roomId;
        const message = parsedData.message;
        const parsedMessage = JSON.parse(message);

        if (!roomId || !message) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Invalid inputs",
            })
          );
          return;
        }

        if (parsedMessage.action === "update") {
          await prismaClient.chat.update({
            where: {
              id: parsedMessage.id,
            },
            data: {
              message: JSON.stringify({
                shape: parsedMessage.shape,
              }),
            },
          });

          users.forEach((user) => {
            if (user.ws !== ws && user.rooms.includes(roomId)) {
              user.ws.send(
                JSON.stringify({
                  type: "chat",
                  message: JSON.stringify({
                    shape: parsedMessage.shape,
                    id: parsedMessage.id,
                    action: "update",
                  }),
                  roomId,
                })
              );
            }
          });
        } else if (parsedMessage.action === "delete") {
          await prismaClient.chat.delete({
            where: {
              id: parsedMessage.id,
            },
          });

          users.forEach((user) => {
            if (user.ws !== ws && user.rooms.includes(roomId)) {
              user.ws.send(
                JSON.stringify({
                  type: "chat",
                  message: JSON.stringify({
                    id: parsedMessage.id,
                    action: "delete",
                  }),
                  roomId,
                })
              );
            }
          });
        } else {
          const chat = await prismaClient.chat.create({
            data: {
              roomId: Number(roomId),
              userId,
              message: JSON.stringify({
                shape: parsedMessage.shape,
              }),
            },
          });

          users.forEach((user) => {
            if (user.ws !== ws && user.rooms.includes(roomId)) {
              user.ws.send(
                JSON.stringify({
                  type: "chat",
                  message: JSON.stringify({
                    shape: parsedMessage.shape,
                    id: chat.id,
                    action: "create",
                  }),
                  roomId,
                })
              );
            }
          });
        }
      }
    } catch (e) {
      console.error("Error processing message:", e);
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Failed to process message",
        })
      );
    }
  });

  ws.on("close", () => {
    users = users.filter((user) => user.ws !== ws);
    console.log("User disconnected, remaining users:", users);
  });
});
