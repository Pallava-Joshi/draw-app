import { Shape, Tool, ShapeWithId } from "./type";

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
  private selectedColor: string = "#FFFFFF";
  private zoomLevel: number = 1;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private isPanning: boolean = false;
  private lastPanPoint: { x: number; y: number } = { x: 0, y: 0 };
  private minZoom: number = 0.1;
  private maxZoom: number = 10;
  private dragOffsetX: number = 0;
  private dragOffsetY: number = 0;
  private zIndexCounter: number = 1;
  private textInput: HTMLTextAreaElement | null = null;
  private isEditingText: boolean = false;
  private selectedShapeCallback: ((shape: ShapeWithId | null) => void) | null =
    null;
  socket: WebSocket;

  constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.roomId = roomId;
    this.socket = socket;
    this.init();
    this.initHandlers();
    this.initMouseHandler();
    this.addControlsLegend();
  }

  setTool(tool: Tool): void {
    this.selectedTool = tool;
  }

  setColor(color: string): void {
    this.selectedColor = color;
  }

  public setSelectedShapeCallback(
    callback: (shape: ShapeWithId | null) => void
  ): void {
    this.selectedShapeCallback = callback;
  }

  async init(): Promise<void> {
    // Placeholder for fetching shapes - will be updated when backend is fixed
    this.existingShapes = [];
    this.applyTransform();
    this.clearCanvas();
  }

  destroy(): void {
    this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
    this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
    this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
    this.canvas.removeEventListener("wheel", this.wheelHandler);
    window.removeEventListener("keydown", this.keyDownHandler);
    window.removeEventListener("keyup", this.keyUpHandler);
    if (this.textInput) {
      this.textInput.remove();
    }
  }

  private initHandlers(): void {
    this.socket.onmessage = (event: MessageEvent<string>) => {
      const message = JSON.parse(event.data);
      if (message.type === "chat") {
        const parsedData = JSON.parse(message.message);
        if (parsedData.action === "create") {
          const exists = this.existingShapes.some(
            (item) =>
              item.id === parsedData.id ||
              item.shape.clientId === parsedData.shape.clientId
          );
          if (!exists) {
            this.existingShapes.push({
              shape: parsedData.shape,
              id: parsedData.id,
            });
          }
        } else if (parsedData.action === "update") {
          const index = this.existingShapes.findIndex(
            (item) => item.id === parsedData.id
          );
          if (index !== -1) {
            this.existingShapes[index].shape = parsedData.shape;
          }
        } else if (parsedData.action === "delete") {
          this.existingShapes = this.existingShapes.filter(
            (item) =>
              item.id !== parsedData.id &&
              item.shape.clientId !== parsedData.clientId
          );
        }
        this.clearCanvas();
      } else if (message.type === "move") {
        const parsedData = JSON.parse(message.message);
        const { index, newShape } = parsedData;
        const localIndex = this.existingShapes.findIndex(
          (item) => item.id === this.existingShapes[index]?.id
        );
        if (localIndex >= 0 && localIndex < this.existingShapes.length) {
          this.existingShapes[localIndex].shape = newShape;
          this.clearCanvas();
        }
      }
    };
  }

  private applyTransform(): void {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.translate(this.offsetX, this.offsetY);
    this.ctx.scale(this.zoomLevel, this.zoomLevel);
  }

  private screenToCanvas(x: number, y: number): { x: number; y: number } {
    return {
      x: (x - this.offsetX) / this.zoomLevel,
      y: (y - this.offsetY) / this.zoomLevel,
    };
  }

  private clearCanvas(): void {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "rgba(28, 28, 28)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
    this.drawGrid();
    this.renderShapes();
  }

  private drawGrid(): void {
    const gridSize = 50;
    const gridColor = "rgba(150, 150, 150, 0.2)";
    const topLeft = this.screenToCanvas(0, 0);
    const bottomRight = this.screenToCanvas(
      this.canvas.width,
      this.canvas.height
    );
    const startX = Math.floor(topLeft.x / gridSize) * gridSize;
    const startY = Math.floor(topLeft.y / gridSize) * gridSize;
    const endX = Math.ceil(bottomRight.x / gridSize) * gridSize;
    const endY = Math.ceil(bottomRight.y / gridSize) * gridSize;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.strokeStyle = gridColor;
    this.ctx.lineWidth = 1 / this.zoomLevel;
    for (let x = startX; x <= endX; x += gridSize) {
      this.ctx.moveTo(x, startY);
      this.ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += gridSize) {
      this.ctx.moveTo(startX, y);
      this.ctx.lineTo(endX, y);
    }
    this.ctx.stroke();
    this.ctx.lineWidth = 1;
    this.ctx.restore();
  }

  private renderShapes(): void {
    const sortedShapes = [...this.existingShapes].sort(
      (a, b) => (a.shape.zIndex || 0) - (b.shape.zIndex || 0)
    );

    sortedShapes.forEach((item) => {
      const shape = item.shape;
      this.ctx.strokeStyle = shape.color || "#FFFFFF";
      this.ctx.fillStyle = shape.color || "#FFFFFF";
      if (shape.type === "rectangle") {
        this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      } else if (shape.type === "circle") {
        this.ctx.beginPath();
        this.ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.closePath();
      } else if (shape.type === "line") {
        this.ctx.beginPath();
        this.ctx.moveTo(shape.x1, shape.y1);
        this.ctx.lineTo(shape.x2, shape.y2);
        this.ctx.stroke();
        this.ctx.closePath();
      } else if (shape.type === "pencil" && shape.points.length > 1) {
        this.ctx.beginPath();
        this.ctx.moveTo(shape.points[0].x, shape.points[0].y);
        for (let i = 1; i < shape.points.length; i++) {
          this.ctx.lineTo(shape.points[i].x, shape.points[i].y);
        }
        this.ctx.stroke();
        this.ctx.closePath();
      } else if (shape.type === "triangle") {
        this.ctx.beginPath();
        this.ctx.moveTo(shape.x1, shape.y1);
        this.ctx.lineTo(shape.x2, shape.y2);
        this.ctx.lineTo(shape.x3, shape.y3);
        this.ctx.closePath();
        this.ctx.stroke();
      } else if (shape.type === "text") {
        this.ctx.font = `${shape.fontSize}px Arial`;
        this.ctx.fillText(shape.text, shape.x, shape.y);
      }
    });

    if (this.selectedShape) {
      this.drawSelectionBox(this.selectedShape.shape);
    }
  }

  private drawSelectionBox(shape: Shape): void {
    const borderOffset = 5 / this.zoomLevel;
    const handleSize = 8 / this.zoomLevel;
    this.ctx.save();
    this.ctx.strokeStyle = "#66B0FF";
    this.ctx.setLineDash([5 / this.zoomLevel, 5 / this.zoomLevel]);

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
      );
      this.ctx.fillRect(
        x + width - handleSize / 2,
        y - handleSize / 2,
        handleSize,
        handleSize
      );
      this.ctx.fillRect(
        x - handleSize / 2,
        y + height - handleSize / 2,
        handleSize,
        handleSize
      );
      this.ctx.fillRect(
        x + width - handleSize / 2,
        y + height - handleSize / 2,
        handleSize,
        handleSize
      );
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
      );
      this.ctx.fillRect(
        shape.x + radius - handleSize / 2,
        shape.y - handleSize / 2,
        handleSize,
        handleSize
      );
      this.ctx.fillRect(
        shape.x - handleSize / 2,
        shape.y - radius - handleSize / 2,
        handleSize,
        handleSize
      );
      this.ctx.fillRect(
        shape.x - handleSize / 2,
        shape.y + radius - handleSize / 2,
        handleSize,
        handleSize
      );
    } else if (shape.type === "line") {
      const minX = Math.min(shape.x1, shape.x2) - borderOffset;
      const maxX = Math.max(shape.x1, shape.x2) + borderOffset;
      const minY = Math.min(shape.y1, shape.y2) - borderOffset;
      const maxY = Math.max(shape.y1, shape.y2) + borderOffset;
      this.ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
      this.ctx.setLineDash([]);
      this.ctx.fillStyle = "white";
      this.ctx.fillRect(
        shape.x1 - handleSize / 2,
        shape.y1 - handleSize / 2,
        handleSize,
        handleSize
      );
      this.ctx.fillRect(
        shape.x2 - handleSize / 2,
        shape.y2 - handleSize / 2,
        handleSize,
        handleSize
      );
    } else if (shape.type === "triangle") {
      const minX = Math.min(shape.x1, shape.x2, shape.x3);
      const maxX = Math.max(shape.x1, shape.x2, shape.x3);
      const minY = Math.min(shape.y1, shape.y2, shape.y3);
      const maxY = Math.max(shape.y1, shape.y2, shape.y3);
      this.ctx.strokeRect(
        minX - borderOffset,
        minY - borderOffset,
        maxX - minX + 2 * borderOffset,
        maxY - minY + 2 * borderOffset
      );
      this.ctx.setLineDash([]);
      this.ctx.fillStyle = "white";
      this.ctx.fillRect(
        shape.x1 - handleSize / 2,
        shape.y1 - handleSize / 2,
        handleSize,
        handleSize
      );
      this.ctx.fillRect(
        shape.x2 - handleSize / 2,
        shape.y2 - handleSize / 2,
        handleSize,
        handleSize
      );
      this.ctx.fillRect(
        shape.x3 - handleSize / 2,
        shape.y3 - handleSize / 2,
        handleSize,
        handleSize
      );
    } else if (shape.type === "pencil") {
      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
      shape.points.forEach((point) => {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      });
      const x = minX - borderOffset;
      const y = minY - borderOffset;
      const width = maxX - minX + 2 * borderOffset;
      const height = maxY - minY + 2 * borderOffset;
      this.ctx.strokeRect(x, y, width, height);
      this.ctx.setLineDash([]);
      this.ctx.fillStyle = "white";
      this.ctx.fillRect(
        x - handleSize / 2,
        y - handleSize / 2,
        handleSize,
        handleSize
      );
      this.ctx.fillRect(
        x + width - handleSize / 2,
        y - handleSize / 2,
        handleSize,
        handleSize
      );
      this.ctx.fillRect(
        x - handleSize / 2,
        y + height - handleSize / 2,
        handleSize,
        handleSize
      );
      this.ctx.fillRect(
        x + width - handleSize / 2,
        y + height - handleSize / 2,
        handleSize,
        handleSize
      );
    } else if (shape.type === "text") {
      this.ctx.font = `${shape.fontSize}px Arial`;
      const metrics = this.ctx.measureText(shape.text);
      const textWidth = metrics.width;
      const textHeight = shape.fontSize;
      const x = shape.x - borderOffset;
      const y = shape.y - textHeight - borderOffset;
      const width = textWidth + 2 * borderOffset;
      const height = textHeight + 2 * borderOffset;
      this.ctx.strokeRect(x, y, width, height);
      this.ctx.setLineDash([]);
      this.ctx.fillStyle = "white";
      this.ctx.fillRect(
        x - handleSize / 2,
        y - handleSize / 2,
        handleSize,
        handleSize
      );
      this.ctx.fillRect(
        x + width - handleSize / 2,
        y - handleSize / 2,
        handleSize,
        handleSize
      );
      this.ctx.fillRect(
        x - handleSize / 2,
        y + height - handleSize / 2,
        handleSize,
        handleSize
      );
      this.ctx.fillRect(
        x + width - handleSize / 2,
        y + height - handleSize / 2,
        handleSize,
        handleSize
      );
    }
    this.ctx.restore();
  }

  private isPointInShape(shape: Shape, x: number, y: number): boolean {
    const canvasPoint = this.screenToCanvas(x, y);
    x = canvasPoint.x;
    y = canvasPoint.y;
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
      const tolerance = 5 / this.zoomLevel;
      const lerp = (a: number, b: number, t: number) => a + t * (b - a);
      const dx = shape.x2 - shape.x1;
      const dy = shape.y2 - shape.y1;
      const t =
        ((x - shape.x1) * dx + (y - shape.y1) * dy) / (dx * dx + dy * dy);
      const clampedT = Math.max(0, Math.min(1, t));
      const nearestX = lerp(shape.x1, shape.x2, clampedT);
      const nearestY = lerp(shape.y1, shape.y2, clampedT);
      const distance = Math.sqrt((x - nearestX) ** 2 + (y - nearestY) ** 2);
      return distance <= tolerance;
    } else if (shape.type === "pencil") {
      for (let i = 1; i < shape.points.length; i++) {
        const p1 = shape.points[i - 1];
        const p2 = shape.points[i];
        const lineLength = Math.sqrt(
          Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
        );
        if (lineLength === 0) continue;
        const distance =
          Math.abs(
            (p2.y - p1.y) * x - (p2.x - p1.x) * y + p2.x * p1.y - p2.y * p1.x
          ) / lineLength;
        if (distance < 5 / this.zoomLevel) return true;
      }
      return false;
    } else if (shape.type === "triangle") {
      const a = { x: shape.x1, y: shape.y1 };
      const b = { x: shape.x2, y: shape.y2 };
      const c = { x: shape.x3, y: shape.y3 };
      const areaABC = Math.abs(
        (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)
      );
      const areaPBC = Math.abs((b.x - x) * (c.y - y) - (c.x - x) * (b.y - y));
      const areaPAC = Math.abs(
        (x - a.x) * (c.y - a.y) - (c.x - a.x) * (y - a.y)
      );
      const areaPAB = Math.abs(
        (b.x - a.x) * (y - a.y) - (x - a.x) * (b.y - a.y)
      );
      return Math.abs(areaABC - (areaPBC + areaPAC + areaPAB)) < 1;
    } else if (shape.type === "text") {
      this.ctx.font = `${shape.fontSize}px Arial`;
      const metrics = this.ctx.measureText(shape.text);
      const textWidth = metrics.width;
      const textHeight = shape.fontSize;
      return (
        x >= shape.x &&
        x <= shape.x + textWidth &&
        y >= shape.y - textHeight &&
        y <= shape.y
      );
    }
    return false;
  }

  private isPointInHandle(shape: Shape, x: number, y: number): string | null {
    const canvasPoint = this.screenToCanvas(x, y);
    x = canvasPoint.x;
    y = canvasPoint.y;
    const borderOffset = 5 / this.zoomLevel;
    const handleSize = 8 / this.zoomLevel;

    if (shape.type === "rectangle") {
      const x1 = shape.x - borderOffset;
      const y1 = shape.y - borderOffset;
      const x2 = shape.x + shape.width + borderOffset;
      const y2 = shape.y + shape.height + borderOffset;
      const handles: { corner: string; x: number; y: number }[] = [
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
      const handles: { corner: string; x: number; y: number }[] = [
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
      const handles: { corner: string; x: number; y: number }[] = [
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
    } else if (shape.type === "triangle") {
      const handles: { corner: string; x: number; y: number }[] = [
        { corner: "vertex1", x: shape.x1, y: shape.y1 },
        { corner: "vertex2", x: shape.x2, y: shape.y2 },
        { corner: "vertex3", x: shape.x3, y: shape.y3 },
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
    } else if (shape.type === "pencil") {
      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
      shape.points.forEach((point) => {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      });
      const x1 = minX - borderOffset;
      const y1 = minY - borderOffset;
      const x2 = maxX + borderOffset;
      const y2 = maxY + borderOffset;
      const handles: { corner: string; x: number; y: number }[] = [
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
    } else if (shape.type === "text") {
      this.ctx.font = `${shape.fontSize}px Arial`;
      const metrics = this.ctx.measureText(shape.text);
      const textWidth = metrics.width;
      const textHeight = shape.fontSize;
      const x1 = shape.x - borderOffset;
      const y1 = shape.y - textHeight - borderOffset;
      const x2 = shape.x + textWidth + borderOffset;
      const y2 = shape.y + borderOffset;
      const handles: { corner: string; x: number; y: number }[] = [
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
    }
    return null;
  }

  private setCursorForHandle(corner: string | null): void {
    if (!corner) {
      if (this.selectedTool === "hand") {
        this.canvas.style.cursor = this.isPanning ? "grabbing" : "grab";
      } else if (this.selectedTool === "select" && this.selectedShape) {
        this.canvas.style.cursor = "move";
      } else if (
        this.selectedTool === "eraser" ||
        this.selectedTool === "pencil" ||
        this.selectedTool === "text"
      ) {
        this.canvas.style.cursor = "crosshair";
      } else if (
        this.selectedTool === "rectangle" ||
        this.selectedTool === "circle" ||
        this.selectedTool === "line" ||
        this.selectedTool === "triangle"
      ) {
        this.canvas.style.cursor = "crosshair";
      } else {
        this.canvas.style.cursor = "default";
      }
      return;
    }
    if (corner === "top-left" || corner === "bottom-right") {
      this.canvas.style.cursor = "nwse-resize";
    } else if (corner === "top-right" || corner === "bottom-left") {
      this.canvas.style.cursor = "nesw-resize";
    } else if (corner === "left" || corner === "right") {
      this.canvas.style.cursor = "ew-resize";
    } else if (corner === "top" || corner === "bottom") {
      this.canvas.style.cursor = "ns-resize";
    } else if (
      corner === "start" ||
      corner === "end" ||
      corner.includes("vertex")
    ) {
      this.canvas.style.cursor = "move";
    }
  }

  private addControlsLegend(): void {
    const legend = document.createElement("div");
    legend.style.position = "absolute";
    legend.style.bottom = "10px";
    legend.style.right = "10px";
    legend.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    legend.style.color = "white";
    legend.style.padding = "10px";
    legend.style.borderRadius = "5px";
    legend.style.fontSize = "12px";
    legend.style.userSelect = "none";
    legend.style.zIndex = "1000";
    legend.style.fontFamily = "Arial, sans-serif";
    legend.style.boxShadow = "0 2px 5px rgba(0,0,0,0.3)";
    legend.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">Canvas Controls</div>
      <div style="display: flex; justify-content: space-between;">
        <div style="flex: 1;">
          <div>Mouse wheel: Zoom in/out</div>
          <div>Space + drag: Pan canvas</div>
        </div>
      </div>
      <div style="text-align: right; margin-top: 5px; cursor: pointer; font-size: 10px;" id="hide-controls">Hide</div>
    `;
    this.canvas.parentElement?.appendChild(legend);
    const hideButton = legend.querySelector("#hide-controls");
    hideButton?.addEventListener("click", () => {
      legend.style.display = "none";
      localStorage.setItem("hideControlsLegend", "true");
      this.addHelpButton();
    });
    if (localStorage.getItem("hideControlsLegend") === "true") {
      legend.style.display = "none";
      this.addHelpButton();
    }
  }

  private addHelpButton(): void {
    const helpButton = document.createElement("div");
    helpButton.style.position = "absolute";
    helpButton.style.bottom = "10px";
    helpButton.style.right = "10px";
    helpButton.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    helpButton.style.color = "white";
    helpButton.style.width = "24px";
    helpButton.style.height = "24px";
    helpButton.style.borderRadius = "50%";
    helpButton.style.display = "flex";
    helpButton.style.justifyContent = "center";
    helpButton.style.alignItems = "center";
    helpButton.style.cursor = "pointer";
    helpButton.style.zIndex = "1000";
    helpButton.style.fontSize = "14px";
    helpButton.style.fontWeight = "bold";
    helpButton.style.boxShadow = "0 2px 5px rgba(0,0,0,0.3)";
    helpButton.innerHTML = "?";
    helpButton.addEventListener("click", () => {
      helpButton.remove();
      localStorage.removeItem("hideControlsLegend");
      this.addControlsLegend();
    });
    this.canvas.parentElement?.appendChild(helpButton);
  }

  private createTextInput(
    x: number,
    y: number,
    shape: ShapeWithId | null = null
  ): void {
    if (this.textInput) {
      this.textInput.remove();
      this.textInput = null;
    }

    this.textInput = document.createElement("textarea");
    this.textInput.style.position = "absolute";
    this.textInput.style.left = `${x * this.zoomLevel + this.offsetX}px`;
    this.textInput.style.top = `${y * this.zoomLevel + this.offsetY}px`;
    this.textInput.style.fontSize = `${
      shape && shape.shape.type === "text" ? shape.shape.fontSize : 16
    }px`;
    this.textInput.style.color = this.selectedColor;
    this.textInput.style.background = "transparent";
    this.textInput.style.border = "1px solid white";
    this.textInput.style.zIndex = "1000";
    this.textInput.style.resize = "none";
    this.textInput.style.overflow = "hidden";
    this.textInput.style.width = "200px";
    this.textInput.style.height = "auto";
    this.textInput.value =
      shape && shape.shape.type === "text" ? shape.shape.text : "";
    this.textInput.focus();

    this.textInput.addEventListener("input", () => {
      if (this.textInput) {
        this.textInput.style.height = "auto";
        this.textInput.style.height = `${this.textInput.scrollHeight}px`;
      }
    });

    this.textInput.addEventListener("blur", () => {
      if (!this.textInput) return;
      const text = this.textInput.value;
      if (shape && shape.shape.type === "text") {
        shape.shape.text = text;
        this.socket.send(
          JSON.stringify({
            type: "chat",
            message: JSON.stringify({
              shape: shape.shape,
              id: shape.id,
              action: "update",
            }),
            roomId: this.roomId,
          })
        );
      } else if (text) {
        const newShape: Shape = {
          type: "text",
          x,
          y,
          text,
          fontSize: 16,
          color: this.selectedColor,
          clientId: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          zIndex: this.zIndexCounter++,
        };
        this.existingShapes.push({ shape: newShape });
        this.socket.send(
          JSON.stringify({
            type: "chat",
            message: JSON.stringify({
              shape: newShape,
              action: "create",
            }),
            roomId: this.roomId,
          })
        );
      }
      this.textInput.remove();
      this.textInput = null;
      this.isEditingText = false;
      this.clearCanvas();
    });

    this.canvas.parentElement?.appendChild(this.textInput);
  }

  private wheelHandler = (e: WheelEvent): void => {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = this.zoomLevel * zoomFactor;
    if (newZoom < this.minZoom || newZoom > this.maxZoom) {
      return;
    }
    const worldX = (mouseX - this.offsetX) / this.zoomLevel;
    const worldY = (mouseY - this.offsetY) / this.zoomLevel;
    this.zoomLevel = newZoom;
    this.offsetX = mouseX - worldX * this.zoomLevel;
    this.offsetY = mouseY - worldY * this.zoomLevel;
    this.applyTransform();
    this.clearCanvas();
  };

  private keyDownHandler = (e: KeyboardEvent): void => {
    if (e.code === "Space" && !this.isPanning) {
      this.isPanning = true;
      this.canvas.style.cursor = "grab";
    }
  };

  private keyUpHandler = (e: KeyboardEvent): void => {
    if (e.code === "Space" && this.isPanning) {
      this.isPanning = false;
      this.canvas.style.cursor = "default";
    }
  };

  private mouseDownHandler = (e: MouseEvent): void => {
    if (this.isPanning || this.selectedTool === "hand") {
      this.clicked = true;
      this.canvas.style.cursor = "grabbing";
      const rect = this.canvas.getBoundingClientRect();
      this.lastPanPoint.x = e.clientX - rect.left;
      this.lastPanPoint.y = e.clientY - rect.top;
      return;
    }

    this.clicked = true;
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const canvasPoint = this.screenToCanvas(mouseX, mouseY);
    this.startX = canvasPoint.x;
    this.startY = canvasPoint.y;

    if (this.selectedTool === "text") {
      this.createTextInput(this.startX, this.startY);
      this.isEditingText = true;
      return;
    }

    if (this.selectedTool === "select") {
      this.isResizing = false;
      this.resizeCorner = null;
      if (this.selectedShape) {
        this.resizeCorner = this.isPointInHandle(
          this.selectedShape.shape,
          mouseX,
          mouseY
        );
        if (this.resizeCorner) {
          this.isResizing = true;
          return;
        }
        if (this.selectedShape.shape.type === "text") {
          this.createTextInput(
            this.selectedShape.shape.x,
            this.selectedShape.shape.y,
            this.selectedShape
          );
          this.isEditingText = true;
          return;
        }
      }
      this.selectedShape = null;
      const sortedShapes = [...this.existingShapes].sort(
        (a, b) => (b.shape.zIndex || 0) - (a.shape.zIndex || 0)
      );
      for (const item of sortedShapes) {
        if (this.isPointInShape(item.shape, mouseX, mouseY)) {
          this.selectedShape = item;
          this.isDragging = true;
          const shape = item.shape;
          if (shape.type === "rectangle") {
            this.dragOffsetX = this.startX - shape.x;
            this.dragOffsetY = this.startY - shape.y;
          } else if (shape.type === "circle") {
            this.dragOffsetX = this.startX - shape.x;
            this.dragOffsetY = this.startY - shape.y;
          } else if (shape.type === "line") {
            const midX = (shape.x1 + shape.x2) / 2;
            const midY = (shape.y1 + shape.y2) / 2;
            this.dragOffsetX = this.startX - midX;
            this.dragOffsetY = this.startY - midY;
          } else if (shape.type === "triangle") {
            const midX = (shape.x1 + shape.x2 + shape.x3) / 3;
            const midY = (shape.y1 + shape.y2 + shape.y3) / 3;
            this.dragOffsetX = this.startX - midX;
            this.dragOffsetY = this.startY - midY;
          } else if (shape.type === "pencil") {
            this.dragOffsetX = this.startX - shape.points[0].x;
            this.dragOffsetY = this.startY - shape.points[0].y;
          } else if (shape.type === "text") {
            this.dragOffsetX = this.startX - shape.x;
            this.dragOffsetY = this.startY - shape.y;
          }
          break;
        }
      }
      if (this.selectedShapeCallback) {
        this.selectedShapeCallback(this.selectedShape);
      }
      this.clearCanvas();
      return;
    }

    if (this.selectedTool === "eraser") {
      for (let i = this.existingShapes.length - 1; i >= 0; i--) {
        if (this.isPointInShape(this.existingShapes[i].shape, mouseX, mouseY)) {
          const deletedShape = this.existingShapes.splice(i, 1)[0];
          if (deletedShape.id) {
            this.socket.send(
              JSON.stringify({
                type: "chat",
                message: JSON.stringify({
                  id: deletedShape.id,
                  action: "delete",
                }),
                roomId: this.roomId,
              })
            );
          }
          this.clearCanvas();
          break;
        }
      }
      return;
    }

    if (this.selectedTool === "pencil") {
      const shape: Shape = {
        type: "pencil",
        points: [{ x: this.startX, y: this.startY }],
        color: this.selectedColor,
        clientId: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        zIndex: 0,
      };
      this.existingShapes.push({ shape });
    }
  };

  private mouseMoveHandler = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const canvasPoint = this.screenToCanvas(mouseX, mouseY);
    const currentX = canvasPoint.x;
    const currentY = canvasPoint.y;

    if (this.selectedTool === "select" && this.selectedShape) {
      const corner = this.isPointInHandle(
        this.selectedShape.shape,
        mouseX,
        mouseY
      );
      this.setCursorForHandle(corner);
    } else {
      this.setCursorForHandle(null);
    }

    if (!this.clicked) {
      return;
    }

    if (this.isPanning || this.selectedTool === "hand") {
      const dx = mouseX - this.lastPanPoint.x;
      const dy = mouseY - this.lastPanPoint.y;
      this.offsetX += dx;
      this.offsetY += dy;
      this.lastPanPoint.x = mouseX;
      this.lastPanPoint.y = mouseY;
      this.applyTransform();
      this.clearCanvas();
      return;
    }

    const dx = currentX - this.startX;
    const dy = currentY - this.startY;

    if (this.selectedTool === "text" || this.isEditingText) {
      return;
    }

    if (this.selectedTool === "select" && this.selectedShape) {
      const shape = this.selectedShape.shape;
      if (this.isResizing && this.resizeCorner) {
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
          } else if (this.resizeCorner === "top-right") {
            shape.y += dy;
            shape.width += dx;
            shape.height -= dy;
            if (shape.width < 10) shape.width = 10;
            if (shape.height < 10) {
              shape.y -= 10 - shape.height;
              shape.height = 10;
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
          } else if (this.resizeCorner === "bottom-right") {
            shape.width += dx;
            shape.height += dy;
            if (shape.width < 10) shape.width = 10;
            if (shape.height < 10) shape.height = 10;
          }
        } else if (shape.type === "circle") {
          if (this.resizeCorner === "left" || this.resizeCorner === "right") {
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
        } else if (shape.type === "triangle") {
          if (this.resizeCorner === "vertex1") {
            shape.x1 = currentX;
            shape.y1 = currentY;
          } else if (this.resizeCorner === "vertex2") {
            shape.x2 = currentX;
            shape.y2 = currentY;
          } else if (this.resizeCorner === "vertex3") {
            shape.x3 = currentX;
            shape.y3 = currentY;
          }
        } else if (shape.type === "text") {
          this.ctx.font = `${shape.fontSize}px Arial`;
          const originalWidth = this.ctx.measureText(shape.text).width;
          const newWidth = originalWidth + dx;
          const scaleFactor = newWidth / originalWidth;
          shape.fontSize = Math.max(12, shape.fontSize * scaleFactor);
        }
        this.startX = currentX;
        this.startY = currentY;
        this.clearCanvas();
        return;
      }

      if (this.isDragging) {
        if (shape.type === "rectangle") {
          shape.x = currentX - this.dragOffsetX;
          shape.y = currentY - this.dragOffsetY;
        } else if (shape.type === "circle") {
          shape.x = currentX - this.dragOffsetX;
          shape.y = currentY - this.dragOffsetY;
        } else if (shape.type === "line") {
          const midXOld = (shape.x1 + shape.x2) / 2;
          const midYOld = (shape.y1 + shape.y2) / 2;
          const deltaX = currentX - this.dragOffsetX - midXOld;
          const deltaY = currentY - this.dragOffsetY - midYOld;
          shape.x1 += deltaX;
          shape.y1 += deltaY;
          shape.x2 += deltaX;
          shape.y2 += deltaY;
        } else if (shape.type === "triangle") {
          const midXOld = (shape.x1 + shape.x2 + shape.x3) / 3;
          const midYOld = (shape.y1 + shape.y2 + shape.y3) / 3;
          const deltaX = currentX - this.dragOffsetX - midXOld;
          const deltaY = currentY - this.dragOffsetY - midYOld;
          shape.x1 += deltaX;
          shape.y1 += deltaY;
          shape.x2 += deltaX;
          shape.y2 += deltaY;
          shape.x3 += deltaX;
          shape.y3 += deltaY;
        } else if (shape.type === "pencil") {
          const deltaX = currentX - this.dragOffsetX - shape.points[0].x;
          const deltaY = currentY - this.dragOffsetY - shape.points[0].y;
          shape.points = shape.points.map((point) => ({
            x: point.x + deltaX,
            y: point.y + deltaY,
          }));
          this.dragOffsetX = currentX - shape.points[0].x;
          this.dragOffsetY = currentY - shape.points[0].y;
        } else if (shape.type === "text") {
          shape.x = currentX - this.dragOffsetX;
          shape.y = currentY - this.dragOffsetY;
        }
        this.clearCanvas();
        return;
      }
    }

    if (this.selectedTool === "pencil") {
      const lastShape = this.existingShapes[this.existingShapes.length - 1];
      if (lastShape.shape.type === "pencil") {
        lastShape.shape.points.push({ x: currentX, y: currentY });
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.selectedColor;
        this.ctx.moveTo(
          lastShape.shape.points[lastShape.shape.points.length - 2].x,
          lastShape.shape.points[lastShape.shape.points.length - 2].y
        );
        this.ctx.lineTo(currentX, currentY);
        this.ctx.stroke();
        this.ctx.restore();
      }
      return;
    }

    const width = currentX - this.startX;
    const height = currentY - this.startY;
    this.clearCanvas();
    this.ctx.strokeStyle = this.selectedColor;

    switch (this.selectedTool) {
      case "rectangle":
        this.ctx.strokeRect(this.startX, this.startY, width, height);
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
        this.ctx.closePath();
        break;
      case "line":
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(currentX, currentY);
        this.ctx.stroke();
        this.ctx.closePath();
        break;
      case "triangle":
        const midX = this.startX + width / 2;
        this.ctx.beginPath();
        this.ctx.moveTo(midX, this.startY);
        this.ctx.lineTo(this.startX, this.startY + height);
        this.ctx.lineTo(this.startX + width, this.startY + height);
        this.ctx.closePath();
        this.ctx.stroke();
        break;
    }
  };

  private mouseUpHandler = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const canvasPoint = this.screenToCanvas(mouseX, mouseY);
    const endX = canvasPoint.x;
    const endY = canvasPoint.y;

    this.clicked = false;

    if (this.isPanning || this.selectedTool === "hand") {
      this.canvas.style.cursor = "grab";
      return;
    }

    if (!this.selectedTool) return;

    if (this.selectedTool === "text" || this.isEditingText) {
      return;
    }

    if (this.selectedTool === "select" && this.selectedShape) {
      if (this.isDragging || this.isResizing) {
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
        const index = this.existingShapes.findIndex(
          (item) => item === this.selectedShape
        );
        if (index !== -1 && this.isDragging) {
          this.socket.send(
            JSON.stringify({
              type: "move",
              message: JSON.stringify({
                index,
                newShape: this.selectedShape.shape,
              }),
              roomId: this.roomId,
            })
          );
        }
      }
      this.isDragging = false;
      this.isResizing = false;
      this.resizeCorner = null;
      this.clearCanvas();
      return;
    }

    if (this.selectedTool === "pencil") {
      const shape = this.existingShapes[this.existingShapes.length - 1].shape;
      if (shape.type === "pencil" && shape.points.length > 1) {
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
      }
      this.clearCanvas();
      return;
    }

    if (
      this.selectedTool !== "rectangle" &&
      this.selectedTool !== "circle" &&
      this.selectedTool !== "line" &&
      this.selectedTool !== "triangle"
    ) {
      return;
    }

    const width = endX - this.startX;
    const height = endY - this.startY;
    const clientId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    let shape: Shape;
    switch (this.selectedTool) {
      case "rectangle":
        shape = {
          type: "rectangle",
          x: this.startX,
          y: this.startY,
          width,
          height,
          color: this.selectedColor,
          clientId,
          zIndex: this.zIndexCounter++,
        };
        break;
      case "circle":
        shape = {
          type: "circle",
          x: this.startX + width / 2,
          y: this.startY + height / 2,
          radius: Math.sqrt((width * width + height * height) / 4),
          color: this.selectedColor,
          clientId,
          zIndex: this.zIndexCounter++,
        };
        break;
      case "line":
        shape = {
          type: "line",
          x1: this.startX,
          y1: this.startY,
          x2: endX,
          y2: endY,
          color: this.selectedColor,
          clientId,
          zIndex: this.zIndexCounter++,
        };
        break;
      case "triangle":
        shape = {
          type: "triangle",
          x1: this.startX + width / 2,
          y1: this.startY,
          x2: this.startX,
          y2: this.startY + height,
          x3: this.startX + width,
          y3: this.startY + height,
          color: this.selectedColor,
          clientId,
          zIndex: this.zIndexCounter++,
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
    this.clearCanvas();
  };

  private initMouseHandler(): void {
    this.canvas.addEventListener("mousedown", this.mouseDownHandler);
    this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
    this.canvas.addEventListener("mouseup", this.mouseUpHandler);
    this.canvas.addEventListener("wheel", this.wheelHandler);
    window.addEventListener("keydown", this.keyDownHandler);
    window.addEventListener("keyup", this.keyUpHandler);
  }

  resetView(): void {
    // Placeholder - functionality removed
  }

  centerView(): void {
    if (this.existingShapes.length === 0) {
      this.resetView();
      return;
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    this.existingShapes.forEach((item) => {
      const shape = item.shape;
      if (shape.type === "rectangle") {
        minX = Math.min(minX, shape.x);
        minY = Math.min(minY, shape.y);
        maxX = Math.max(maxX, shape.x + shape.width);
        maxY = Math.max(maxY, shape.y + shape.height);
      } else if (shape.type === "circle") {
        minX = Math.min(minX, shape.x - shape.radius);
        minY = Math.min(minY, shape.y - shape.radius);
        maxX = Math.max(maxX, shape.x + shape.radius);
        maxY = Math.max(maxY, shape.y + shape.radius);
      } else if (shape.type === "triangle") {
        minX = Math.min(minX, shape.x1, shape.x2, shape.x3);
        minY = Math.min(minY, shape.y1, shape.y2, shape.y3);
        maxX = Math.max(maxX, shape.x1, shape.x2, shape.x3);
        maxY = Math.max(maxY, shape.y1, shape.y2, shape.y3);
      } else if (shape.type === "line") {
        minX = Math.min(minX, shape.x1, shape.x2);
        minY = Math.min(minY, shape.y1, shape.y2);
        maxX = Math.max(maxX, shape.x1, shape.x2);
        maxY = Math.max(maxY, shape.y1, shape.y2);
      } else if (shape.type === "pencil") {
        shape.points.forEach((point) => {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        });
      } else if (shape.type === "text") {
        this.ctx.font = `${shape.fontSize}px Arial`;
        const metrics = this.ctx.measureText(shape.text);
        const textWidth = metrics.width;
        const textHeight = shape.fontSize;
        minX = Math.min(minX, shape.x);
        minY = Math.min(minY, shape.y - textHeight);
        maxX = Math.max(maxX, shape.x + textWidth);
        maxY = Math.max(maxY, shape.y);
      }
    });
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const width = maxX - minX;
    const height = maxY - minY;
    const widthZoom = this.canvas.width / (width + 100);
    const heightZoom = this.canvas.height / (height + 100);
    this.zoomLevel = Math.min(widthZoom, heightZoom, 1);
    this.offsetX = this.canvas.width / 2 - centerX * this.zoomLevel;
    this.offsetY = this.canvas.height / 2 - centerY * this.zoomLevel;
    this.applyTransform();
    this.clearCanvas();
  }

  updateShape(shape: ShapeWithId): void {
    const index = this.existingShapes.findIndex((item) => item.id === shape.id);
    if (index !== -1) {
      this.existingShapes[index] = shape;
      this.socket.send(
        JSON.stringify({
          type: "chat",
          message: JSON.stringify({
            shape: shape.shape,
            id: shape.id,
            action: "update",
          }),
          roomId: this.roomId,
        })
      );
      this.clearCanvas();
    }
  }

  editText(shape: ShapeWithId): void {
    if (shape.shape.type === "text") {
      this.createTextInput(shape.shape.x, shape.shape.y, shape);
      this.isEditingText = true;
    }
  }
}
