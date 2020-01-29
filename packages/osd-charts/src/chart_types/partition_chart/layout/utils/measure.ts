import { Box, Font, TextMeasure } from '../types/types';
import { Pixels } from '../types/geometry_types';

export function cssFontShorthand({ fontStyle, fontVariant, fontWeight, fontFamily }: Font, fontSize: Pixels) {
  return `${fontStyle} ${fontVariant} ${fontWeight} ${fontSize}px ${fontFamily}`;
}

export function measureText(ctx: CanvasRenderingContext2D): TextMeasure {
  return (fontSize: number, boxes: Box[]): TextMetrics[] =>
    boxes.map((box: Box) => {
      ctx.font = cssFontShorthand(box, fontSize);
      return ctx.measureText(box.text);
    });
}
