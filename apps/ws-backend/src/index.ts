import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { parse } from "url";
import { prismaClient } from "@repo/db/client";

interface User {
  userId : string,
  rooms: string[],
  ws : WebSocket
}

const wss = new WebSocketServer({ port: 8080 });
let users : User[] = [];

function checkUser(token: string):string | null {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log(decoded);
  
  if (typeof decoded == 'string') 
    return null;
  
  if(!decoded || !decoded.userId) 
    return null;
  return decoded.userId;
}

wss.on("connection", function connection(ws: WebSocket, request) {
  const url = request.url || "";
  if (!url) return;

  const parsedToken = parse(url, true).query.token;
  const token = typeof parsedToken === 'string' ? parsedToken : '';
  console.log(token);

  const userId = checkUser(token);
  if (userId == null) {
    ws.close();
    return;
  }

  users.push({userId, rooms: [], ws})
  console.log(users);
  

  ws.on("message", async function message(data) {
    try {
      const parsedData = JSON.parse(data as unknown as string);
      if (parsedData.type === "join_room") {
        const user = users.find(x => x.ws === ws)
        user?.rooms.push(parsedData.roomId);
      }
    
      if(parsedData.type === "leave_room") {
        const user = users.find(x => x.ws === ws)
        if(!user) return;
        user.rooms = user?.rooms.filter(x => x !== parsedData.roomId);
      }

      if(parsedData.type === "chat") {
        const roomId = parsedData.roomId;
        const message = parsedData.message;

        if(!roomId || !message){
          ws.send(JSON.stringify({ type: "error", message: "Invalid inputs" }));
          return;
        }
  //ideal approach is to push it to a queue - pipeline queue (check chess video)
          await prismaClient.chat.create({
            data: {
              roomId,
              userId,
              message
            }
          })

          users.forEach(user=>{
            if(user.rooms.includes(roomId)) {
              user.ws.send(JSON.stringify({
                type: "chat",
                message,
                roomId
              }))
            }
          })
      }
    } catch (e) {
      console.error("Error processing message:", e);
      ws.send(JSON.stringify({ type: "error", message: "Failed to process message" }));
    }
  });
});
