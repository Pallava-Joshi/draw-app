export type Shape = {
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
} | {
    type: "select";
}

export type Tool = "rectangle" | "circle" | "line" | "hand" | "select" | "eraser";
