
import axios from "axios";
import { HTTP_BACKEND } from "@/config";
import CurrentShape from "@/currentShape";

type Shape = {
    type: "rectangle";
    x: number;
    y: number;
    width: number;
    height: number;
} | {
    type: "circle";
    x: number;
    y: number;
    radius: number;
} | {
    type: "line";
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export async function drawinit(roomId:string, canvas: HTMLCanvasElement, socket: WebSocket, currentShape: CurrentShape) {
    const ctx = canvas.getContext('2d');
    if(!ctx){
        return;
    }
    
    let existingShapes: Shape[] = await getExistingShapes(roomId);
    clearCanvas(existingShapes, canvas, ctx);
    
    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if(message.type === "chat") {
            const parsedShape = JSON.parse(message.message);
            existingShapes.push(parsedShape.shape);
            clearCanvas(existingShapes, canvas, ctx);
        }
    }
    
    let clicked = false;
    let startX = 0;
    let startY = 0;

    canvas.addEventListener("mousedown", (e) => {
        clicked = true;
        startX = e.clientX;
        startY = e.clientY;
    // console.log(currentShape);

    })
    canvas.addEventListener("mousemove", (e) => {
        if(!clicked){
            return;
        }
        const width = e.clientX - startX;
        const height = e.clientY - startY;
    
        clearCanvas(existingShapes, canvas, ctx);
       
        ctx.strokeStyle = "white";
        console.log(currentShape);
        switch (currentShape) {
            case "rectangle":
                ctx.strokeRect(startX, startY, width, height);
                break;
            case "circle":
                ctx.beginPath();
                ctx.arc(startX + width / 2, startY + height / 2, Math.sqrt((width * width + height * height) / 4), 0, Math.PI * 2);
                ctx.stroke();
                break;
            case "line":
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(e.clientX, e.clientY);
                ctx.stroke();
                break;
        }
    })
    canvas.addEventListener("mouseup", (e) => {
        clicked = false;
        // console.log(e.clientX, e.clientY);
        const width = e.clientX - startX;
        const height = e.clientY - startY;
        
        let shape: Shape;
        switch (currentShape) {
        case "rectangle":
            shape = {
                type: "rectangle",
                x: startX,
                y: startY,
                width,
                height
            };
            break;
        case "circle":
            shape = {
                type: "circle",
                x: startX + width / 2,
                y: startY + height / 2,
                radius: Math.sqrt((width * width + height * height) / 4)
            };
            break;
        case "line":
            shape = {
                type: "line",
                x1: startX,
                y1: startY,
                x2: e.clientX,
                y2: e.clientY
            };
            break;
    }
        existingShapes.push(shape);
        console.log(existingShapes);
    //     clearCanvas(existingShapes, canvas, ctx);
        socket.send(JSON.stringify({
            type: "chat",
            message: JSON.stringify({shape}),
            roomId
        }))
    })
    //add more shapes and send it through multiplayer socket server
   
}

function clearCanvas(existingShapes: Shape[], canvas: HTMLCanvasElement,ctx: CanvasRenderingContext2D ) {
    
    ctx.clearRect(0,0,canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0,0,canvas.width, canvas.height)
    existingShapes.forEach(shape => {
        if(shape.type === "rectangle") {
            ctx.strokeStyle = "white";
            ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        }
        if(shape.type === "circle") {
            ctx.strokeStyle = "white";
            ctx.beginPath();
            ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        if(shape.type === "line") {
            ctx.strokeStyle = "white";
            ctx.beginPath();
            ctx.moveTo(shape.x1, shape.y1);
            ctx.lineTo(shape.x2, shape.y2);
            ctx.stroke();
        }
    })
}

async function getExistingShapes(roomId:string) {
        const response = await axios.get(`${HTTP_BACKEND}/chats/${roomId}`)
        const messages = response.data;

        const shapes = messages.map((x :{message: string}) => {
            const messageData = JSON.parse(x.message);
            return messageData.shape;
        });
        return shapes;
}