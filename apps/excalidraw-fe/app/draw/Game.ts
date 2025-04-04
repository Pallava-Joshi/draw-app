import getExistingShapes from "./http";
import { Shape, Tool } from "./type";

interface ShapeWithId {
    id?: number;
    clientId?: string;
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
    private isResizing: boolean = false;
    private resizeCorner: string | null = null;
    socket: WebSocket;

    constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
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
                    const index = this.existingShapes.findIndex(
                        (item) => item.id === parsedMessage.id
                    );
                    if (index !== -1) {
                        this.existingShapes[index].shape = newShape;
                    }
                } else {
                    const index = this.existingShapes.findIndex(
                        (item) => item.clientId === parsedMessage.shape.clientId
                    );
                    if (index !== -1) {
                        this.existingShapes[index].id = parsedMessage.id;
                        delete this.existingShapes[index].clientId;
                    } else {
                        this.existingShapes.push({
                            id: parsedMessage.id,
                            shape: newShape,
                        });
                    }
                }
                this.clearCanvas();
            }
        };
    }

    private drawSelectionBox(shape: Shape) {
        const borderOffset = 5;
        const handleSize = 8;

        this.ctx.strokeStyle = "white"; // Change back to white
        this.ctx.setLineDash([5, 5]);

        if (shape.type === "rectangle") {
            const x = shape.x - borderOffset;
            const y = shape.y - borderOffset;
            const width = shape.width + 2 * borderOffset;
            const height = shape.height + 2 * borderOffset;

            this.ctx.strokeRect(x, y, width, height);

            this.ctx.setLineDash([]);
            this.ctx.fillStyle = "white";
            this.ctx.fillRect(
                x - handleSize / 2,
                y - handleSize / 2,
                handleSize,
                handleSize
            ); // Top-left
            this.ctx.fillRect(
                x + width - handleSize / 2,
                y - handleSize / 2,
                handleSize,
                handleSize
            ); // Top-right
            this.ctx.fillRect(
                x - handleSize / 2,
                y + height - handleSize / 2,
                handleSize,
                handleSize
            ); // Bottom-left
            this.ctx.fillRect(
                x + width - handleSize / 2,
                y + height - handleSize / 2,
                handleSize,
                handleSize
            ); // Bottom-right
        } else if (shape.type === "circle") {
            const radius = shape.radius + borderOffset;

            this.ctx.beginPath();
            this.ctx.arc(shape.x, shape.y, radius, 0, Math.PI * 2);
            this.ctx.stroke();

            this.ctx.setLineDash([]);
            this.ctx.fillStyle = "white";
            this.ctx.fillRect(
                shape.x - radius - handleSize / 2,
                shape.y - handleSize / 2,
                handleSize,
                handleSize
            ); // Left
            this.ctx.fillRect(
                shape.x + radius - handleSize / 2,
                shape.y - handleSize / 2,
                handleSize,
                handleSize
            ); // Right
            this.ctx.fillRect(
                shape.x - handleSize / 2,
                shape.y - radius - handleSize / 2,
                handleSize,
                handleSize
            ); // Top
            this.ctx.fillRect(
                shape.x - handleSize / 2,
                shape.y + radius - handleSize / 2,
                handleSize,
                handleSize
            ); // Bottom
        } else if (shape.type === "line") {
            const dx = shape.x2 - shape.x1;
            const dy = shape.y2 - shape.y1;
            const length = Math.sqrt(dx * dx + dy * dy);
            const offsetX = (dy / length) * borderOffset;
            const offsetY = -(dx / length) * borderOffset;

            this.ctx.beginPath();
            this.ctx.moveTo(shape.x1 + offsetX, shape.y1 + offsetY);
            this.ctx.lineTo(shape.x2 + offsetX, shape.y2 + offsetY);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(shape.x1 - offsetX, shape.y1 - offsetY);
            this.ctx.lineTo(shape.x2 - offsetX, shape.y2 - offsetY);
            this.ctx.stroke();

            this.ctx.setLineDash([]);
            this.ctx.fillStyle = "white";
            this.ctx.fillRect(
                shape.x1 - handleSize / 2,
                shape.y1 - handleSize / 2,
                handleSize,
                handleSize
            ); // Start
            this.ctx.fillRect(
                shape.x2 - handleSize / 2,
                shape.y2 - handleSize / 2,
                handleSize,
                handleSize
            ); // End
        }

        this.ctx.setLineDash([]);
    }

    renderShapes() {
        this.existingShapes.forEach((item, index) => {
            const shape = item.shape;
            console.log(
                "Clear canvas called, shape type pushed into db:",
                shape.type,
                "with index:",
                index
            );
            if (shape.type === "rectangle") {
                this.ctx.strokeStyle = "white";
                this.ctx.strokeRect(
                    shape.x,
                    shape.y,
                    shape.width,
                    shape.height
                );
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

        if (this.selectedShape) {
            this.drawSelectionBox(this.selectedShape.shape);
        }
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.renderShapes();
    }

    private isPointInShape(shape: Shape, x: number, y: number): boolean {
        if (shape.type === "rectangle") {
            return (
                x >= shape.x &&
                x <= shape.x + shape.width &&
                y >= shape.y &&
                y <= shape.y + shape.height
            );
        } else if (shape.type === "circle") {
            const dx = x - shape.x;
            const dy = y - shape.y;
            return Math.sqrt(dx * dx + dy * dy) <= shape.radius;
        } else if (shape.type === "line") {
            const tolerance = 5;
            const lerp = (a: number, b: number, t: number) => a + t * (b - a);
            const dx = shape.x2 - shape.x1;
            const dy = shape.y2 - shape.y1;
            const t =
                ((x - shape.x1) * dx + (y - shape.y1) * dy) /
                (dx * dx + dy * dy);
            const clampedT = Math.max(0, Math.min(1, t));
            const nearestX = lerp(shape.x1, shape.x2, clampedT);
            const nearestY = lerp(shape.y1, shape.y2, clampedT);
            const distance = Math.sqrt(
                (x - nearestX) ** 2 + (y - nearestY) ** 2
            );
            return distance <= tolerance;
        }
        return false;
    }

    private isPointInHandle(shape: Shape, x: number, y: number): string | null {
        const borderOffset = 5;
        const handleSize = 8;

        if (shape.type === "rectangle") {
            const x1 = shape.x - borderOffset;
            const y1 = shape.y - borderOffset;
            const x2 = shape.x + shape.width + borderOffset;
            const y2 = shape.y + shape.height + borderOffset;

            const handles = [
                { corner: "top-left", x: x1, y: y1 },
                { corner: "top-right", x: x2, y: y1 },
                { corner: "bottom-left", x: x1, y: y2 },
                { corner: "bottom-right", x: x2, y: y2 },
            ];

            for (const handle of handles) {
                if (
                    x >= handle.x - handleSize / 2 &&
                    x <= handle.x + handleSize / 2 &&
                    y >= handle.y - handleSize / 2 &&
                    y <= handle.y + handleSize / 2
                ) {
                    return handle.corner;
                }
            }
        } else if (shape.type === "circle") {
            const radius = shape.radius + borderOffset;
            const handles = [
                { corner: "left", x: shape.x - radius, y: shape.y },
                { corner: "right", x: shape.x + radius, y: shape.y },
                { corner: "top", x: shape.x, y: shape.y - radius },
                { corner: "bottom", x: shape.x, y: shape.y + radius },
            ];

            for (const handle of handles) {
                if (
                    x >= handle.x - handleSize / 2 &&
                    x <= handle.x + handleSize / 2 &&
                    y >= handle.y - handleSize / 2 &&
                    y <= handle.y + handleSize / 2
                ) {
                    return handle.corner;
                }
            }
        } else if (shape.type === "line") {
            const handles = [
                { corner: "start", x: shape.x1, y: shape.y1 },
                { corner: "end", x: shape.x2, y: shape.y2 },
            ];

            for (const handle of handles) {
                if (
                    x >= handle.x - handleSize / 2 &&
                    x <= handle.x + handleSize / 2 &&
                    y >= handle.y - handleSize / 2 &&
                    y <= handle.y + handleSize / 2
                ) {
                    return handle.corner;
                }
            }
        }
        return null;
    }
    private setCursorForHandle(corner: string | null) {
        if (!corner) {
            // Default cursor when not over a handle, based on selected tool
            if (this.selectedTool === "hand") {
                this.canvas.style.cursor = "grab";
            } else if (this.selectedTool === "select" && this.selectedShape) {
                this.canvas.style.cursor = "move"; // For dragging selected shapes
            } else if (this.selectedTool === "eraser") {
                this.canvas.style.cursor = "crosshair";
            } else if (
                this.selectedTool === "rectangle" ||
                this.selectedTool === "circle" ||
                this.selectedTool === "line"
            ) {
                this.canvas.style.cursor = "crosshair";
            } else {
                this.canvas.style.cursor = "default";
            }
            return;
        }

        // Handle-specific cursors for resizing
        if (corner === "top-left" || corner === "bottom-right") {
            this.canvas.style.cursor = "nwse-resize";
        } else if (corner === "top-right" || corner === "bottom-left") {
            this.canvas.style.cursor = "nesw-resize";
        } else if (corner === "left" || corner === "right") {
            this.canvas.style.cursor = "ew-resize";
        } else if (corner === "top" || corner === "bottom") {
            this.canvas.style.cursor = "ns-resize";
        } else if (corner === "start" || corner === "end") {
            this.canvas.style.cursor = "move"; // Consistent with dragging
        }
    }

    initMouseHandler() {
        this.canvas.addEventListener("mousedown", (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.startX = e.clientX - rect.left;
            this.startY = e.clientY - rect.top;
            this.clicked = true;

            if (this.selectedTool === "select") {
                this.isResizing = false;
                this.resizeCorner = null;

                // First, check if the click is on a resize handle
                if (this.selectedShape) {
                    this.resizeCorner = this.isPointInHandle(
                        this.selectedShape.shape,
                        this.startX,
                        this.startY
                    );
                    if (this.resizeCorner) {
                        console.log(
                            `Starting resize on corner: ${this.resizeCorner}`
                        );
                        this.isResizing = true;
                        return;
                    }
                }

                // If not resizing, check for shape selection
                this.selectedShape = null;
                for (const item of this.existingShapes) {
                    if (
                        this.isPointInShape(
                            item.shape,
                            this.startX,
                            this.startY
                        )
                    ) {
                        this.selectedShape = item;
                        this.isDragging = true;
                        console.log(`Selected shape: ${item.shape.type}`);
                        break;
                    }
                }
                this.clearCanvas();
                return;
            }
        });

        this.canvas.addEventListener("mousemove", (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;

            // Update cursor based on handle hover
            if (this.selectedTool === "select" && this.selectedShape) {
                const corner = this.isPointInHandle(
                    this.selectedShape.shape,
                    currentX,
                    currentY
                );
                this.setCursorForHandle(corner);
            } else {
                this.canvas.style.cursor = "default";
            }

            if (!this.clicked) {
                return;
            }

            const dx = currentX - this.startX;
            const dy = currentY - this.startY;

            if (this.selectedTool === "select" && this.selectedShape) {
                const shape = this.selectedShape.shape;

                if (this.isResizing && this.resizeCorner) {
                    console.log(
                        `Resizing ${shape.type} on corner ${this.resizeCorner}, dx: ${dx}, dy: ${dy}`
                    );
                    if (shape.type === "rectangle") {
                        if (this.resizeCorner === "top-left") {
                            shape.x += dx;
                            shape.y += dy;
                            shape.width -= dx;
                            shape.height -= dy;
                            if (shape.width < 10) {
                                shape.x -= 10 - shape.width;
                                shape.width = 10;
                            }
                            if (shape.height < 10) {
                                shape.y -= 10 - shape.height;
                                shape.height = 10;
                            }
                            // Allow negative dimensions and flip coordinates
                            if (shape.width < 0) {
                                shape.x += shape.width;
                                shape.width = -shape.width;
                            }
                            if (shape.height < 0) {
                                shape.y += shape.height;
                                shape.height = -shape.height;
                            }
                        } else if (this.resizeCorner === "top-right") {
                            shape.y += dy;
                            shape.width += dx;
                            shape.height -= dy;
                            if (shape.width < 10) shape.width = 10;
                            if (shape.height < 10) {
                                shape.y -= 10 - shape.height;
                                shape.height = 10;
                            }
                            if (shape.width < 0) {
                                shape.x += shape.width;
                                shape.width = -shape.width;
                            }
                            if (shape.height < 0) {
                                shape.y += shape.height;
                                shape.height = -shape.height;
                            }
                        } else if (this.resizeCorner === "bottom-left") {
                            shape.x += dx;
                            shape.width -= dx;
                            shape.height += dy;
                            if (shape.width < 10) {
                                shape.x -= 10 - shape.width;
                                shape.width = 10;
                            }
                            if (shape.height < 10) shape.height = 10;
                            if (shape.width < 0) {
                                shape.x += shape.width;
                                shape.width = -shape.width;
                            }
                            if (shape.height < 0) {
                                shape.y += shape.height;
                                shape.height = -shape.height;
                            }
                        } else if (this.resizeCorner === "bottom-right") {
                            shape.width += dx;
                            shape.height += dy;
                            if (shape.width < 10) shape.width = 10;
                            if (shape.height < 10) shape.height = 10;
                            if (shape.width < 0) {
                                shape.x += shape.width;
                                shape.width = -shape.width;
                            }
                            if (shape.height < 0) {
                                shape.y += shape.height;
                                shape.height = -shape.height;
                            }
                        }
                    } else if (shape.type === "circle") {
                        if (
                            this.resizeCorner === "left" ||
                            this.resizeCorner === "right"
                        ) {
                            shape.radius = Math.abs(currentX - shape.x);
                        } else if (
                            this.resizeCorner === "top" ||
                            this.resizeCorner === "bottom"
                        ) {
                            shape.radius = Math.abs(currentY - shape.y);
                        }
                        if (shape.radius < 5) shape.radius = 5;
                    } else if (shape.type === "line") {
                        if (this.resizeCorner === "start") {
                            shape.x1 = currentX;
                            shape.y1 = currentY;
                        } else if (this.resizeCorner === "end") {
                            shape.x2 = currentX;
                            shape.y2 = currentY;
                        }
                    }
                    this.startX = currentX;
                    this.startY = currentY;
                    this.clearCanvas();
                    return;
                }

                if (this.isDragging) {
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
            }

            const width = currentX - this.startX;
            const height = currentY - this.startY;
            this.clearCanvas();
            this.ctx.strokeStyle = "white";

            switch (this.selectedTool) {
                case "rectangle":
                    this.ctx.strokeRect(
                        this.startX,
                        this.startY,
                        width,
                        height
                    );
                    break;
                case "circle":
                    this.ctx.beginPath();
                    this.ctx.arc(
                        this.startX + width / 2,
                        this.startY + height / 2,
                        Math.sqrt((width * width + height * height) / 4),
                        0,
                        Math.PI * 2
                    );
                    this.ctx.stroke();
                    break;
                case "line":
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.startX, this.startY);
                    this.ctx.lineTo(currentX, currentY);
                    this.ctx.stroke();
                    break;
            }
        });

        this.canvas.addEventListener("mouseup", (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const endX = e.clientX - rect.left;
            const endY = e.clientY - rect.top;
            const width = endX - this.startX;
            const height = endY - this.startY;

            this.clicked = false;

            if (!this.selectedTool) return;

            if (this.selectedTool === "select" && this.selectedShape) {
                if (this.isDragging || this.isResizing) {
                    console.log(
                        `Sending update for shape: ${this.selectedShape.shape.type}`
                    );
                    this.socket.send(
                        JSON.stringify({
                            type: "chat",
                            message: JSON.stringify({
                                shape: this.selectedShape.shape,
                                id: this.selectedShape.id,
                                action: "update",
                            }),
                            roomId: this.roomId,
                        })
                    );
                }
                this.isDragging = false;
                this.isResizing = false;
                this.resizeCorner = null;
                return;
            }

            if (
                this.selectedTool !== "rectangle" &&
                this.selectedTool !== "circle" &&
                this.selectedTool !== "line"
            ) {
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
                        clientId: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    };
                    break;
                case "circle":
                    shape = {
                        type: "circle",
                        x: this.startX + width / 2,
                        y: this.startY + height / 2,
                        radius: Math.sqrt(
                            (width * width + height * height) / 4
                        ),
                        clientId: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    };
                    break;
                case "line":
                    shape = {
                        type: "line",
                        x1: this.startX,
                        y1: this.startY,
                        x2: endX,
                        y2: endY,
                        clientId: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    };
                    break;
                default:
                    return;
            }

            this.existingShapes.push({ shape });
            this.socket.send(
                JSON.stringify({
                    type: "chat",
                    message: JSON.stringify({
                        shape,
                        action: "create",
                    }),
                    roomId: this.roomId,
                })
            );
        });
    }
}
