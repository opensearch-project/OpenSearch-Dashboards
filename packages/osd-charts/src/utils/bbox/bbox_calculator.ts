import { Option } from 'fp-ts/lib/Option';

export interface BBox {
  width: number;
  height: number;
}

export interface BBoxCalculator {
  compute(text: string, padding: number, fontSize?: number, fontFamily?: string): Option<BBox>;
  destroy(): void;
}
