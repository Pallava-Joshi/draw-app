import { WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", function connection(ws, request) {
  const url = request.url;
  if (!url) return;

  const queryParam = new URLSearchParams(url.split("?")[1]);
  const token = queryParam.get("token") || "";

  const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
  if (!(decoded as JwtPayload).userId || !decoded) {
    ws.close();
    return;
  }

  ws.on("message", function message(data) {
    ws.send("something");
  });
});
