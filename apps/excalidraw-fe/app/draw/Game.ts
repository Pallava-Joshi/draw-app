import getExistingShapes from "./http";
import { Shape, Tool } from "./type";


export class Game{
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D
    private existingShapes: Shape[] = [];
    private roomId: string;
    private clicked: boolean = false;
    private startX: number = 0;
    private startY: number = 0;
    private selectedTool: Tool | null = null;

    private selectedShape: Shape | null = null; // Track the currently selected shape for dragging
    private isDragging: boolean = false; // Track if we're in dragging mode


    socket: WebSocket;

    constructor(canvas: HTMLCanvasElement, roomId: string, socket:WebSocket){
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.roomId = roomId;
        this.socket = socket;
        this.init();
        this.initHandlers();
        this.initMouseHandler();
    }
    setTool(tool: Tool){
        this.selectedTool = tool;
    }
    
    async init(){
        this.existingShapes = await getExistingShapes(this.roomId);
        this.clearCanvas();
    }

    destroy(){
        this.canvas.removeEventListener("mousedown", this.initMouseHandler);
        this.canvas.removeEventListener("mousemove", this.initMouseHandler);
        this.canvas.removeEventListener("mouseup", this.initMouseHandler);
    }

    initHandlers(){
        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            
            if(message.type === "chat") {
                const parsedShape = JSON.parse(message.message);
                this.existingShapes.push(parsedShape.shape);
                this.clearCanvas();
            }
        }
    }

    renderShapes(){
        this.existingShapes.forEach((shape,index) => {
            console.log("Clear canvas called, shape type pushed into db:", shape.type, "with index:", index)
            if(shape.type === "rectangle") {
                this.ctx.strokeStyle = "white";
                this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
            }
            if(shape.type === "circle") {
                this.ctx.strokeStyle = "white";
                this.ctx.beginPath();
                this.ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
                this.ctx.stroke();
            }
            if(shape.type === "line") {
                this.ctx.strokeStyle = "white";
                this.ctx.beginPath();
                this.ctx.moveTo(shape.x1, shape.y1);
                this.ctx.lineTo(shape.x2, shape.y2);
                this.ctx.stroke();
            }
        })
    }

    clearCanvas(){
        this.ctx.clearRect(0,0,this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0,0,this.canvas.width, this.canvas.height)
        // console.log(this.existingShapes)
        this.renderShapes();      
    }

    private isPointInShape(shape: Shape, x: number, y: number): boolean {
        if (shape.type === "rectangle") {
            return x >= shape.x && x <= shape.x + shape.width && y >= shape.y && y <= shape.y + shape.height;
        } else if (shape.type === "circle") {
            const dx = x - shape.x;
            const dy = y - shape.y;
            return Math.sqrt(dx * dx + dy * dy) <= shape.radius;
        } else if (shape.type === "line") {
            // Use a similar approach to the Stack Overflow solution for lines
            const tolerance = 5; // Same tolerance as in the Stack Overflow code
            const lerp = (a: number, b: number, t: number) => a + t * (b - a);

            const dx = shape.x2 - shape.x1;
            const dy = shape.y2 - shape.y1;
            const t = ((x - shape.x1) * dx + (y - shape.y1) * dy) / (dx * dx + dy * dy);
            const clampedT = Math.max(0, Math.min(1, t)); // Clamp t between 0 and 1
            const nearestX = lerp(shape.x1, shape.x2, clampedT);
            const nearestY = lerp(shape.y1, shape.y2, clampedT);

            const distance = Math.sqrt((x - nearestX) ** 2 + (y - nearestY) ** 2);
            return distance <= tolerance;
        }
        return false;
    }

    initMouseHandler(){
        this.canvas.addEventListener("mousedown", (e) => {
            this.clicked = true;
            this.startX = e.clientX;
            this.startY = e.clientY;

            if (this.selectedTool === "select") {
                // Find the shape under the mouse
                this.selectedShape = null;
                for (const shape of this.existingShapes) {
                    if (this.isPointInShape(shape, this.startX, this.startY)) {
                        this.selectedShape = shape;
                        this.isDragging = true;
                        break;
                    }
                }
                this.clearCanvas(); // Re-render to show the selected shape in red
                return;
            }
        })

        this.canvas.addEventListener("mousemove", (e) => {
            if(!this.clicked){
                return;
            }
            const currentX = e.clientX;
            const currentY = e.clientY;
            const dx = currentX - this.startX;
            const dy = currentY - this.startY;

            if (this.selectedTool === "select" && this.isDragging && this.selectedShape) {
                // Update the position of the selected shape based on mouse movement
                if (this.selectedShape.type === "rectangle") {
                    this.selectedShape.x += dx;
                    this.selectedShape.y += dy;
                } else if (this.selectedShape.type === "circle") {
                    this.selectedShape.x += dx;
                    this.selectedShape.y += dy;
                } else if (this.selectedShape.type === "line") {
                    this.selectedShape.x1 += dx;
                    this.selectedShape.y1 += dy;
                    this.selectedShape.x2 += dx;
                    this.selectedShape.y2 += dy;
                }
                this.startX = currentX;
                this.startY = currentY;
                this.clearCanvas(); // Re-render the canvas with the updated shape position
                return;
            }
            const width = e.clientX - this.startX;
            const height = e.clientY - this.startY;
            this.clearCanvas();
           
            this.ctx.strokeStyle = "white";
            // console.log(this.selectedTool);
            switch (this.selectedTool) {
                case "rectangle":
                    this.ctx.strokeRect(this.startX, this.startY, width, height);
                    break;
                case "circle":
                    this.ctx.beginPath();
                    this.ctx.arc(this.startX + width / 2, this.startY + height / 2, Math.sqrt((width * width + height * height) / 4), 0, Math.PI * 2);
                    this.ctx.stroke();
                    break;
                case "line":
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.startX, this.startY);
                    this.ctx.lineTo(e.clientX, e.clientY);
                    this.ctx.stroke();
                    break;
            }
        })

        this.canvas.addEventListener("mouseup", (e) => {
            this.clicked = false;
            const width = e.clientX - this.startX;
            const height = e.clientY - this.startY;
            
            let shape: Shape;
            if(!this.selectedTool) return;

            if (this.selectedTool === "select" && this.selectedShape) {
                // Send the updated shape position to the server
                this.socket.send(JSON.stringify({
                    type: "chat",
                    message: JSON.stringify({ shape: this.selectedShape }),
                    roomId: this.roomId
                }));
                this.selectedShape = null; 

                
                return;
            }
            
            switch (this.selectedTool) {
            case "rectangle":
                shape = {
                    type: "rectangle",
                    x: this.startX,
                    y: this.startY,
                    width,
                    height
                };
                break;
            case "circle":
                shape = {
                    type: "circle",
                    x: this.startX + width / 2,
                    y: this.startY + height / 2,
                    radius: Math.sqrt((width * width + height * height) / 4)
                };
                break;
            case "line":
                shape = {
                    type: "line",
                    x1: this.startX,
                    y1: this.startY,
                    x2: e.clientX,
                    y2: e.clientY
                };
                break;
            default:
                shape = {
                    type: "select"
                };
                break;
            }
            if(this.selectedTool !== "select"){
                this.existingShapes.push(shape);
            }
            // console.log(this.existingShapes);
            // this.clearCanvas();
            this.socket.send(JSON.stringify({
                type: "chat",
                message: JSON.stringify({shape}),
                roomId: this.roomId
            }))
        })
    }
}