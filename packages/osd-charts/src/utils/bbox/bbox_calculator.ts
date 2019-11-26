export interface BBox {
  width: number;
  height: number;
}

export const DEFAULT_EMPTY_BBOX = {
  width: 0,
  height: 0,
};

export interface BBoxCalculator {
  compute(text: string, padding: number, fontSize?: number, fontFamily?: string): BBox;
  destroy(): void;
}
