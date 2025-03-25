import getExistingShapes from "./http";
import { Shape, Tool } from "./type";

interface ShapeWithId {
    id?: number; // Database ID of the chat message (optional until received from backend)
    clientId?: string; // Temporary client-side ID to track shapes before the database ID is received
    shape: Shape;
}

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private existingShapes: ShapeWithId[] = [];
    private roomId: string;
    private clicked: boolean = false;
    private startX: number = 0;
    private startY: number = 0;
    private selectedTool: Tool | null = null;
    private selectedShape: ShapeWithId | null = null;
    private isDragging: boolean = false;
    socket: WebSocket;

    constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.roomId = roomId;
        this.socket = socket;
        this.init();
        this.initHandlers();
        this.initMouseHandler();
    }

    setTool(tool: Tool) {
        this.selectedTool = tool;
    }

    async init() {
        this.existingShapes = await getExistingShapes(this.roomId);
        this.clearCanvas();
    }

    destroy() {
        this.canvas.removeEventListener("mousedown", this.initMouseHandler);
        this.canvas.removeEventListener("mousemove", this.initMouseHandler);
        this.canvas.removeEventListener("mouseup", this.initMouseHandler);
    }

    initHandlers() {
        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === "chat") {
                const parsedMessage = JSON.parse(message.message);
                const newShape = parsedMessage.shape;

                if (parsedMessage.action === "update") {
                    // Update the existing shape in existingShapes
                    const index = this.existingShapes.findIndex(item => item.id === parsedMessage.id);
                    if (index !== -1) {
                        this.existingShapes[index].shape = newShape;
                    }
                } else {
                    // Add new shape with the database id
                    const index = this.existingShapes.findIndex(item => item.clientId === parsedMessage.shape.clientId);
                    if (index !== -1) {
                        // Update the temporary shape with the database id
                        this.existingShapes[index].id = parsedMessage.id;
                        delete this.existingShapes[index].clientId; // Remove the temporary clientId
                    } else {
                        // In case the shape wasn't added locally (e.g., another client created it)
                        this.existingShapes.push({
                            id: parsedMessage.id,
                            shape: newShape
                        });
                    }
                }
                this.clearCanvas();
            }
        };
    }

    renderShapes() {
        this.existingShapes.forEach((item, index) => {
            const shape = item.shape;
            console.log("Clear canvas called, shape type pushed into db:", shape.type, "with index:", index);
            if (shape.type === "rectangle") {
                this.ctx.strokeStyle = "white";
                this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
            }
            if (shape.type === "circle") {
                this.ctx.strokeStyle = "white";
                this.ctx.beginPath();
                this.ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
                this.ctx.stroke();
            }
            if (shape.type === "line") {
                this.ctx.strokeStyle = "white";
                this.ctx.beginPath();
                this.ctx.moveTo(shape.x1, shape.y1);
                this.ctx.lineTo(shape.x2, shape.y2);
                this.ctx.stroke();
            }
        });
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
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
            const tolerance = 5;
            const lerp = (a: number, b: number, t: number) => a + t * (b - a);
            const dx = shape.x2 - shape.x1;
            const dy = shape.y2 - shape.y1;
            const t = ((x - shape.x1) * dx + (y - shape.y1) * dy) / (dx * dx + dy * dy);
            const clampedT = Math.max(0, Math.min(1, t));
            const nearestX = lerp(shape.x1, shape.x2, clampedT);
            const nearestY = lerp(shape.y1, shape.y2, clampedT);
            const distance = Math.sqrt((x - nearestX) ** 2 + (y - nearestY) ** 2);
            return distance <= tolerance;
        }
        return false;
    }

    initMouseHandler() {
        this.canvas.addEventListener("mousedown", (e) => {
            this.clicked = true;
            this.startX = e.clientX;
            this.startY = e.clientY;

            if (this.selectedTool === "select") {
                this.selectedShape = null;
                for (const item of this.existingShapes) {
                    if (this.isPointInShape(item.shape, this.startX, this.startY)) {
                        this.selectedShape = item;
                        this.isDragging = true;
                        break;
                    }
                }
                this.clearCanvas();
                return;
            }
        });

        this.canvas.addEventListener("mousemove", (e) => {
            if (!this.clicked) {
                return;
            }
            const currentX = e.clientX;
            const currentY = e.clientY;
            const dx = currentX - this.startX;
            const dy = currentY - this.startY;

            if (this.selectedTool === "select" && this.isDragging && this.selectedShape) {
                const shape = this.selectedShape.shape;
                if (shape.type === "rectangle") {
                    shape.x += dx;
                    shape.y += dy;
                } else if (shape.type === "circle") {
                    shape.x += dx;
                    shape.y += dy;
                } else if (shape.type === "line") {
                    shape.x1 += dx;
                    shape.y1 += dy;
                    shape.x2 += dx;
                    shape.y2 += dy;
                }
                this.startX = currentX;
                this.startY = currentY;
                this.clearCanvas();
                return;
            }

            const width = e.clientX - this.startX;
            const height = e.clientY - this.startY;
            this.clearCanvas();
            this.ctx.strokeStyle = "white";

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
        });

        this.canvas.addEventListener("mouseup", (e) => {
            this.clicked = false;
            const width = e.clientX - this.startX;
            const height = e.clientY - this.startY;

            if (!this.selectedTool) return;

            if (this.selectedTool === "select" && this.isDragging && this.selectedShape) {
                this.isDragging = false;
                // Send an update message for the dragged shape
                this.socket.send(JSON.stringify({
                    type: "chat",
                    message: JSON.stringify({
                        shape: this.selectedShape.shape,
                        id: this.selectedShape.id,
                        action: "update"
                    }),
                    roomId: this.roomId
                }));
                this.selectedShape = null;
                return;
            }

            // Only create shapes for "rectangle", "circle", and "line" tools
            if (this.selectedTool !== "rectangle" && this.selectedTool !== "circle" && this.selectedTool !== "line") {
                return;
            }

            let shape: Shape;
            switch (this.selectedTool) {
                case "rectangle":
                    shape = {
                        type: "rectangle",
                        x: this.startX,
                        y: this.startY,
                        width,
                        height,
                        clientId: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}` // Temporary client-side id
                    };
                    break;
                case "circle":
                    shape = {
                        type: "circle",
                        x: this.startX + width / 2,
                        y: this.startY + height / 2,
                        radius: Math.sqrt((width * width + height * height) / 4),
                        clientId: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
                    };
                    break;
                case "line":
                    shape = {
                        type: "line",
                        x1: this.startX,
                        y1: this.startY,
                        x2: e.clientX,
                        y2: e.clientY,
                        clientId: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
                    };
                    break;
                default:
                    return; // Should never reach here due to the check above
            }

            this.existingShapes.push({ shape });
            this.socket.send(JSON.stringify({
                type: "chat",
                message: JSON.stringify({
                    shape,
                    action: "create"
                }),
                roomId: this.roomId
            }));
        });
    }
}