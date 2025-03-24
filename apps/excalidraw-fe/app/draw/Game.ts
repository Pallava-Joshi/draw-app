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
        this.renderShapes();      
    }

    initMouseHandler(){
        this.canvas.addEventListener("mousedown", (e) => {
            this.clicked = true;
            this.startX = e.clientX;
            this.startY = e.clientY;
        })

        this.canvas.addEventListener("mousemove", (e) => {
            if(!this.clicked){
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
        }
            this.existingShapes.push(shape);
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