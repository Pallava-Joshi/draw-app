// app/draw/type.ts
export type Shape =
  | {
      type: "rectangle";
      x: number;
      y: number;
      width: number;
      height: number;
      color?: string;
      id?: number;
      clientId?: string;
    }
  | {
      type: "circle";
      x: number;
      y: number;
      radius: number;
      color?: string;
      id?: number;
      clientId?: string;
    }
  | {
      type: "line";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color?: string;
      id?: number;
      clientId?: string;
    }
  | {
      type: "pencil";
      points: { x: number; y: number }[];
      color?: string;
      id?: number;
      clientId?: string;
    }
  | {
      type: "triangle";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      x3: number;
      y3: number;
      color?: string;
      id?: number;
      clientId?: string;
    };

export type Tool =
  | "rectangle"
  | "circle"
  | "line"
  | "pencil"
  | "triangle"
  | "select"
  | "eraser"
  | "hand";

export interface ShapeWithId {
  id?: number;
  clientId?: string;
  shape: Shape;
}
