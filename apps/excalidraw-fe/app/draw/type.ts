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
      zIndex?: number;
    }
  | {
      type: "circle";
      x: number;
      y: number;
      radius: number;
      color?: string;
      id?: number;
      clientId?: string;
      zIndex?: number;
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
      zIndex?: number;
    }
  | {
      type: "pencil";
      points: { x: number; y: number }[];
      color?: string;
      id?: number;
      clientId?: string;
      zIndex?: number;
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
      zIndex?: number;
    }
  | {
      type: "text";
      x: number;
      y: number;
      text: string;
      fontSize: number;
      color?: string;
      id?: number;
      clientId?: string;
      zIndex?: number;
    };

export type ShapeWithId = {
  shape: Shape;
  id?: number;
};

export type Tool =
  | "rectangle"
  | "circle"
  | "line"
  | "pencil"
  | "triangle"
  | "text"
  | "select"
  | "eraser"
  | "hand";
