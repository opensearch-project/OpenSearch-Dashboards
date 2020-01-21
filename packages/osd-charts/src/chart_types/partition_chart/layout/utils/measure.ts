import { TextMeasure } from '../types/types';

export function measureText(ctx: CanvasRenderingContext2D): TextMeasure {
  return (font: string, texts: string[]): TextMetrics[] => {
    ctx.font = font;
    return texts.map((text) => ctx.measureText(text));
  };
}
